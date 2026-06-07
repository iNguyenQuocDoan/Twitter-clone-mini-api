Write ARCHITECTURE.md for Backend (Feature-based) based on:
- Project context above
- DATABASE.md: 12 tables grouped into 6 features (auth, user-profile, product, cart, order, review)
- PROJECT-RULES.md: NestJS v11, TypeORM, feature-based organization

## Requirements

### 1. System Overview
- High-level architecture diagram (mermaid)
- Monolith with feature-based modules
- Feature-based organization rationale:
  - Each feature = 1 NestJS module
  - Self-contained: controller + service + repository + entities
  - Easy to extract to microservices later if needed

System components:
- Client (React) → NestJS API → MySQL Database
- JWT Authentication
- File storage for product images

### 2. Folder Structure
```
src/
├── main.ts                     # Bootstrap application
├── app.module.ts               # Root module, imports all features
├── config/
│   ├── database.config.ts      # TypeORM configuration
│   ├── jwt.config.ts           # JWT settings
│   └── app.config.ts           # General app settings
├── shared/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── public.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   ├── transform.interceptor.ts
│   │   └── logging.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   ├── utils/
│   │   ├── pagination.util.ts
│   │   └── hash.util.ts
│   └── types/
│       ├── response.type.ts
│       └── pagination.type.ts
├── core/
│   ├── database/
│   │   └── database.module.ts  # TypeORM connection
│   └── logger/
│       └── logger.module.ts    # Custom logger setup
└── features/
    ├── auth/                   # roles, users, JWT
    ├── user-profile/           # addresses
    ├── product/                # categories, products, variants, images
    ├── cart/                   # carts, cart_items
    ├── order/                  # orders, order_items
    └── review/                 # reviews
```
### 3. Feature Anatomy
```
features/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── repositories/
│   ├── user.repository.ts
│   └── role.repository.ts
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   └── auth-response.dto.ts
├── entities/
│   ├── user.entity.ts
│   └── role.entity.ts
├── types/
│   └── jwt-payload.type.ts
├── strategies/
│   └── jwt.strategy.ts
├── tests/
│   ├── auth.controller.spec.ts
│   └── auth.service.spec.ts
└── CONTEXT.md

features/product/
├── product.module.ts
├── controllers/
│   ├── category.controller.ts
│   ├── product.controller.ts
│   └── product-variant.controller.ts
├── services/
│   ├── category.service.ts
│   ├── product.service.ts
│   └── product-variant.service.ts
├── repositories/
│   ├── category.repository.ts
│   ├── product.repository.ts
│   ├── product-variant.repository.ts
│   └── product-image.repository.ts
├── dto/
├── entities/
│   ├── category.entity.ts
│   ├── product.entity.ts
│   ├── product-variant.entity.ts
│   └── product-image.entity.ts
├── tests/
└── CONTEXT.md

features/order/
├── order.module.ts
├── order.controller.ts
├── services/
│   ├── order.service.ts
│   └── checkout.service.ts     # Handles cart → order conversion
├── repositories/
│   ├── order.repository.ts
│   └── order-item.repository.ts
├── dto/
│   ├── create-order.dto.ts
│   └── order-response.dto.ts
├── entities/
│   ├── order.entity.ts
│   └── order-item.entity.ts
├── types/
│   ├── order-status.type.ts
│   └── payment-status.type.ts
├── tests/
└── CONTEXT.md
```
### 4. Request Flow
```
Request → Middleware → Guard → Controller → Service → Repository → Database
                                    ↓
                              Response ← Interceptor
```
Layer responsibilities:
- Middleware: logging, cors, body parsing
- Guard: JWT validation, role checking
- Controller: routing, DTO validation, call service, format response
- Service: business logic, orchestrate repositories, handle transactions
- Repository: data access, TypeORM queries, no business logic

Example flow - Checkout:
1. POST /orders/checkout
2. JwtAuthGuard validates token
3. OrderController receives CreateOrderDto
4. CheckoutService:
   - Get cart from CartRepository
   - Validate stock via ProductVariantRepository
   - Create order with snapshot data (JSON address, product info)
   - Clear cart
   - Use transaction (QueryRunner)
5. Return order response

### 5. Cross-feature Communication

Allowed methods:
- Module imports (NestJS DI):
  - OrderModule imports ProductModule to access ProductVariantRepository
  - ReviewModule imports OrderModule to verify purchase
- Shared services:
  - PaginationService in shared/
- Event-based (async):
  - OrderCreatedEvent → notify inventory, send email
  - Use @nestjs/event-emitter

Forbidden:
- Direct import: import { UserService } from '../auth/auth.service' ❌
- Must use: Module exports + DI injection ✅

Feature dependencies:
- auth: standalone (no dependencies)
- user-profile: depends on auth (user entity)
- product: standalone
- cart: depends on auth (user), product (variants)
- order: depends on auth (user), product (variants), cart (checkout)
- review: depends on auth (user), product, order (verified purchase)

### 6. Shared vs Core

| Shared | Core |
|--------|------|
| @CurrentUser() decorator | TypeORM database connection |
| @Roles() decorator | Logger configuration |
| JwtAuthGuard, RolesGuard | Environment config loading |
| HttpExceptionFilter | |
| TransformInterceptor | |
| ValidationPipe config | |
| Pagination utilities | |
| Hash utilities (bcrypt) | |
| Response/Pagination types | |

### 7. Configuration Management

Environment variables (.env):
- DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
- JWT_SECRET, JWT_EXPIRES_IN
- PORT, NODE_ENV

Config structure:
- config/database.config.ts → TypeOrmModuleOptions
- config/jwt.config.ts → JwtModuleOptions
- Use @nestjs/config ConfigService

Secrets handling:
- Never commit .env to git
- Use .env.example as template
- Production: use environment variables or secret manager

## Format
- Mermaid diagrams for system overview and request flow
- Folder structure with inline comments
- Max 150-200 lines

## NestJS-Specific Additions
- Global modules: ConfigModule, TypeOrmModule
- Feature modules: forwardRef() for circular dependencies (avoid if possible)
- Dynamic modules for config (ConfigModule.forRoot())
- Async providers for database connection
- Global pipes, filters, interceptors registered in main.ts
- Transaction handling via QueryRunner in checkout flow
- Entity listeners for timestamps (@BeforeInsert, @BeforeUpdate)