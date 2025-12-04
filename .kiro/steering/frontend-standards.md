---
inclusion: always
---

# Frontend Implementation Standards

## Purpose

Concrete frontend implementation details that AI must follow. This is the frontend equivalent of implementation-standards.md.

## Project Structure

```
frontend/
├─ src/
│  ├─ components/          # Reusable UI components
│  │  ├─ common/          # Buttons, Inputs, Modals
│  │  ├─ auth/            # LoginForm, RegisterForm, GoogleOAuthButton
│  │  ├─ pipes/           # PipeCard, PipeList, PipeDetail
│  │  └─ editor/          # PipeEditor, OperatorPalette, OperatorConfig, Canvas
│  ├─ pages/              # Route pages
│  │  ├─ HomePage.tsx
│  │  ├─ LoginPage.tsx
│  │  ├─ RegisterPage.tsx
│  │  ├─ PipeEditorPage.tsx
│  │  ├─ BrowsePipesPage.tsx
│  │  ├─ PipeDetailPage.tsx
│  │  ├─ MyPipesPage.tsx
│  │  └─ UserProfilePage.tsx
│  ├─ store/              # Redux store
│  │  ├─ slices/
│  │  │  ├─ authSlice.ts
│  │  │  ├─ anonymousSlice.ts  # Anonymous user state
│  │  │  ├─ pipesSlice.ts
│  │  │  ├─ canvasSlice.ts
│  │  │  └─ executionSlice.ts
│  │  └─ store.ts
│  ├─ services/           # API calls
│  │  ├─ api.ts           # Axios instance
│  │  ├─ authService.ts
│  │  ├─ pipeService.ts
│  │  └─ executionService.ts
│  ├─ hooks/              # Custom React hooks
│  │  ├─ useAuth.ts
│  │  ├─ usePipes.ts
│  │  └─ useLocalStorage.ts  # For anonymous users
│  ├─ types/              # TypeScript types
│  │  ├─ auth.types.ts
│  │  ├─ pipe.types.ts
│  │  └─ operator.types.ts
│  ├─ utils/              # Helper functions
│  │  ├─ validators.ts
│  │  └─ localStorage.ts  # Local pipe management
│  ├─ App.tsx             # Root component
│  └─ main.tsx            # Entry point
├─ public/
├─ package.json
└─ tsconfig.json
```

## Component Standards

### Component Pattern

```tsx
// ✅ ALWAYS: Follow this exact pattern

import { FC } from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
  isLoading?: boolean;
}

export const MyComponent: FC<MyComponentProps> = ({ 
  title, 
  onAction, 
  isLoading = false 
}) => {
  // 1. Hooks at the top
  const [state, setState] = useState<string>('');
  const dispatch = useDispatch();
  
  // 2. Event handlers
  const handleClick = () => {
    onAction();
  };
  
  // 3. Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // 4. Early returns for loading/error states
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // 5. Main render
  return (
    <div className="container">
      <h1>{title}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
};

// ❌ NEVER: Default exports
export default MyComponent; // NO!

// ❌ NEVER: Inline functions in JSX
<button onClick={() => doSomething()}>Click</button> // NO!

// ✅ ALWAYS: Named functions
<button onClick={handleClick}>Click</button>
```

### Component Naming

```
✅ PascalCase for components: LoginForm, PipeCard, NavigationBar
✅ camelCase for functions: handleSubmit, validateEmail
✅ UPPER_CASE for constants: MAX_PIPE_NAME_LENGTH
✅ kebab-case for files: login-form.tsx, pipe-card.tsx
```

## State Management (Redux Toolkit)

### Slice Pattern

```typescript
// ✅ ALWAYS: Follow this exact pattern

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
```

### Async Actions (Thunks)

```typescript
// ✅ ALWAYS: Use createAsyncThunk

import { createAsyncThunk } from '@reduxjs/toolkit';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

// In slice, add extraReducers
extraReducers: (builder) => {
  builder
    .addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(loginUser.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    })
    .addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
}
```

## API Service Pattern

```typescript
// ✅ ALWAYS: Follow this exact pattern

import axios, { AxiosInstance } from 'axios';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true, // Send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Service functions
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    return api.post('/auth/login', credentials);
  },
  
  register: async (data: { email: string; password: string }) => {
    return api.post('/auth/register', data);
  },
  
  getProfile: async () => {
    return api.get('/auth/me');
  },
};

// ❌ NEVER: Inline axios calls in components
// ✅ ALWAYS: Use service functions
```

## Routing (React Router)

```tsx
// ✅ ALWAYS: Follow this pattern

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Protected Route wrapper
const ProtectedRoute: FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// App routes
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pipes" element={<BrowsePipesPage />} />
        <Route path="/pipes/:id" element={<PipeDetailPage />} />
        
        {/* Protected routes */}
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <PipeEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-pipes"
          element={
            <ProtectedRoute>
              <MyPipesPage />
            </ProtectedRoute>
          }
        />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Form Handling

```tsx
// ✅ ALWAYS: Controlled components with validation

import { useState, FormEvent } from 'react';

export const LoginForm: FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      await authService.login({ email, password });
      // Handle success
    } catch (error: any) {
      setErrors({ email: error.response?.data?.error || 'Login failed' });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          disabled={isLoading}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          disabled={isLoading}
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

## Styling (Tailwind CSS)

```tsx
// ✅ ALWAYS: Use Tailwind utility classes

export const Button: FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ❌ NEVER: Inline styles
<button style={{ backgroundColor: 'blue' }}>Click</button> // NO!

// ❌ NEVER: CSS modules or styled-components (use Tailwind)
```

## Page Layout Standards

```tsx
// ✅ ALWAYS: Use PageLayout for standard pages
import { PageLayout } from '../components/common/PageLayout';

export const BrowsePipesPage: FC = () => {
  return (
    <PageLayout>
      {/* Page content */}
    </PageLayout>
  );
};

// ✅ ALWAYS: Add navbar spacer for custom layouts
// NavigationBar is fixed (h-16), so pages need a spacer

export const HomePage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <div className="h-16" /> {/* Spacer for fixed navbar */}
      {/* Page content */}
    </div>
  );
};

// ✅ ALWAYS: Use flex-shrink-0 for fixed elements in flex containers
<div className="h-screen flex flex-col">
  <NavigationBar />
  <div className="h-16 flex-shrink-0" /> {/* Won't shrink */}
  <div className="flex-1">Content</div>
</div>

// ❌ NEVER: Use pt-16 on main content (causes double spacing)
// ❌ NEVER: Rely on NavigationBar to add its own spacer
```

## TypeScript Standards

```typescript
// ✅ ALWAYS: Define prop types

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

// ✅ ALWAYS: Define API response types

interface LoginResponse {
  user: User;
  token: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

// ❌ NEVER: Use `any`
const handleClick = (data: any) => { } // NO!

// ✅ ALWAYS: Use proper types
const handleClick = (data: User) => { }
```

## Error Handling

```tsx
// ✅ ALWAYS: Show user-friendly errors

export const PipeList: FC = () => {
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPipes = async () => {
      try {
        const response = await pipeService.getPublicPipes();
        setPipes(response.data);
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to load pipes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPipes();
  }, []);
  
  if (isLoading) {
    return <div>Loading pipes...</div>;
  }
  
  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  
  return (
    <div>
      {pipes.map(pipe => (
        <PipeCard key={pipe.id} pipe={pipe} />
      ))}
    </div>
  );
};
```

## Environment Variables

```typescript
// ✅ ALWAYS: Use Vite env vars (VITE_ prefix)

// .env
VITE_API_URL=http://localhost:3000/api/v1
VITE_GOOGLE_CLIENT_ID=your-client-id

// Access in code
const apiUrl = import.meta.env.VITE_API_URL;
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ❌ NEVER: Hardcode URLs
const apiUrl = 'http://localhost:3000'; // NO!
```

## Custom Hooks

```typescript
// ✅ ALWAYS: Extract reusable logic into hooks

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );
  
  const login = async (credentials: { email: string; password: string }) => {
    await dispatch(loginUser(credentials));
  };
  
  const logout = () => {
    dispatch(logoutUser());
  };
  
  return { user, isAuthenticated, isLoading, login, logout };
};

// Usage in component
const MyComponent: FC = () => {
  const { user, login, logout } = useAuth();
  
  // Use auth state and functions
};

// ✅ ALWAYS: Use localStorage hook for anonymous users
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};
```

## Performance

```tsx
// ✅ ALWAYS: Memoize expensive computations

import { useMemo, useCallback } from 'react';

const MyComponent: FC<Props> = ({ items }) => {
  // Memoize expensive calculations
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  
  // Memoize callbacks passed to children
  const handleClick = useCallback((id: string) => {
    console.log(id);
  }, []);
  
  return (
    <div>
      {sortedItems.map(item => (
        <ItemCard key={item.id} item={item} onClick={handleClick} />
      ))}
    </div>
  );
};
```

## What AI Should NOT Decide

These are already decided. AI must follow exactly:

- ✅ Component pattern (FC with typed props)
- ✅ State management (Redux Toolkit)
- ✅ API calls (Axios with interceptors)
- ✅ Routing (React Router with ProtectedRoute)
- ✅ Forms (Controlled components)
- ✅ Styling (Tailwind CSS)
- ✅ File organization (as specified above)
- ✅ Naming conventions (PascalCase, camelCase, kebab-case)
- ✅ Error handling (user-friendly messages)
- ✅ TypeScript (no `any` types)

## Summary

**AI has freedom in:**
- Component layout and structure (within Tailwind)
- Business logic implementation
- Helper function names (following conventions)

**AI has NO freedom in:**
- Component patterns (use exactly as shown)
- State management (Redux Toolkit only)
- API patterns (use exactly as shown)
- Routing patterns (use exactly as shown)
- Styling approach (Tailwind only)
- File organization (use exactly as shown)

**When in doubt, follow the patterns in this document exactly.**
