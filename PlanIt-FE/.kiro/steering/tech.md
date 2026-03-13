# Technology Stack

## Core Technologies

- React 19 with TypeScript
- Vite 6 (build tool and dev server)
- React Router DOM 7 for routing
- TanStack React Query for server state management
- Context API for client state management

## UI & Styling

- Tailwind CSS 4 with Vite plugin
- Framer Motion / Motion for animations
- Lucide React for icons
- Recharts for data visualization

## API & Backend Integration

- Axios for HTTP requests
- MSA (Microservices Architecture) with 4 separate services:
  - User Service (profiles, friends)
  - Schedule Service (tasks, todos)
  - Intelligence Service (AI features)
  - Insight Service (analytics, reports)
- Google Generative AI (@google/genai) for AI features
- Mock data support in development mode

## Development Tools

- TypeScript 5.8 with strict configuration
- ESNext module system
- Path aliases (@/* for root imports)

## Common Commands

```bash
# Development
npm run dev              # Start dev server (port 3000, development mode)
npm run dev:staging      # Start dev server with staging environment

# Building
npm run build            # Production build
npm run build:staging    # Staging build
npm run build:production # Production build (explicit)

# Other
npm run preview          # Preview production build
npm run clean            # Remove dist folder
npm run lint             # TypeScript type checking (no emit)
```

## Environment Configuration

- Multiple environment files: .env.development, .env.staging, .env.production
- Environment variables must use VITE_ prefix to be exposed to client
- Service URLs configured per environment
- Mock mode automatically enabled in development (import.meta.env.DEV)

## Key Dependencies

- better-sqlite3: Local database support
- express: Backend server capabilities
- dotenv: Environment variable management
