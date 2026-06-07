# Prompts viết Docs - Tech-agnostic Framework

---

## Master Prompt

```markdown
You are a senior software architect helping me create documentation for an enterprise project.

## Project Info
- Project name: [NAME]
- Description: [1-2 sentences]
- Tech stack:
  - Frontend: [FRAMEWORK]
  - Backend: [FRAMEWORK]
  - Database: [DATABASE]
- Team size: [NUMBER]
- Architecture: [Monolith / Microservices]
- Code organization: Feature-based (NOT layer-based)

## Documentation Requirements
- Language: English
- Goal: Maintainable & scalable for team collaboration
- Style: Concise, bullet points, with concrete examples
- Audience: Developers (new team members + AI coding assistants)

## Architecture Principle
- Organize code by FEATURES, not by layers
- Each feature is self-contained
- Shared code goes to separate shared/common folder
- Minimize cross-feature dependencies

Keep this context for all following documentation requests.
```

---

## 1. DATABASE.md

```markdown
Write DATABASE.md based on the project context above.

## Core Features
- [Feature 1]: [related entities]
- [Feature 2]: [related entities]
- ...

## Requirements

### 1. Overview
- Database type & version
- ORM / Query builder (if any)
- Naming conventions (tables, columns, indexes)

### 2. Entities by Feature
Group entities by feature:
- Feature [name]: entities list
- Shared entities: entities used across features

For each entity:
- Table/Collection name
- Fields (name, type, constraints)
- Indexes

### 3. Relationships
- ERD diagram (mermaid or text-based)
- Relationship conventions
- Cross-feature relationships

### 4. Conventions
- Primary key strategy (UUID / Auto-increment / ...)
- Soft delete strategy (if any)
- Timestamps (created_at, updated_at)
- Enum/Status handling

### 5. Migration Rules
- Naming format
- Versioning strategy
- Rollback policy

## Format
- Use tables for schema
- Group by feature
- Max 150-200 lines

## [TECH-SPECIFIC ADDITIONS]
[Add ORM-specific patterns, database-specific features here]
```

---

## 2. BE: PROJECT-RULES.md

```markdown
Write PROJECT-RULES.md for Backend (Feature-based) based on the project context above.

## Tech Stack
- Language: [LANGUAGE]
- Framework: [FRAMEWORK]
- ORM: [ORM]

## Requirements

### 1. Feature Structure

features/[feature-name]/
├── controller / handler / routes
├── service / usecase
├── repository / data-access
├── dto / request-response
├── entities / models
├── types
├── utils
├── tests
└── context.md

[Adjust file naming based on tech stack conventions]

### 2. Naming Conventions
- Feature folders: [case-style]
- Files: [pattern]
- Classes / Functions: [pattern]
- Variables / Constants: [pattern]
- Types / Interfaces: [pattern]

### 3. Feature Rules
- Feature must be self-contained
- No direct imports between features
- Cross-feature communication via:
  - Shared services
  - Events / messages
  - Dependency injection
- Shared code location: [path]

### 4. Code Patterns (MUST follow)
- Error handling pattern
- Validation pattern
- Logging pattern
- Response format

### 5. Anti-patterns (MUST NOT do)
- Import directly from another feature's internal files
- Circular dependencies between features
- Business logic in controllers/handlers
- Data queries outside repository/data-access layer
- Hardcoded configurations

### 6. Git Workflow
- Branch naming: [pattern]
- Commit message: [pattern]
- PR requirements

### 7. Testing
- Test file location
- Test file naming
- Test structure
- Coverage requirements

## Format
- Concrete examples for each rule
- DO vs DON'T comparisons
- Max 100-150 lines

## [TECH-SPECIFIC ADDITIONS]
[Add framework-specific patterns, decorators, middleware conventions here]
```

---

## 3. BE: ARCHITECTURE.md

```markdown
Write ARCHITECTURE.md for Backend (Feature-based) based on:
- Project context above
- DATABASE.md: [reference]
- PROJECT-RULES.md: [reference]

## Requirements

### 1. System Overview
- High-level architecture diagram (mermaid)
- Feature-based organization rationale

### 2. Folder Structure

src/
├── config/
├── shared/
│   ├── middlewares/
│   ├── utils/
│   └── types/
├── core/
│   ├── database/
│   ├── logger/
│   └── cache/
└── features/
    ├── [feature-a]/
    └── [feature-b]/

[Adjust based on framework conventions]

### 3. Feature Anatomy

features/[feature]/
├── [controller layer]
├── [service layer]
├── [data access layer]
├── dto/
├── entities/
├── types/
├── utils/
├── tests/
└── context.md


### 4. Request Flow

Request → Controller → Service → Repository → Database
                ↓
            Response

- Controller: routing, validation, response formatting
- Service: business logic
- Repository: data access only

### 5. Cross-feature Communication
- Allowed methods:
  - Shared services
  - Event bus / message queue
  - Dependency injection
- Forbidden: direct internal imports

### 6. Shared vs Core
| Shared | Core |
|--------|------|
| Reusable utilities | Infrastructure setup |
| Common types | Database connection |
| Helper functions | Logger configuration |

### 7. Configuration Management
- Environment variables
- Config files structure
- Secrets handling

## Format
- Mermaid diagrams
- Folder structure with comments
- Max 150-200 lines

## [TECH-SPECIFIC ADDITIONS]
[Add framework modules, DI setup, middleware chain here]
```

---

## 4. API_SPEC.md

```markdown
Write API_SPEC.md based on:
- Project context above
- DATABASE.md: [reference]
- BE ARCHITECTURE.md: [reference]

## Requirements

### 1. Overview
- Base URL pattern
- API versioning strategy
- Content-Type

### 2. Authentication
- Auth method: [JWT / Session / OAuth / ...]
- Header format
- Token flow (access, refresh)
- Auth error handling

### 3. Request Conventions
- Query params: pagination, sorting, filtering
- Request body format
- File upload format (if any)

### 4. Response Format

Success: { success, data, meta }
Error: { success, error: { code, message, details } }

[Adjust structure as needed]

### 5. Error Codes
- Code format by feature: [FEATURE]_[NUMBER]
- Common error codes list
- HTTP status usage

### 6. Endpoints by Feature
For each feature:
| Method | Path | Description | Auth |

### 7. Endpoint Details (complex endpoints)
- Request format + example
- Response format + example
- Error cases

## Format
- Group by feature
- Tables for endpoint list
- Code blocks for examples

## [TECH-SPECIFIC ADDITIONS]
[Add GraphQL schema, WebSocket events, gRPC definitions here]
```

---

## 5. FE: PROJECT-RULES.md

```markdown
Write PROJECT-RULES.md for Frontend (Feature-based) based on the project context above.

## Tech Stack
- Framework: [FRAMEWORK]
- State management: [LIBRARY]
- Styling: [APPROACH]
- HTTP client: [LIBRARY]

## Requirements

### 1. Feature Structure

features/[feature-name]/
├── components/
├── hooks/ (or composables)
├── services/
├── stores/ (or state)
├── types/
├── utils/
├── index (public exports)
└── context.md

[Adjust based on framework conventions]

### 2. Naming Conventions
- Feature folders: [case-style]
- Components: [pattern]
- Hooks / Composables: [pattern]
- Services: [pattern]
- Types: [pattern]

### 3. Feature Rules
- Feature must be self-contained
- Export only via index file (barrel)
- No direct imports between features
- Cross-feature communication via:
  - Global state (minimal)
  - Events
  - URL params
- Shared components location: [path]

### 4. Component Rules
- One component per file
- Co-locate styles, tests
- Props typing required
- Max lines per component

### 5. Code Patterns (MUST follow)
- API calls: via service files
- State: local first, global when necessary
- Error handling: boundaries + notifications
- Loading states: skeleton / spinner
- Form handling: [approach]

### 6. Anti-patterns (MUST NOT do)
- Import from another feature's internal files
- API calls directly in components
- Business logic in components
- Deep prop drilling
- Untyped code (any)
- Inline styles (unless necessary)

### 7. Git Workflow
- Branch naming
- Commit message
- PR scope

### 8. Testing
- Test file location
- What to test
- Coverage focus

## Format
- Concrete examples
- DO vs DON'T comparisons
- Max 100-150 lines

## [TECH-SPECIFIC ADDITIONS]
[Add framework-specific patterns, lifecycle, reactivity rules here]
```

---

## 6. FE: ARCHITECTURE.md

```markdown
Write ARCHITECTURE.md for Frontend (Feature-based) based on:
- Project context above
- API_SPEC.md: [reference]
- FE PROJECT-RULES.md: [reference]

## Requirements

### 1. Overview
- Feature-based architecture
- Tech stack justification

### 2. Folder Structure

src/
├── app/
│   ├── entry point
│   ├── routes
│   └── providers
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── types/
│   └── utils/
├── features/
│   ├── [feature-a]/
│   └── [feature-b]/
├── assets/
└── styles/

[Adjust based on framework]

### 3. Feature Anatomy

features/[feature]/
├── components/
├── hooks/
├── services/
├── stores/
├── types/
├── utils/
├── pages/ (if applicable)
├── index
└── context.md


### 4. Data Flow

User Action → Component → Hook → Service → API
                           ↓
                    Store (if needed)
                           ↓
                       UI Update


### 5. Cross-feature Communication
| Method | Use case |
|--------|----------|
| Global store | Auth, user, app settings |
| URL / Router | Navigation with params |
| Event emitter | Decoupled actions (rare) |

### 6. Routing Structure
- Public routes
- Protected routes
- Route config per feature
- Lazy loading strategy

### 7. State Management Strategy
| State Type | Location | Example |
|------------|----------|---------|
| Server state | [library] | API cache |
| Global UI | Global store | Theme |
| Auth | Global store | User, tokens |
| Feature state | Feature store | Form drafts |
| Local UI | Component state | Modal open |

### 8. API Layer

shared/services/api (base client)
    ↓
features/[x]/services (feature service)
    ↓
features/[x]/hooks (data hook)
    ↓
features/[x]/components (UI)


### 9. Shared vs Features
| Shared | Features |
|--------|----------|
| UI components | Feature components |
| API client | Feature services |
| Global hooks | Feature hooks |
| Utilities | Feature utils |

## Format
- Mermaid diagrams
- Folder structure with comments
- Max 150-200 lines

## [TECH-SPECIFIC ADDITIONS]
[Add framework routing, state library patterns, SSR/SSG if applicable]
```

---


## Cách sử dụng

```
1. Copy prompt framework
2. Điền [PLACEHOLDERS] với thông tin project
3. Thêm [TECH-SPECIFIC ADDITIONS] tùy tech stack
4. Generate với AI
5. Review & adjust
```

---

## Ví dụ Tech-specific Additions

| Tech | Additions |
|------|-----------|
| NestJS | Modules, decorators, guards, pipes |
| Express | Middleware chain, router setup |
| FastAPI | Pydantic models, dependencies |
| Spring | Beans, annotations, DI |
| React | Hooks patterns, context, portals |
| Vue | Composables, provide/inject |
| Angular | Modules, services, RxJS |

