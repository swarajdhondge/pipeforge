# Yahoo Pipes 2025 - Frontend

React + TypeScript frontend for Yahoo Pipes 2025.

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Redux Toolkit (state management)
- React Router (routing)
- Axios (API calls)

## Setup

### Prerequisites

- Node.js 20+
- Backend API running on http://localhost:3000

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

The app will start on `http://localhost:5173`.

## Environment Variables

Create a `.env` file:

```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Project Structure

```
src/
├─ components/
│  ├─ auth/              # Authentication components
│  │  ├─ login-form.tsx
│  │  ├─ register-form.tsx
│  │  ├─ google-oauth-button.tsx
│  │  └─ protected-route.tsx
│  └─ common/            # Shared components
│     ├─ navigation-bar.tsx
│     ├─ execution-limit-banner.tsx
│     └─ signup-prompt-modal.tsx
├─ pages/                # Route pages
│  ├─ home-page.tsx
│  ├─ login-page.tsx
│  ├─ register-page.tsx
│  └─ oauth-callback-page.tsx
├─ store/                # Redux store
│  ├─ store.ts
│  └─ slices/
│     ├─ auth-slice.ts
│     └─ anonymous-slice.ts
├─ services/             # API services
│  ├─ api.ts
│  └─ auth-service.ts
├─ hooks/                # Custom hooks
│  ├─ use-auth.ts
│  ├─ use-local-storage.ts
│  └─ use-execution-limit.ts
├─ types/                # TypeScript types
│  └─ auth.types.ts
├─ App.tsx               # Root component
└─ main.tsx              # Entry point
```

## Features

### Authentication
- Email/password registration and login
- Google OAuth integration
- JWT token management with automatic refresh
- Protected routes

### Anonymous User Experience
- Create pipes without account (stored in localStorage)
- Execute pipes up to 5 times
- Signup prompt after limit reached
- Local pipes migrated to account on signup

### State Management
- Redux Toolkit for global state
- Auth slice (user, tokens, authentication status)
- Anonymous slice (session, execution count, local pipes)

### API Integration
- Axios instance with interceptors
- Automatic token injection
- Automatic token refresh on 401
- Error handling

## Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Build for production
npm run preview      # Preview production build

# Type checking
npx tsc --noEmit     # Check TypeScript errors
```

## User Flows

### Anonymous User
1. Visit site
2. Browse public pipes
3. Create pipe (stored locally)
4. Execute pipe (1/5, 2/5, etc.)
5. After 5 executions → Signup modal
6. Sign up → Local pipes migrated

### Authenticated User
1. Register or login
2. Unlimited executions
3. Pipes saved to database
4. Access from any device

## Components

### LoginForm
- Email/password inputs with validation
- Error display
- Loading states
- Integrates with Redux auth slice

### RegisterForm
- Email/password/confirm password
- Client-side validation
- Error display
- Integrates with Redux auth slice

### GoogleOAuthButton
- Redirects to backend OAuth endpoint
- Google branding

### ProtectedRoute
- Wraps protected pages
- Redirects to /login if not authenticated
- Shows loading state

### NavigationBar
- Logo and navigation links
- User menu dropdown (authenticated)
- Sign in/Sign up buttons (unauthenticated)

### ExecutionLimitBanner
- Shows remaining executions for anonymous users
- Hidden for authenticated users
- Prompts signup when limit reached

### SignupPromptModal
- Modal after 5 executions
- Sign up and Sign in buttons
- Can be dismissed

## Hooks

### useAuth
```typescript
const { user, isAuthenticated, isLoading, error, login, register, logout } = useAuth();
```

### useLocalStorage
```typescript
const [value, setValue] = useLocalStorage<T>('key', initialValue);
```

### useExecutionLimit
```typescript
const { canExecute, remaining, checkAndIncrement, showSignupModal } = useExecutionLimit();
```

## Styling

Uses Tailwind CSS utility classes. No custom CSS files needed.

Example:
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  Click me
</button>
```

## API Service

All API calls go through `services/api.ts`:

```typescript
import api from './services/api';

// Automatically includes auth token
const response = await api.get('/auth/me');
```

## Common Issues

### CORS errors
- Ensure backend CORS is configured for http://localhost:5173
- Check VITE_API_URL in .env

### OAuth redirect fails
- Ensure GOOGLE_REDIRECT_URI in backend matches frontend callback
- Check VITE_GOOGLE_CLIENT_ID matches backend

### Token refresh loop
- Clear localStorage and refresh page
- Check backend JWT_SECRET is consistent

## Next Steps

After authentication is complete:
1. Implement pipe editor (ReactFlow)
2. Add pipe CRUD operations
3. Implement operator system
4. Add execution engine integration
5. Build public pipe marketplace

## Contributing

Follow the patterns in `frontend-standards.md`:
- Use FC with typed props
- Redux Toolkit for state
- Axios for API calls
- Tailwind for styling
- No `any` types
