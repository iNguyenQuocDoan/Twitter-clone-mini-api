Write PROJECT-RULES.md for Backend (Feature-based) based on the project context above.

## Tech Stack
- Language: TypeScript
- Framework: NestJS v11
- ORM: TypeORM
- Database: MySQL 8.x

## Requirements

### 1. Feature Structure
```
src/
├── features/
│   ├── auth/           # roles, users, JWT, guards
│   ├── user-profile/   # addresses management
│   ├── product/        # categories, products, variants, images
│   ├── cart/           # carts, cart_items, guest cart merge
│   ├── order/          # orders, order_items, checkout
│   └── review/         # reviews, ratings
├── shared/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
└── config/
```
Each feature folder:
```
features/[feature-name]/
├── [feature].module.ts
├── [feature].controller.ts
├── [feature].service.ts
├── repositories/
│   └── [entity].repository.ts
├── dto/
│   ├── create-[entity].dto.ts
│   └── update-[entity].dto.ts
├── entities/
│   └── [entity].entity.ts
├── types/
│   └── [feature].types.ts
├── tests/
│   ├── [feature].controller.spec.ts
│   └── [feature].service.spec.ts
└── CONTEXT.md
```
### 2. Naming Conventions
- Feature folders: kebab-case (user-profile, product)
- Files: kebab-case (create-user.dto.ts, user.entity.ts)
- Classes: PascalCase (UserService, CreateUserDto)
- Functions/Methods: camelCase (findById, createOrder)
- Variables: camelCase (userId, cartItems)
- Constants: UPPER_SNAKE_CASE (MAX_CART_ITEMS, ORDER_STATUS)
- Interfaces/Types: PascalCase with prefix I or suffix Type (IUserPayload, OrderStatusType)
- Entities: PascalCase singular (User, Product, ProductVariant)

### 3. Feature Rules
- Feature must be self-contained with its own module
- No direct imports between features
- Cross-feature communication via:
  - Shared services in shared/ folder
  - NestJS EventEmitter for async events
  - Module exports/imports through NestJS DI
- Shared code location: src/shared/
- Feature dependencies declared explicitly in module imports

Feature boundaries for this project:
- auth: handles roles, users, authentication (JWT)
- user-profile: handles addresses only
- product: handles categories, products, product_variants, product_images
- cart: handles carts, cart_items (references product_variants)
- order: handles orders, order_items, checkout flow (snapshots data from product_variants)
- review: handles reviews (links users, products, orders)

### 4. Code Patterns (MUST follow)

**Error handling:**
- Use NestJS built-in exceptions (NotFoundException, BadRequestException, etc.)
- Custom exceptions extend HttpException
- Global exception filter in shared/filters/

**Validation:**
- Use class-validator decorators in DTOs
- ValidationPipe enabled globally
- Transform enabled for type coercion

**Logging:**
- Use NestJS built-in Logger
- Log at service level, not controller
- Format: [FeatureName] action - context

**Response format:**
- Success: { data, message?, meta? }
- Error: { statusCode, message, error }
- Pagination: { data, meta: { page, limit, total, totalPages } }

**Repository pattern:**
- Each entity has dedicated repository
- Complex queries in repository, not service
- Use QueryBuilder for joins/complex queries

### 5. Anti-patterns (MUST NOT do)
- Import directly from another feature's internal files (use module exports)
- Circular dependencies between features
- Business logic in controllers (controllers only handle HTTP)
- Raw SQL or TypeORM queries in services (use repositories)
- Hardcoded configurations (use ConfigService)
- Storing plain text passwords (use bcrypt hash)
- Direct product reference in cart/order (must use product_variants)
- Relying on addresses FK in orders (must snapshot to JSON)

### 6. Git Workflow
- Branch naming: [type]/[feature]-[short-description]
  - feature/auth-jwt-refresh
  - fix/cart-guest-merge
  - refactor/order-checkout-flow
- Commit message: [type]: [description]
  - feat: add guest cart merge on login
  - fix: correct stock validation in checkout
  - refactor: extract payment logic to service
- PR requirements:
  - Linked to issue/task
  - Passes all tests
  - No TypeScript errors
  - Reviewed by at least 1 team member

### 7. Testing
- Test file location: same folder as source file
- Test file naming: [name].spec.ts
- Test structure: describe → it (Arrange-Act-Assert)
- Coverage requirements:
  - Services: 80%+
  - Controllers: 70%+
  - Repositories: 60%+
- Mock external dependencies (database, external APIs)

## Format
- Concrete examples for each rule
- DO vs DON'T comparisons
- Max 100-150 lines

## NestJS-Specific Additions
- Use @Module, @Controller, @Injectable decorators properly
- Guards for authentication (JwtAuthGuard) and authorization (RolesGuard)
- Interceptors for response transformation
- Pipes for validation and transformation
- Custom decorators: @CurrentUser(), @Roles(), @Public()
- TypeORM entities use @Entity, @Column, @ManyToOne, @OneToMany
- Cascade operations defined at entity level
- Transactions via QueryRunner for checkout/order creation