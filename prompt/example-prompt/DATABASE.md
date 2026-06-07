Write DATABASE.md based on the project context above.

## Core Features
- Auth & User Management: roles, users, refresh_tokens, addresses
- Product Catalog: categories, products, product_variants, product_images
- Shopping Cart: carts, cart_items
- Order Management: orders, order_items
- Review System: reviews

## Requirements

### 1. Overview
- Database: MySQL 8.x
- ORM: TypeORM (with NestJS)
- Naming conventions:
  - Tables: snake_case, plural (users, products, orders)
  - Columns: snake_case (created_at, user_id)
  - Foreign keys: [singular_table]_id
  - Indexes: idx_[table]_[column]

### 2. Entities by Feature

**Auth Feature:**
- roles (id, name)
- users (id, role_id, email, password_hash, full_name, phone, is_active, timestamps)
- refresh_tokens (id, user_id, token_hash, device_name, ip_address, user_agent, expires_at, is_revoked, created_at) — supports multi-device login, one user has many tokens

**User Profile Feature:**
- addresses (id, user_id, full_name, phone, address_line, city, is_default)

**Product Catalog Feature:**
- categories (id, parent_id, name, slug) — self-referencing for nested categories
- products (id, category_id, name, slug, description, thumbnail_url, is_active, timestamps)
- product_variants (id, product_id, sku, color, size, price, sale_price, stock_quantity) — KEY: cart & order link here, NOT products
- product_images (id, product_id, image_url, sort_order)

**Shopping Cart Feature:**
- carts (id, user_id nullable, session_id, created_at) — nullable user_id for guest cart
- cart_items (id, cart_id, product_variant_id, quantity)

**Order Feature:**
- orders (id, user_id, status, payment_method, payment_status, shipping_fee, total_amount, shipping_address JSON, created_at)
- order_items (id, order_id, product_variant_id, product_name, sku, price, quantity, thumbnail_url) — snapshot data for history integrity

**Review Feature:**
- reviews (id, user_id, product_id, order_id, rating, comment, created_at) — 3-way link ensures verified purchases

### 3. Relationships
Key relationships:
- roles 1:N users
- users 1:N refresh_tokens, addresses, carts, orders, reviews
- categories 1:N categories (self-ref), products
- products 1:N product_variants, product_images, reviews
- product_variants 1:N cart_items, order_items (CRITICAL: transaction center)
- carts 1:N cart_items
- orders 1:N order_items, reviews

Special cases:
- orders.shipping_address = JSON snapshot (NOT FK) — preserves address after user edits/deletes
- order_items stores snapshot (name, price, sku, thumbnail) — preserves history if product changes
- refresh_tokens: one user can have multiple active tokens (multi-device support)
  - On logout: revoke specific token (is_revoked = true)
  - On "logout all devices": revoke all tokens for user
  - On refresh: validate token_hash, check expires_at and is_revoked

### 4. Conventions
- Primary key: Auto-increment BIGINT (id)
- Soft delete: is_active flag (users, products), is_revoked flag (refresh_tokens)
- Timestamps: created_at, updated_at (TypeORM auto-managed)
- Enums stored as strings: status (pending/confirmed/shipping/delivered/cancelled), payment_status (unpaid/paid)
- Token storage: store hashed token (token_hash), never plain text

### 5. Migration Rules
- Format: [timestamp]_[description].ts
- Always reversible (up/down methods)
- No data loss on rollback

## Format
- Use tables for field definitions
- Group by feature
- Include mermaid ERD diagram
- Max 150-200 lines

## TypeORM-Specific
- Use @Entity, @Column, @ManyToOne, @OneToMany decorators
- Enable cascade where appropriate (cart → cart_items)
- Use eager loading sparingly
- Index on refresh_tokens.token_hash for fast lookup
- Index on refresh_tokens.user_id for "logout all devices" query
- Periodic cleanup job for expired/revoked tokens

## refresh_tokens Table Details
Table: refresh_tokens
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| user_id | BIGINT | FK → users, NOT NULL | Owner of token |
| token_hash | VARCHAR(255) | NOT NULL, UNIQUE | Hashed refresh token (never store plain) |
| device_name | VARCHAR(100) | NULLABLE | "Chrome on Windows", "Mobile App iOS" |
| ip_address | VARCHAR(45) | NULLABLE | IPv4 or IPv6 |
| user_agent | VARCHAR(255) | NULLABLE | Browser/app user agent |
| expires_at | DATETIME | NOT NULL | Token expiration time |
| is_revoked | BOOLEAN | DEFAULT FALSE | Soft revoke without delete |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

Indexes:
- idx_refresh_tokens_token_hash (token_hash) — fast token lookup
- idx_refresh_tokens_user_id (user_id) — find all tokens for user
- idx_refresh_tokens_expires_at (expires_at) — cleanup expired tokens

Use cases:
- Login: create new refresh_token record
- Refresh: find by token_hash, check expires_at & is_revoked, issue new access token
- Logout: set is_revoked = true for current token
- Logout all devices: set is_revoked = true for all user's tokens
- View active sessions: list non-revoked, non-expired tokens for user