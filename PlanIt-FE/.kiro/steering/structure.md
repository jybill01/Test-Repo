# Project Structure

## Architecture Pattern

Feature-based architecture with clear separation of concerns. Each feature is self-contained with its own components, hooks, context, and pages.

## Directory Organization

```
src/
├── api/                    # API layer (MSA services)
│   ├── base.ts            # Axios setup, BaseApiService class
│   ├── index.ts           # Unified exports
│   ├── user.service.ts    # User & friends API
│   ├── schedule.service.ts # Tasks API
│   ├── intelligence.service.ts # AI features API
│   └── insight.service.ts # Analytics API
│
├── components/
│   ├── common/            # Reusable components (ErrorPage, LoadingSpinner, etc.)
│   ├── layout/            # Layout components (Header, PageRenderer)
│   ├── navigation/        # Navigation components (BottomNav)
│   └── ui/                # UI primitives (PlanetAnimation)
│
├── features/              # Feature modules
│   ├── friends/
│   │   ├── components/   # Feature-specific components
│   │   ├── context/      # Feature state management
│   │   └── pages/        # Feature pages
│   ├── home/
│   ├── onboarding/
│   ├── profile/
│   ├── report/
│   └── tasks/
│       ├── components/   # AddTaskForm, TaskList
│       ├── context/      # TasksContext
│       ├── hooks/        # useTasks, useAiPlan
│       └── pages/        # TodoPage, AiTodoPage
│
├── hooks/                 # Global custom hooks
│   └── useErrorHandler.ts
│
├── types/                 # TypeScript type definitions
│   └── index.ts          # Task, Friend, UserProfile, etc.
│
├── App.tsx               # Root component with providers
├── main.tsx              # Application entry point
└── index.css             # Global styles
```

## Key Conventions

### File Naming
- Components: PascalCase (e.g., ErrorPage.tsx, TaskList.tsx)
- Hooks: camelCase with 'use' prefix (e.g., useTasks.ts, useErrorHandler.ts)
- Services: camelCase with '.service' suffix (e.g., user.service.ts)
- Types: index.ts for centralized exports
- Context: PascalCase with 'Context' suffix (e.g., TasksContext.tsx)

### Import Aliases
- Use `@/` for root-level imports (configured in tsconfig.json and vite.config.ts)
- Example: `import { Task } from '@/types'`

### State Management
- Context API for feature-level state (TasksContext, FriendsContext)
- Custom hooks for business logic (useTasks, useAiPlan)
- React Query for server state (configured in main.tsx)
- Local state for UI-only concerns

### API Layer
- All services extend BaseApiService class
- Mock data support via `useMock` flag (auto-enabled in dev)
- Centralized error handling via interceptors
- Type-safe responses with ApiResponse<T> wrapper

### Error Handling
- useErrorHandler hook for API errors
- ErrorBoundary for React component errors
- ErrorPage component for user-facing error states
- LoadingSpinner for loading states

### Component Structure
- Feature components live in features/[feature]/components/
- Shared components live in components/common/
- Layout components live in components/layout/
- Each feature has its own pages/ directory

### Routing
- React Router DOM with BrowserRouter
- PageRenderer component handles route rendering
- Bottom navigation for main tabs

## Code Organization Principles

1. Feature Isolation: Each feature is self-contained and can be developed independently
2. Separation of Concerns: Clear boundaries between UI, state, and API layers
3. Reusability: Common components and hooks are extracted and shared
4. Type Safety: Comprehensive TypeScript types for all data structures
5. Scalability: MSA backend architecture allows independent service scaling
