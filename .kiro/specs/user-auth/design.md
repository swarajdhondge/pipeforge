# User Authentication & Management - Design

## System Architecture

### Backend Components

```
backend/src/
├─ routes/
│  └─ auth.routes.ts (new)
├─ services/
│  ├─ user.service.ts (new)
│  └─ oauth.service.ts (new)
├─ middleware/
│  ├─ auth.middleware.ts (new)
│  └─ rate-limit.middleware.ts (new)
├─ types/
│  └─ user.types.ts (new)
├─ errors/
│  └─ auth.errors.ts (new)
└─ config/
   └─ passport.ts (new)
```

### Frontend Components

```
frontend/src/
├─ components/
│  ├─ auth/
│  │  ├─ login-form.tsx (new)
│  │  ├─ register-form.tsx (new)
│  │  ├─ google-oauth-button.tsx (new)
│  │  └─ protected-route.tsx (new)
│  └─ common/
│     ├─ navigation-bar.tsx (new)
│     └─ signup-prompt-modal.tsx (new)
├─ pages/
│  ├─ login-page.tsx (new)
│  └─ register-page.tsx (new)
├─ store/
│  └─ slices/
│     └─ auth-slice.ts (new)
├─ services/
│  └─ auth-service.ts (new)
├─ hooks/
│  ├─ use-auth.ts (new)
│  └─ use-local-storage.ts (new)
└─ types/
   └─ auth.types.ts (new)
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- nullable for OAuth users
  name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  auth_provider VARCHAR(20) DEFAULT 'email', -- 'email' or 'google'
  google_id VARCHAR(255) UNIQUE, -- Google OAuth ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

### Execution Tracking Table (for anonymous users)

```sql
CREATE TABLE anonymous_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL, -- from localStorage
  execution_count INT DEFAULT 0,
  last_execution_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anonymous_executions_session_id ON anonymous_executions(session_id);
```

**Why nullable password_hash?**
- OAuth users don't have passwords
- Can link email/password later if needed

**Why separate refresh_tokens table?**
- Can revoke tokens (logout from all devices)
- Track active sessions
- Rotate tokens for security

**Why track anonymous executions?**
- Enforce 5 execution limit
- Prevent abuse (can't just clear localStorage)
- Track usage patterns

## API Endpoints

### POST /api/v1/auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "localPipes": [ /* optional: pipes from localStorage */ ]
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": null,
    "avatar_url": null,
    "created_at": "2025-01-01T00:00:00Z"
  },
  "accessToken": "jwt.access.token",
  "refreshToken": "jwt.refresh.token",
  "migratedPipes": 3
}
```

**Errors:**
- 400: Invalid email format
- 400: Password too short (< 8 chars)
- 409: Email already exists
- 500: Server error

### POST /api/v1/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "localPipes": [ /* optional: pipes from localStorage */ ]
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://...",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "accessToken": "jwt.access.token",
  "refreshToken": "jwt.refresh.token",
  "migratedPipes": 2
}
```

**Errors:**
- 400: Missing email or password
- 401: Invalid credentials
- 429: Too many attempts (rate limited)
- 500: Server error

### GET /api/v1/auth/google

Initiates Google OAuth flow. Redirects to Google.

**Query params:**
- `state`: Random string for CSRF protection

### GET /api/v1/auth/google/callback

Google OAuth callback endpoint.

**Query params:**
- `code`: Authorization code from Google
- `state`: CSRF protection token

**Response:** Redirects to frontend with tokens in URL or sets httpOnly cookies

### POST /api/v1/auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "jwt.refresh.token"
}
```

**Response (200):**
```json
{
  "accessToken": "new.jwt.access.token",
  "refreshToken": "new.jwt.refresh.token"
}
```

**Errors:**
- 401: Invalid or expired refresh token
- 500: Server error

### POST /api/v1/auth/logout

Logout and invalidate refresh token.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "refreshToken": "jwt.refresh.token"
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### GET /api/v1/auth/me

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "bio": "Data enthusiast",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Errors:**
- 401: Missing or invalid token
- 500: Server error

### PUT /api/v1/auth/me

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "name": "John Doe",
  "bio": "Data enthusiast"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "bio": "Data enthusiast",
  "avatar_url": "https://...",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Errors:**
- 401: Missing or invalid token
- 400: Invalid input
- 500: Server error

### POST /api/v1/auth/check-execution-limit

Check if anonymous user has reached execution limit.

**Request:**
```json
{
  "sessionId": "uuid-from-localStorage"
}
```

**Response (200):**
```json
{
  "executionCount": 3,
  "limit": 5,
  "remaining": 2,
  "canExecute": true
}
```

**Errors:**
- 429: Execution limit reached
- 500: Server error

## Frontend Architecture

### State Management (Redux)

```typescript
// Auth Slice
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Anonymous User Slice
interface AnonymousState {
  sessionId: string; // UUID stored in localStorage
  executionCount: number;
  executionLimit: number;
  localPipes: Pipe[]; // Pipes stored in localStorage
}
```

### Local Storage Keys

```typescript
const STORAGE_KEYS = {
  SESSION_ID: 'yahoo_pipes_session_id',
  EXECUTION_COUNT: 'yahoo_pipes_execution_count',
  LOCAL_PIPES: 'yahoo_pipes_local_pipes',
  ACCESS_TOKEN: 'yahoo_pipes_access_token',
  REFRESH_TOKEN: 'yahoo_pipes_refresh_token',
};
```

### Component Hierarchy

```
App
├─ NavigationBar
│  ├─ Logo
│  ├─ NavLinks (Browse, Create)
│  └─ UserMenu (if authenticated) / SignInButton (if not)
├─ Routes
│  ├─ HomePage
│  ├─ LoginPage
│  │  ├─ LoginForm
│  │  └─ GoogleOAuthButton
│  ├─ RegisterPage
│  │  ├─ RegisterForm
│  │  └─ GoogleOAuthButton
│  ├─ BrowsePipesPage (public)
│  ├─ PipeDetailPage (public)
│  ├─ PipeEditorPage
│  │  ├─ EditorCanvas
│  │  ├─ OperatorPalette
│  │  └─ ExecutionControls
│  │     └─ ExecutionLimitBanner (if anonymous)
│  └─ MyPipesPage (protected)
└─ Modals
   ├─ SignupPromptModal (after 5 executions)
   └─ LocalStorageWarningModal (before browser close)
```

### Key React Components

#### LoginForm Component
```tsx
export const LoginForm: FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { localPipes } = useSelector((state: RootState) => state.anonymous);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      // Login with local pipes for migration
      await dispatch(loginUser({ 
        email, 
        password, 
        localPipes 
      }));
      
      // Clear local storage after successful migration
      localStorage.removeItem(STORAGE_KEYS.LOCAL_PIPES);
      
      // Redirect to dashboard
      navigate('/my-pipes');
    } catch (error: any) {
      setErrors({ email: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (/* form JSX */);
};
```

#### GoogleOAuthButton Component
```tsx
export const GoogleOAuthButton: FC = () => {
  const handleGoogleLogin = () => {
    // Generate state for CSRF protection
    const state = generateRandomString();
    localStorage.setItem('oauth_state', state);
    
    // Redirect to backend OAuth endpoint
    window.location.href = `/api/v1/auth/google?state=${state}`;
  };
  
  return (
    <button onClick={handleGoogleLogin} className="google-btn">
      <GoogleIcon />
      Sign in with Google
    </button>
  );
};
```

#### ProtectedRoute Component
```tsx
export const ProtectedRoute: FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

#### ExecutionLimitBanner Component
```tsx
export const ExecutionLimitBanner: FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { executionCount, executionLimit } = useSelector(
    (state: RootState) => state.anonymous
  );
  
  if (isAuthenticated) return null;
  
  const remaining = executionLimit - executionCount;
  
  return (
    <div className="banner warning">
      <p>
        {remaining > 0 
          ? `${remaining} free executions remaining. Sign up for unlimited!`
          : 'Execution limit reached. Sign up to continue!'
        }
      </p>
      <button onClick={() => navigate('/register')}>
        Sign Up Free
      </button>
    </div>
  );
};
```

#### SignupPromptModal Component
```tsx
export const SignupPromptModal: FC<{ isOpen: boolean }> = ({ isOpen }) => {
  if (!isOpen) return null;
  
  return (
    <Modal>
      <h2>You've used your 5 free executions!</h2>
      <p>Sign up to get unlimited executions and save your pipes permanently.</p>
      <div className="buttons">
        <button onClick={() => navigate('/register')}>
          Sign Up Free
        </button>
        <button onClick={() => navigate('/login')}>
          Sign In
        </button>
      </div>
    </Modal>
  );
};
```

### Custom Hooks

#### useAuth Hook
```tsx
export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );
  
  const login = async (credentials: LoginCredentials) => {
    await dispatch(loginUser(credentials));
  };
  
  const register = async (data: RegisterData) => {
    await dispatch(registerUser(data));
  };
  
  const logout = async () => {
    await dispatch(logoutUser());
    localStorage.clear(); // Clear all local data
  };
  
  return { user, isAuthenticated, isLoading, login, register, logout };
};
```

#### useLocalStorage Hook
```tsx
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
      console.error('Error saving to localStorage', error);
    }
  };
  
  return [storedValue, setValue] as const;
};
```

#### useExecutionLimit Hook
```tsx
export const useExecutionLimit = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { executionCount, executionLimit } = useSelector(
    (state: RootState) => state.anonymous
  );
  
  const canExecute = isAuthenticated || executionCount < executionLimit;
  const remaining = executionLimit - executionCount;
  
  const checkAndIncrement = async () => {
    if (isAuthenticated) return true; // No limit for authenticated users
    
    if (executionCount >= executionLimit) {
      // Show signup modal
      dispatch(setShowSignupModal(true));
      return false;
    }
    
    // Increment count
    dispatch(incrementExecutionCount());
    return true;
  };
  
  return { canExecute, remaining, checkAndIncrement };
};
```

### Local Pipe Migration Flow

```typescript
// When user signs up or logs in
const migrateLoca lPipes = async (accessToken: string) => {
  // 1. Get pipes from localStorage
  const localPipes = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.LOCAL_PIPES) || '[]'
  );
  
  if (localPipes.length === 0) return;
  
  // 2. Send to backend
  const response = await api.post('/pipes/migrate', {
    pipes: localPipes
  }, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  // 3. Clear localStorage
  localStorage.removeItem(STORAGE_KEYS.LOCAL_PIPES);
  
  // 4. Show success message
  toast.success(`${response.data.migratedCount} pipes saved to your account!`);
};
```

## Backend Class/Interface Definitions

### Types (user.types.ts)

```typescript
export interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  auth_provider: 'email' | 'google';
  created_at: Date;
  updated_at: Date;
}

export interface UserRow extends User {
  password_hash?: string; // nullable for OAuth users
  google_id?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  localPipes?: any[]; // Pipes from localStorage to migrate
}

export interface LoginRequest {
  email: string;
  password: string;
  localPipes?: any[]; // Pipes from localStorage to migrate
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  migratedPipes?: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}
```

### Service (user.service.ts)

```typescript
export interface IUserService {
  register(email: string, password: string, localPipes?: any[]): Promise<AuthResponse>;
  login(email: string, password: string, localPipes?: any[]): Promise<AuthResponse>;
  loginWithGoogle(googleProfile: GoogleProfile, localPipes?: any[]): Promise<AuthResponse>;
  getById(userId: string): Promise<User>;
  updateProfile(userId: string, data: UpdateProfileRequest): Promise<User>;
  verifyPassword(user: UserRow, password: string): Promise<boolean>;
  generateTokens(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  revokeRefreshToken(refreshToken: string): Promise<void>;
}

export class UserService implements IUserService {
  constructor(
    private db: Pool,
    private logger: Logger
  ) {}
  
  async register(email: string, password: string, localPipes?: any[]): Promise<AuthResponse> {
    // 1. Validate email format
    // 2. Check if email exists
    // 3. Hash password (bcrypt, 10 rounds)
    // 4. Insert into database
    // 5. Generate access + refresh tokens
    // 6. Migrate local pipes if provided
    // 7. Return user + tokens + migrated count
  }
  
  async login(email: string, password: string, localPipes?: any[]): Promise<AuthResponse> {
    // 1. Find user by email
    // 2. Verify password
    // 3. Generate access + refresh tokens
    // 4. Migrate local pipes if provided
    // 5. Return user + tokens + migrated count
  }
  
  async loginWithGoogle(googleProfile: GoogleProfile, localPipes?: any[]): Promise<AuthResponse> {
    // 1. Check if user exists by google_id
    // 2. If not, check by email (account linking)
    // 3. If not, create new user
    // 4. Generate access + refresh tokens
    // 5. Migrate local pipes if provided
    // 6. Return user + tokens + migrated count
  }
  
  async generateTokens(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Generate access token (1 hour expiry)
    const accessToken = jwt.sign(
      { userId, email, type: 'access' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    
    // 2. Generate refresh token (7 days expiry)
    const refreshToken = jwt.sign(
      { userId, email, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    // 3. Store refresh token in database
    await this.db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [userId, refreshToken]
    );
    
    return { accessToken, refreshToken };
  }
  
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Verify refresh token
    // 2. Check if token exists in database
    // 3. Generate new access token
    // 4. Rotate refresh token (generate new one)
    // 5. Delete old refresh token
    // 6. Return new tokens
  }
  
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    // Delete refresh token from database
    await this.db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }
  
  private async migratePipes(userId: string, localPipes: any[]): Promise<number> {
    // 1. Validate pipes
    // 2. Insert pipes into database with user_id
    // 3. Return count of migrated pipes
  }
}
```

### OAuth Service (oauth.service.ts)

```typescript
export interface IOAuthService {
  getGoogleAuthUrl(state: string): string;
  handleGoogleCallback(code: string, state: string): Promise<GoogleProfile>;
}

export class OAuthService implements IOAuthService {
  private googleClientId: string;
  private googleClientSecret: string;
  private googleRedirectUri: string;
  
  constructor() {
    this.googleClientId = process.env.GOOGLE_CLIENT_ID!;
    this.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    this.googleRedirectUri = process.env.GOOGLE_REDIRECT_URI!;
  }
  
  getGoogleAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: this.googleRedirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
  
  async handleGoogleCallback(code: string, state: string): Promise<GoogleProfile> {
    // 1. Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: this.googleClientId,
      client_secret: this.googleClientSecret,
      redirect_uri: this.googleRedirectUri,
      grant_type: 'authorization_code',
    });
    
    const { access_token } = tokenResponse.data;
    
    // 2. Get user profile
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    
    return {
      id: profileResponse.data.id,
      email: profileResponse.data.email,
      name: profileResponse.data.name,
      picture: profileResponse.data.picture,
    };
  }
}
```

### Middleware (auth.middleware.ts)

```typescript
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  // 1. Extract token from Authorization header
  // 2. Verify token with JWT_SECRET
  // 3. Attach user payload to req.user
  // 4. Call next() or return 401
}
```

### Routes (auth.routes.ts)

```typescript
export function createAuthRoutes(
  userService: IUserService,
  oauthService: IOAuthService
): Router {
  const router = Router();
  
  router.post('/register', async (req, res) => {
    try {
      // 1. Validate input
      const { email, password, localPipes } = validateRegisterInput(req.body);
      
      // 2. Register user and migrate pipes
      const authResponse = await userService.register(email, password, localPipes);
      
      // 3. Return user + tokens
      return res.status(201).json(authResponse);
    } catch (error) {
      // Handle errors (UserAlreadyExistsError, ValidationError, etc.)
    }
  });
  
  router.post('/login', async (req, res) => {
    try {
      // 1. Validate input
      const { email, password, localPipes } = validateLoginInput(req.body);
      
      // 2. Login user and migrate pipes
      const authResponse = await userService.login(email, password, localPipes);
      
      // 3. Return user + tokens
      return res.status(200).json(authResponse);
    } catch (error) {
      // Handle errors (InvalidCredentialsError, etc.)
    }
  });
  
  router.get('/google', (req, res) => {
    // 1. Generate state for CSRF protection
    const state = generateRandomString();
    
    // 2. Store state in session or temporary storage
    // (In production, use Redis with expiry)
    
    // 3. Redirect to Google OAuth
    const authUrl = oauthService.getGoogleAuthUrl(state);
    res.redirect(authUrl);
  });
  
  router.get('/google/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      
      // 1. Verify state (CSRF protection)
      // 2. Exchange code for profile
      const googleProfile = await oauthService.handleGoogleCallback(code, state);
      
      // 3. Login or create user
      const authResponse = await userService.loginWithGoogle(googleProfile);
      
      // 4. Redirect to frontend with tokens
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${authResponse.accessToken}&refreshToken=${authResponse.refreshToken}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  });
  
  router.post('/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }
      
      const tokens = await userService.refreshAccessToken(refreshToken);
      return res.status(200).json(tokens);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
  });
  
  router.post('/logout', authenticateToken, async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await userService.revokeRefreshToken(refreshToken);
      }
      
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Logout failed' });
    }
  });
  
  router.get('/me', authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.userId;
      const user = await userService.getById(userId);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(404).json({ error: 'User not found' });
    }
  });
  
  router.put('/me', authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.userId;
      const data = validateUpdateProfileInput(req.body);
      const user = await userService.updateProfile(userId, data);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(400).json({ error: 'Update failed' });
    }
  });
  
  router.post('/check-execution-limit', async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      // Query anonymous_executions table
      const result = await db.query(
        'SELECT execution_count FROM anonymous_executions WHERE session_id = $1',
        [sessionId]
      );
      
      const executionCount = result.rows[0]?.execution_count || 0;
      const limit = 5;
      
      if (executionCount >= limit) {
        return res.status(429).json({
          executionCount,
          limit,
          remaining: 0,
          canExecute: false,
        });
      }
      
      return res.status(200).json({
        executionCount,
        limit,
        remaining: limit - executionCount,
        canExecute: true,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to check limit' });
    }
  });
  
  return router;
}
```

## Security Considerations

### Password Hashing
- Use bcrypt with 10 rounds (balance security vs performance)
- Never store plain text passwords
- Never log passwords (even in errors)

### JWT Tokens
- Sign with strong secret (min 32 characters)
- Store secret in environment variable
- Set expiry to 1 hour
- Include minimal payload (userId, email only)

### Input Validation
- Email: Valid format, max 255 chars
- Password: Min 8 chars, max 100 chars
- Name: Max 255 chars, sanitize HTML
- Bio: Max 1000 chars, sanitize HTML

### Rate Limiting
- Login endpoint: 5 attempts per minute per IP
- Register endpoint: 3 attempts per minute per IP
- Use Redis for distributed rate limiting

### SQL Injection Prevention
- Use parameterized queries (pg library)
- Never concatenate user input into SQL

### XSS Prevention
- Sanitize all user inputs (name, bio)
- Use Content-Security-Policy headers

## Performance Implications

### Database
- Index on email column (login queries)
- Connection pooling (max 20 connections)

### JWT
- Stateless (no database lookup on every request)
- Fast verification (< 1ms)

### Password Hashing
- Bcrypt is intentionally slow (~100ms)
- Acceptable for login/register (not frequent)
- Don't hash on every request (only on register/login)

## Error Handling

### Custom Errors

```typescript
export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidTokenError extends Error {
  constructor() {
    super('Invalid or expired token');
    this.name = 'InvalidTokenError';
  }
}
```

### Error Responses

```typescript
// In routes
try {
  const user = await userService.register(email, password);
} catch (error) {
  if (error instanceof UserAlreadyExistsError) {
    return res.status(409).json({ error: error.message });
  }
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }
  // Log unexpected errors
  logger.error('Registration error', { error, email });
  return res.status(500).json({ error: 'Internal server error' });
}
```

## Environment Variables

```bash
# JWT
JWT_SECRET=<strong-random-secret-min-32-chars>
JWT_EXPIRY=1h

# Database
DATABASE_URL=postgresql://user:pass@host:5432/pipes_dev

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_WINDOW=60000  # 1 minute in ms
RATE_LIMIT_REGISTER_ATTEMPTS=3
RATE_LIMIT_REGISTER_WINDOW=60000
```

## Testing Strategy

### Unit Tests
- UserService.register() - success case
- UserService.register() - duplicate email
- UserService.login() - success case
- UserService.login() - invalid password
- UserService.verifyPassword() - correct password
- UserService.verifyPassword() - incorrect password

### Integration Tests
- POST /auth/register - success
- POST /auth/register - duplicate email
- POST /auth/login - success
- POST /auth/login - invalid credentials
- GET /auth/me - with valid token
- GET /auth/me - with invalid token
- PUT /auth/me - update profile

### Manual Tests
- Register with various email formats
- Login with wrong password multiple times (rate limiting)
- Access protected route without token
- Access protected route with expired token

## Migration Strategy

### Initial Migration

```sql
-- migrations/001_create_users_table.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### Rollback

```sql
-- migrations/001_create_users_table.down.sql
DROP TABLE IF EXISTS users;
```

## Dependencies

### New Packages
```json
{
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "express-rate-limit": "^7.1.5",
  "rate-limit-redis": "^4.2.0",
  "validator": "^13.11.0"
}
```

### Dev Dependencies
```json
{
  "@types/bcrypt": "^5.0.2",
  "@types/jsonwebtoken": "^9.0.5",
  "@types/validator": "^13.11.7"
}
```

## Why These Choices?

**Why bcrypt over argon2?**
- More mature, widely used
- Good enough security for MVP
- Can switch later if needed

**Why JWT over sessions?**
- Stateless (no session store needed)
- Scales horizontally (no sticky sessions)
- Works well with microservices (future)

**Why 1 hour expiry?**
- Balance security vs UX
- Short enough to limit damage if stolen
- Long enough to not annoy users
- Can add refresh tokens later

**Why rate limiting on Redis?**
- Distributed (works across multiple servers)
- Fast (in-memory)
- Persistent (survives restarts)

**Why not email verification?**
- Adds complexity (email service, verification flow)
- Not critical for MVP
- Can add in Phase 7 (Polish)

## Summary of Design

### Backend Features
✅ Email/password authentication (bcrypt hashing)
✅ Google OAuth integration (passport.js)
✅ JWT access tokens (1 hour expiry)
✅ Refresh tokens (7 days expiry, stored in DB)
✅ Token refresh endpoint
✅ Logout (revoke refresh token)
✅ Local pipe migration on signup/login
✅ Anonymous execution tracking (5 limit)
✅ Rate limiting on login endpoint

### Frontend Features
✅ Login/Register forms with validation
✅ Google OAuth button
✅ Protected routes (redirect to login)
✅ Session persistence (tokens in localStorage)
✅ Automatic token refresh
✅ Local pipe storage (localStorage)
✅ Execution limit tracking
✅ Signup prompts (after 5 executions)
✅ Local storage warning (before browser close)
✅ Pipe migration on signup/login

### User Experience Flow
1. Anonymous user creates pipe → Stored in localStorage
2. Anonymous user executes pipe → Count tracked (1/5, 2/5, etc.)
3. After 5 executions → Signup modal appears
4. User signs up → Local pipes migrated to account
5. User now has unlimited executions + permanent storage

### Security Measures
✅ Passwords hashed with bcrypt (10 rounds)
✅ JWT tokens with short expiry
✅ Refresh token rotation
✅ CSRF protection (state parameter in OAuth)
✅ Rate limiting (5 login attempts/minute)
✅ Input validation on all endpoints
✅ SQL injection prevention (parameterized queries)
✅ XSS prevention (sanitized inputs)
