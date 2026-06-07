Write ARCHITECTURE.md for Frontend (Feature-based) based on:
- Project context above
- API_SPEC.md: REST API với 6 features (auth, user-profile, product, cart, order, review), JWT auth, pagination/filter conventions
- FE PROJECT-RULES.md: React 19/Vite/TypeScript, Zustand + TanStack Query, Tailwind, feature-based structure

## Requirements

### 1. Overview
- Feature-based architecture: each feature is self-contained module
- Tech stack justification:
  - React 19 + Vite: fast dev server, modern React features
  - TypeScript: type safety, better DX, catch errors early
  - TanStack Query: server state management, caching, auto-refetch
  - Zustand: minimal global state (auth, cart only)
  - Tailwind CSS: utility-first, fast styling, consistent design
  - Axios: interceptors for auth, error handling
  - React Router v7: modern routing, type-safe routes, improved data loading

### 2. Folder Structure
```
src/
├── main.tsx                    # Entry point, render App
├── App.tsx                     # Providers wrapper, router outlet
├── config/
│   ├── constants.ts            # API_BASE_URL, APP_NAME, etc.
│   └── env.ts                  # Environment variables typing
├── routes/
│   ├── index.tsx               # Route definitions
│   ├── routes.ts               # Route paths constants (type-safe)
│   ├── ProtectedRoute.tsx      # Auth guard wrapper
│   └── AdminRoute.tsx          # Admin role guard
├── shared/
│   ├── components/
│   │   ├── ui/                 # Button, Input, Modal, Dropdown
│   │   ├── feedback/           # Toast, Skeleton, Spinner, ErrorMessage
│   │   └── layout/             # Header, Footer, Sidebar
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useMediaQuery.ts
│   ├── lib/
│   │   ├── axios.ts            # Axios instance with interceptors
│   │   └── queryClient.ts      # TanStack Query client config
│   ├── stores/
│   │   └── ui.store.ts         # Theme, sidebar state
│   ├── types/
│   │   ├── api.types.ts        # ApiResponse, PaginatedResponse
│   │   └── common.types.ts     # ID, Timestamp, etc.
│   └── utils/
│       ├── format.utils.ts     # formatPrice, formatDate
│       └── validation.utils.ts # common Zod schemas
├── layouts/
│   ├── MainLayout.tsx          # Header + Footer + Outlet
│   ├── AuthLayout.tsx          # Centered card layout
│   └── AdminLayout.tsx         # Sidebar + Header + Outlet
├── features/
│   ├── auth/
│   ├── user-profile/
│   ├── product/
│   ├── cart/
│   ├── checkout/
│   ├── order/
│   └── review/
└── assets/
    ├── images/
    └── icons/
```
### 3. Feature Anatomy
```
features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── AuthGuard.tsx
├── hooks/
│   ├── useAuth.ts              # Auth state from store
│   ├── useLogin.ts             # useMutation for login
│   └── useRegister.ts          # useMutation for register
├── services/
│   └── auth.service.ts         # login(), register(), refreshToken()
├── stores/
│   └── auth.store.ts           # user, token, isAuthenticated
├── types/
│   └── auth.types.ts           # User, LoginRequest, AuthResponse
├── pages/
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── index.ts                    # Export public API
└── CONTEXT.md
```
```
features/product/
├── components/
│   ├── CategoryNav.tsx
│   ├── ProductCard.tsx
│   ├── ProductList.tsx
│   ├── ProductFilters.tsx
│   ├── ProductDetail.tsx
│   ├── VariantSelector.tsx
│   └── ProductImageGallery.tsx
├── hooks/
│   ├── useCategories.ts        # useQuery for categories
│   ├── useProducts.ts          # useQuery with filters, pagination
│   └── useProductDetail.ts     # useQuery for single product
├── services/
│   └── product.service.ts      # getProducts(), getProductBySlug()
├── types/
│   └── product.types.ts        # Product, Variant, Category
├── utils/
│   └── product.utils.ts        # buildFilterParams(), getVariantPrice()
├── pages/
│   ├── ProductListPage.tsx
│   └── ProductDetailPage.tsx
├── index.ts
└── CONTEXT.md
```
```
features/cart/
├── components/
│   ├── CartIcon.tsx            # Header cart icon with badge
│   ├── CartDrawer.tsx          # Slide-out cart panel
│   ├── CartItem.tsx
│   └── CartSummary.tsx
├── hooks/
│   ├── useCart.ts              # Get cart from store/query
│   ├── useAddToCart.ts         # useMutation
│   └── useUpdateCartItem.ts    # useMutation with optimistic update
├── services/
│   └── cart.service.ts         # getCart(), addItem(), updateItem()
├── stores/
│   └── cart.store.ts           # cartItems, cartCount, addItem()
├── types/
│   └── cart.types.ts           # CartItem, Cart
├── pages/
│   └── CartPage.tsx
├── index.ts
└── CONTEXT.md
```
```
features/checkout/
├── components/
│   ├── CheckoutSteps.tsx       # Progress indicator
│   ├── AddressSelector.tsx     # Select/add shipping address
│   ├── PaymentMethodSelector.tsx
│   ├── OrderSummary.tsx
│   └── CheckoutForm.tsx
├── hooks/
│   └── useCheckout.ts          # useMutation for order creation
├── services/
│   └── checkout.service.ts     # createOrder()
├── types/
│   └── checkout.types.ts       # CheckoutRequest, CheckoutStep
├── pages/
│   └── CheckoutPage.tsx
├── index.ts
└── CONTEXT.md
```
### 4. Data Flow
```
User Action → Component → Hook (TanStack Query) → Service → Axios → API
                                    ↓
                         Cache Update / Store Update
                                    ↓
                              UI Re-render
```
Example - Add to Cart:
1. User clicks "Add to Cart" button
2. ProductDetail component calls useAddToCart().mutate()
3. useAddToCart hook triggers cart.service.addItem()
4. Service calls POST /cart/items via axios
5. On success: invalidate cart query, show toast
6. CartIcon re-renders with new count

Example - Checkout:
1. User fills CheckoutForm, clicks "Place Order"
2. CheckoutForm calls useCheckout().mutate(data)
3. useCheckout triggers checkout.service.createOrder()
4. Service calls POST /orders/checkout
5. On success: clear cart, redirect to order confirmation
6. On error: show error toast, keep form data

### 5. Cross-feature Communication

| Method | Use case | Example |
|--------|----------|---------|
| Global Zustand store | Auth state across app | auth.store → user, isAuthenticated |
| Global Zustand store | Cart state in header | cart.store → cartCount for badge |
| TanStack Query cache | Shared data | Product data used in cart, checkout |
| URL / React Router | Navigation with params | /products?category=5&page=2 |
| URL search params | Filters, pagination | useSearchParams for product filters |
| Props drilling (1-2 levels) | Parent-child | ProductList → ProductCard |

Feature dependencies:
- auth: standalone (provides user state)
- user-profile: reads auth (current user)
- product: standalone
- cart: reads auth (user_id), reads product (variant info for display)
- checkout: reads auth, reads cart, reads user-profile (addresses)
- order: reads auth
- review: reads auth, reads product (for display)

### 6. Routing Structure

Public routes (no auth required):
- / → Home (ProductListPage with featured)
- /products → ProductListPage
- /products/:slug → ProductDetailPage
- /categories/:slug → ProductListPage (filtered)
- /login → LoginPage
- /register → RegisterPage

Protected routes (auth required):
- /cart → CartPage
- /checkout → CheckoutPage
- /orders → OrderListPage
- /orders/:id → OrderDetailPage
- /profile → ProfilePage
- /profile/addresses → AddressListPage

Admin routes (admin role required):
- /admin/products → AdminProductListPage
- /admin/orders → AdminOrderListPage
- /admin/categories → AdminCategoryPage

Route paths constants (type-safe):
```ts
// routes/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:slug',
  CATEGORY: '/categories/:slug',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  PROFILE: '/profile',
  ADDRESSES: '/profile/addresses',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
} as const;
```

Route config pattern (React Router v7):
```tsx
// routes/index.tsx
import { createBrowserRouter, RouteObject } from 'react-router';
import { lazy, Suspense } from 'react';

// Lazy load pages
const ProductListPage = lazy(() => import('@/features/product/pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('@/features/product/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/features/cart/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/features/checkout/pages/CheckoutPage'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'categories/:slug', element: <ProductListPage /> },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: 'cart', element: <CartPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'orders', element: <OrderListPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'profile/addresses', element: <AddressListPage /> },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: 'products', element: <AdminProductListPage /> },
          { path: 'orders', element: <AdminOrderListPage /> },
          { path: 'categories', element: <AdminCategoryPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
```

Navigation hooks (React Router v7):
```tsx
// Type-safe navigation
import { useNavigate, useParams, useSearchParams } from 'react-router';

// Navigate programmatically
const navigate = useNavigate();
navigate('/products');
navigate(`/products/${slug}`);

// Get URL params
const { slug } = useParams<{ slug: string }>();

// Get/set search params
const [searchParams, setSearchParams] = useSearchParams();
const page = searchParams.get('page') ?? '1';
setSearchParams({ page: '2', category: '5' });
```

Lazy loading strategy:
- Lazy load all page components with React.lazy()
- Wrap in Suspense with Skeleton fallback at layout level
- Eager load shared UI components (Button, Input, etc.)

### 7. State Management Strategy

| State Type | Location | Tool | Example |
|------------|----------|------|---------|
| Server state | Feature hooks | TanStack Query | Products, orders, reviews |
| Server cache | Query client | TanStack Query | Auto-cached API responses |
| Auth state | Global store | Zustand | user, token, isAuthenticated |
| Cart state | Global store | Zustand | cartItems, cartCount |
| UI state (global) | Global store | Zustand | theme, sidebarOpen |
| URL state | Router | useSearchParams | filters, pagination, sorting |
| Form state | Component | React Hook Form | checkout form, review form |
| Local UI state | Component | useState | modal open, dropdown open |

State rules:
- Server data → TanStack Query (NEVER Zustand)
- Auth/Cart → Zustand (needed across features)
- Filters/Pagination → URL params (shareable, bookmarkable)
- Form data → React Hook Form (local to form)
- Temporary UI → useState (modal, tooltip)

### 8. API Layer
```
shared/lib/axios.ts (base client)
├── Base URL configuration
├── Request interceptor: attach access token
├── Response interceptor: handle 401, refresh token
├── Error interceptor: transform to AppError
    ↓
features/[x]/services/[x].service.ts (feature service)
├── Define API endpoints for feature
├── Type request/response
├── Transform data if needed
    ↓
features/[x]/hooks/use[X].ts (data hook)
├── useQuery for GET (with caching)
├── useMutation for POST/PUT/DELETE
├── Handle loading, error states
├── Invalidate related queries on mutation
    ↓
features/[x]/components/[X].tsx (UI)
├── Use hooks for data
├── Render loading/error/success states
├── Handle user interactions
```
Example service:
```ts
// features/product/services/product.service.ts
export const productService = {
  getProducts: (params: ProductQueryParams) =>
    axios.get<PaginatedResponse<Product>>('/products', { params }),
  
  getBySlug: (slug: string) =>
    axios.get<ApiResponse<ProductDetail>>(`/products/${slug}`),
};
```

Example hook:
```ts
// features/product/hooks/useProducts.ts
export const useProducts = (params: ProductQueryParams) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
  });
};
```

### 9. Shared vs Features

| Shared (src/shared/) | Features (src/features/) |
|----------------------|--------------------------|
| Button, Input, Modal, Toast | ProductCard, CartItem, CheckoutForm |
| useDebounce, useLocalStorage | useProducts, useCart, useCheckout |
| axios instance, queryClient | product.service, cart.service |
| ApiResponse, PaginatedResponse types | Product, Cart, Order types |
| formatPrice, formatDate utils | getVariantPrice, buildFilterParams |
| Skeleton, Spinner, ErrorBoundary | ProductSkeleton, CartSkeleton |

Import rules:
- Features CAN import from shared/
- Features CANNOT import from other features' internals
- Features CAN import other features' public exports (index.ts)
- Shared CANNOT import from features/

## Format
- Mermaid diagrams for data flow
- Folder structure with inline comments
- Max 150-200 lines

## React-Specific Additions

**React Router v7 patterns:**
- Import from 'react-router' (not 'react-router-dom')
- createBrowserRouter for route configuration
- Type-safe route params with useParams<T>()
- useSearchParams for URL query state
- useNavigate for programmatic navigation
- Outlet for nested layouts
- Navigate component for redirects
- Route-level error boundaries with errorElement

**TanStack Query patterns:**
- queryKey conventions: ['resource', params]
- Invalidation on mutations
- Optimistic updates for cart
- Infinite query for product list (optional)
- Prefetching on hover (product links)

**Zustand patterns:**
- Separate stores per domain (auth.store, cart.store)
- Actions inside store
- Selectors for derived state
- Persist middleware for cart (localStorage)

**Error handling:**
- Error Boundary at layout level
- Route-level errorElement for navigation errors
- Suspense for lazy loaded routes with fallback
- StrictMode in development
