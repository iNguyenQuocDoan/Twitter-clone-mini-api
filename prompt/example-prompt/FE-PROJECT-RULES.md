Write PROJECT-RULES.md for Frontend (Feature-based) based on the project context above.

## Tech Stack
- Framework: React 19 + Vite
- Language: TypeScript (strict mode)
- State management: Zustand (global) + TanStack Query (server state)
- Styling: Tailwind CSS
- HTTP client: Axios
- Form handling: React Hook Form + Zod
- Routing: React Router v7

## Requirements

### 1. Feature Structure
```
src/
├── features/
│   ├── auth/               # login, register, JWT handling
│   ├── user-profile/       # addresses management
│   ├── product/            # catalog, categories, product detail
│   ├── cart/               # cart management, guest cart
│   ├── checkout/           # checkout flow, order creation
│   ├── order/              # order history, order detail
│   └── review/             # product reviews
├── shared/
│   ├── components/         # Button, Input, Modal, etc.
│   ├── hooks/              # useDebounce, useLocalStorage, etc.
│   ├── layouts/            # MainLayout, AdminLayout
│   ├── lib/                # axios instance, utils
│   └── types/              # common types
├── config/
│   └── constants.ts
├── routes/
│   ├── index.tsx           # createBrowserRouter config
│   ├── routes.ts           # Route path constants (type-safe)
│   ├── ProtectedRoute.tsx  # Auth guard
│   └── AdminRoute.tsx      # Admin role guard
├── App.tsx
└── main.tsx
```

Each feature folder:
```
features/[feature-name]/
├── components/
│   ├── ProductCard.tsx
│   └── ProductList.tsx
├── hooks/
│   └── useProducts.ts      # TanStack Query hooks
├── services/
│   └── product.service.ts  # API calls
├── stores/
│   └── product.store.ts    # Zustand store (if needed)
├── types/
│   └── product.types.ts
├── utils/
│   └── product.utils.ts
├── pages/
│   ├── ProductListPage.tsx
│   └── ProductDetailPage.tsx
├── index.ts                # barrel exports
└── CONTEXT.md
```

### 2. Naming Conventions
- Feature folders: kebab-case (user-profile, checkout)
- Components: PascalCase (ProductCard.tsx, CheckoutForm.tsx)
- Hooks: camelCase with use prefix (useProducts.ts, useCart.ts)
- Services: camelCase with .service suffix (product.service.ts)
- Stores: camelCase with .store suffix (cart.store.ts)
- Types: camelCase with .types suffix (product.types.ts)
- Utils: camelCase with .utils suffix (price.utils.ts)
- Pages: PascalCase with Page suffix (ProductListPage.tsx)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL, MAX_CART_ITEMS)
- Route paths: UPPER_SNAKE_CASE in routes.ts (ROUTES.PRODUCT_DETAIL)

### 3. Feature Rules
- Feature must be self-contained
- Export only via index.ts (barrel file)
- No direct imports between features' internal files
- Cross-feature communication via:
  - Global Zustand stores (minimal: auth, cart)
  - URL params / search params (React Router v7)
  - TanStack Query cache
- Shared components location: src/shared/components/

Feature boundaries for this project:
- auth: login, register, logout, auth state (user, token)
- user-profile: addresses CRUD, profile settings
- product: categories tree, product listing, product detail, variants display
- cart: cart state, add/remove/update items, guest cart with session
- checkout: checkout flow, address selection, payment method, order creation
- order: order history list, order detail, cancel order
- review: product reviews list, create/edit review

### 4. Component Rules
- One component per file
- Co-locate styles (Tailwind), tests (.test.tsx)
- Props typing required (interface Props {})
- Max 200 lines per component (split if larger)
- Separate container (logic) vs presentational (UI) when complex
- Use React.memo() only when necessary (measure first)

Component structure:
```tsx
// 1. Imports
// 2. Types/Interfaces
// 3. Component
// 4. Export
```

### 5. Code Patterns (MUST follow)

**API calls:**
- Via service files only (never in components directly)
- Use TanStack Query hooks for data fetching
- Use mutations for POST/PUT/DELETE

**State management:**
- Local state first (useState)
- Server state: TanStack Query (useQuery, useMutation)
- Global client state: Zustand (auth, cart only)
- URL state: useSearchParams for filters, pagination

**Routing (React Router v7):**
- Import from 'react-router' (NOT 'react-router-dom')
- Define route paths in routes/routes.ts as constants
- Use createBrowserRouter for route configuration
- Use useNavigate() for programmatic navigation
- Use useParams<T>() with TypeScript generics for type-safe params
- Use useSearchParams() for query string state (filters, pagination)
- Use Outlet for nested layouts
- Use Navigate component for redirects

**Error handling:**
- React Error Boundary for component errors
- Route-level errorElement for navigation/loading errors
- TanStack Query onError for API errors
- Toast notifications for user feedback (success/error)
- Centralized error handling in axios interceptor

**Loading states:**
- Skeleton components for initial load
- Spinner for actions (add to cart, checkout)
- Optimistic updates where appropriate (cart)
- Suspense fallback for lazy-loaded routes

**Form handling:**
- React Hook Form for all forms
- Zod schema for validation
- Controlled inputs via register()
- Display errors inline

**Authentication:**
- Store tokens in httpOnly cookie (refresh) + memory (access)
- Axios interceptor for auto-refresh
- ProtectedRoute component for auth-required pages
- Redirect to login on 401 using Navigate component

### 6. Anti-patterns (MUST NOT do)
- Import from another feature's internal files (use index.ts exports)
- API calls directly in components (use services + hooks)
- Business logic in components (move to hooks/utils)
- Deep prop drilling (use context or composition)
- Untyped code (no `any`, enable strict mode)
- Inline styles (use Tailwind classes)
- useEffect for data fetching (use TanStack Query)
- Store server data in Zustand (use TanStack Query cache)
- Hardcoded API URLs (use config/constants)
- Direct localStorage for auth tokens (security risk)
- Hardcoded route paths in components (use ROUTES constants)
- Import from 'react-router-dom' (use 'react-router' in v7)

### 7. Git Workflow
- Branch naming: [type]/[feature]-[short-description]
  - feature/cart-guest-merge
  - fix/checkout-address-validation
  - refactor/product-list-pagination
- Commit message: [type]: [description]
  - feat: add product variant selector
  - fix: correct cart quantity update
  - style: improve checkout form layout
- PR scope:
  - One feature or fix per PR
  - Include screenshots for UI changes
  - Update CONTEXT.md if feature logic changes

### 8. Testing
- Test file location: same folder as component ([Component].test.tsx)
- What to test:
  - User interactions (clicks, form submissions)
  - Conditional rendering
  - Hook behavior
  - API integration (mock service)
  - Route navigation (use MemoryRouter for tests)
- Coverage focus:
  - Checkout flow (critical path)
  - Cart operations
  - Auth flow
- Tools: Vitest + React Testing Library
- Skip testing: pure UI components, third-party library wrappers

## Format
- Concrete examples for each rule
- DO vs DON'T comparisons
- Max 100-150 lines

## React Router v7 Patterns
- Import: `import { useNavigate, useParams, useSearchParams } from 'react-router'`
- Route config: createBrowserRouter with RouteObject[]
- Type-safe params: `const { slug } = useParams<{ slug: string }>()`
- Search params: `const [searchParams, setSearchParams] = useSearchParams()`
- Navigation: `navigate(ROUTES.PRODUCT_DETAIL.replace(':slug', slug))`
- Nested routes: use Outlet in layout components
- Protected routes: wrapper component with Navigate redirect
- Error boundaries: errorElement prop on routes
- Lazy loading: React.lazy() with Suspense at route level
- Route path constants:
  ```ts
  // routes/routes.ts
  export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    PRODUCTS: '/products',
    PRODUCT_DETAIL: '/products/:slug',
    CART: '/cart',
    CHECKOUT: '/checkout',
    ORDERS: '/orders',
    ORDER_DETAIL: '/orders/:id',
  } as const;
  ```

## React-Specific Additions
- Use React 19 features: use() hook, Server Components awareness
- Lazy load pages with React.lazy() + Suspense
- Use React.memo(), useMemo(), useCallback() sparingly (measure first)
- Custom hooks for reusable logic (useDebounce, useLocalStorage)
- Context for theme, locale (not for frequently changing state)
- StrictMode enabled in development
- Keys required for lists (use unique id, never index)
- Avoid useEffect for derived state (compute during render)
- TanStack Query for all server state (caching, refetching, optimistic updates)
- Zustand slices pattern for organized global state