Write API_SPEC.md based on:
- Project context above
- DATABASE.md: 12 tables, 6 features (auth, user-profile, product, cart, order, review)
- BE ARCHITECTURE.md: NestJS v11, feature-based modules, JWT authentication

## Requirements

### 1. Overview
- Base URL: /api/v1
- API versioning: URL path (/api/v1/, /api/v2/)
- Content-Type: application/json
- Character encoding: UTF-8

### 2. Authentication
- Auth method: JWT Bearer Token
- Header format: Authorization: Bearer <access_token>
- Token flow:
  - Access token: short-lived (15 minutes)
  - Refresh token: long-lived (7 days), stored in httpOnly cookie
  - Refresh endpoint to get new access token
- Protected routes: all except login, register, public product listing
- Auth error responses:
  - 401 Unauthorized: missing/invalid/expired token
  - 403 Forbidden: valid token but insufficient role

### 3. Request Conventions

Pagination (query params):
- page: number (default: 1)
- limit: number (default: 10, max: 100)
- Example: GET /products?page=2&limit=20

Sorting:
- sort: field name
- order: asc | desc
- Example: GET /products?sort=created_at&order=desc

Filtering:
- Filter by field: ?field=value
- Multiple values: ?status=pending,confirmed
- Range: ?min_price=100&max_price=500
- Example: GET /products?category_id=5&is_active=true

Request body:
- JSON format
- camelCase for field names (transform to snake_case in backend)

File upload:
- Content-Type: multipart/form-data
- Field name: file (single) or files (multiple)
- Max size: 5MB per file
- Allowed types: image/jpeg, image/png, image/webp

### 4. Response Format
```
Success (single item):
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}

Success (list with pagination):
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}

Error:
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials",
    "details": { ... }  // Optional, for validation errors
  }
}
```
### 5. Error Codes

Code format: [FEATURE]_[NUMBER]
- AUTH_001 - AUTH_099: Authentication errors
- USER_001 - USER_099: User profile errors
- PROD_001 - PROD_099: Product errors
- CART_001 - CART_099: Cart errors
- ORD_001 - ORD_099: Order errors
- REV_001 - REV_099: Review errors
- SYS_001 - SYS_099: System errors

Common error codes:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_001 | 401 | Invalid credentials |
| AUTH_002 | 401 | Token expired |
| AUTH_003 | 401 | Token invalid |
| AUTH_004 | 403 | Insufficient permissions |
| AUTH_005 | 400 | Email already exists |
| PROD_001 | 404 | Product not found |
| PROD_002 | 404 | Variant not found |
| PROD_003 | 400 | Insufficient stock |
| CART_001 | 404 | Cart not found |
| CART_002 | 400 | Cart is empty |
| ORD_001 | 404 | Order not found |
| ORD_002 | 400 | Cannot cancel order (already shipped) |
| REV_001 | 400 | Already reviewed this product |
| REV_002 | 403 | Must purchase before review |
| SYS_001 | 500 | Internal server error |
| SYS_002 | 400 | Validation error |

HTTP status usage:
- 200: Success (GET, PUT, PATCH)
- 201: Created (POST)
- 204: No content (DELETE)
- 400: Bad request / Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 409: Conflict (duplicate)
- 500: Internal server error

### 6. Endpoints by Feature

**Auth Feature:**
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /auth/register | Register new user | No |
| POST | /auth/login | Login, get tokens | No |
| POST | /auth/refresh | Refresh access token | No (uses refresh cookie) |
| POST | /auth/logout | Logout, clear tokens | Yes |
| GET | /auth/me | Get current user profile | Yes |
| PATCH | /auth/me | Update current user profile | Yes |
| PATCH | /auth/change-password | Change password | Yes |

**User Profile Feature (Addresses):**
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /addresses | List user's addresses | Yes |
| POST | /addresses | Create new address | Yes |
| GET | /addresses/:id | Get address detail | Yes |
| PATCH | /addresses/:id | Update address | Yes |
| DELETE | /addresses/:id | Delete address | Yes |
| PATCH | /addresses/:id/default | Set as default address | Yes |

**Product Feature:**
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /categories | List categories (nested tree) | No |
| GET | /categories/:slug | Get category with products | No |
| GET | /products | List products (paginated, filterable) | No |
| GET | /products/:slug | Get product detail with variants | No |
| GET | /products/:id/variants | List product variants | No |
| GET | /variants/:id | Get variant detail (stock, price) | No |
| --- Admin endpoints --- | | | |
| POST | /admin/categories | Create category | Yes (Admin) |
| PATCH | /admin/categories/:id | Update category | Yes (Admin) |
| DELETE | /admin/categories/:id | Delete category | Yes (Admin) |
| POST | /admin/products | Create product | Yes (Admin) |
| PATCH | /admin/products/:id | Update product | Yes (Admin) |
| DELETE | /admin/products/:id | Soft delete product | Yes (Admin) |
| POST | /admin/products/:id/variants | Create variant | Yes (Admin) |
| PATCH | /admin/variants/:id | Update variant (stock, price) | Yes (Admin) |
| POST | /admin/products/:id/images | Upload product images | Yes (Admin) |
| DELETE | /admin/images/:id | Delete product image | Yes (Admin) |

**Cart Feature:**
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /cart | Get current cart | No* |
| POST | /cart/items | Add item to cart | No* |
| PATCH | /cart/items/:id | Update item quantity | No* |
| DELETE | /cart/items/:id | Remove item from cart | No* |
| DELETE | /cart | Clear cart | No* |
| POST | /cart/merge | Merge guest cart after login | Yes |

*Guest cart uses session_id from cookie; logged-in users use user_id

**Order Feature:**
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /orders | List user's orders | Yes |
| GET | /orders/:id | Get order detail | Yes |
| POST | /orders/checkout | Create order from cart | Yes |
| PATCH | /orders/:id/cancel | Cancel order (if pending) | Yes |
| --- Admin endpoints --- | | | |
| GET | /admin/orders | List all orders (filterable) | Yes (Admin) |
| PATCH | /admin/orders/:id/status | Update order status | Yes (Admin) |
| PATCH | /admin/orders/:id/payment | Update payment status | Yes (Admin) |

**Review Feature:**
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /products/:id/reviews | List product reviews | No |
| POST | /products/:id/reviews | Create review (must have purchased) | Yes |
| PATCH | /reviews/:id | Update own review | Yes |
| DELETE | /reviews/:id | Delete own review | Yes |
| --- Admin endpoints --- | | | |
| DELETE | /admin/reviews/:id | Delete any review | Yes (Admin) |

### 7. Endpoint Details (complex endpoints)

**POST /auth/register**
```
Request:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "Nguyen Van A",
  "phone": "0901234567"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "role": "customer"
  },
  "message": "Registration successful"
}

Error cases:
- AUTH_005: Email already exists (409)
- SYS_002: Validation error - invalid email format (400)
```
**POST /orders/checkout**
```
Request:
{
  "addressId": 5,
  "paymentMethod": "cod",
  "note": "Please call before delivery"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 100,
    "status": "pending",
    "paymentMethod": "cod",
    "paymentStatus": "unpaid",
    "shippingFee": 30000,
    "totalAmount": 530000,
    "shippingAddress": {
      "fullName": "Nguyen Van A",
      "phone": "0901234567",
      "addressLine": "123 ABC Street",
      "city": "Ho Chi Minh"
    },
    "items": [
      {
        "productName": "Ao thun nam",
        "sku": "ATN-WHITE-L",
        "price": 250000,
        "quantity": 2,
        "thumbnailUrl": "https://..."
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}

Error cases:
- CART_002: Cart is empty (400)
- PROD_003: Insufficient stock for variant X (400)
- USER_001: Address not found (404)

Business logic:
- Validate stock for all cart items
- Snapshot product info (name, sku, price, thumbnail) to order_items
- Snapshot address to shipping_address JSON
- Deduct stock from product_variants
- Clear cart after successful order
- Use database transaction
```
**POST /products/:id/reviews**
```
Request:
{
  "orderId": 100,
  "rating": 5,
  "comment": "Great product, fast delivery!"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 50,
    "rating": 5,
    "comment": "Great product, fast delivery!",
    "createdAt": "2024-01-20T15:00:00Z",
    "user": {
      "id": 1,
      "fullName": "Nguyen Van A"
    }
  }
}

Error cases:
- REV_002: Must purchase product before review (403) - order doesn't contain this product
- REV_001: Already reviewed this product from this order (400)
- ORD_001: Order not found (404)
```
## Format
- Group by feature
- Tables for endpoint list
- Code blocks for request/response examples

## NestJS-Specific Additions
- Use @ApiTags, @ApiOperation, @ApiResponse for Swagger documentation
- DTOs with class-validator decorators
- Use @Query() for pagination/filter params
- Use @Param() for URL params
- Use @Body() for request body
- Custom @CurrentUser() decorator for authenticated user
- @Roles('admin') decorator for admin-only endpoints
- Consider adding rate limiting for auth endpoints