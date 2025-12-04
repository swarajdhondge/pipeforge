# User Authentication & Management - Tasks

## Task Breakdown

### Task 1: Backend Project Setup & Database Schema (3 hours)

**Goal:** Initialize backend project and create all auth-related tables

**Steps:**
1. Create `backend/` directory structure (following implementation-standards.md)
2. Initialize npm project
3. Install dependencies:
   - express, pg, bcrypt, jsonwebtoken, passport, passport-google-oauth20
   - cors, dotenv, validator, winston
   - @types packages
4. Setup TypeScript configuration (strict mode)
5. Create database connection module (Pool with 20 connections)
6. Write migrations:
   - 001_create_users_table.sql
   - 002_create_refresh_tokens_table.sql
   - 003_create_anonymous_executions_table.sql
7. Run migrations

**Files Created:**
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/src/config/database.ts`
- `backend/src/config/env.ts`
- `backend/src/migrations/001_create_users_table.sql`
- `backend/src/migrations/002_create_refresh_tokens_table.sql`
- `backend/src/migrations/003_create_anonymous_executions_table.sql`
- `backend/src/scripts/migrate.ts`
- `backend/.env.example`

**Definition of Done:**
- [x] All dependencies installed
- [x] TypeScript compiles without errors (strict mode)
- [x] Database connection works
- [x] All three tables created in database
- [x] Can query all tables (empty)
- [x] Environment variables validated on startup

**Status: ✅ COMPLETED**

**Dependencies:** None

---

### Task 2: Backend Types & Error Classes (1 hour)

**Goal:** Define TypeScript types and custom errors

**Steps:**
1. Create `types/user.types.ts` with all interfaces from design.md:
   - User, UserRow, RegisterRequest, LoginRequest, AuthResponse
   - JWTPayload, GoogleProfile, RefreshToken
2. Create `errors/auth.errors.ts` with custom error classes:
   - UserAlreadyExistsError
   - InvalidCredentialsError
   - InvalidTokenError
   - ExecutionLimitReachedError
3. Create `utils/logger.ts` (Winston with JSON format)

**Files Created:**
- `backend/src/types/user.types.ts`
- `backend/src/errors/auth.errors.ts`
- `backend/src/utils/logger.ts`

**Definition of Done:**
- [x] All types defined (matching design.md)
- [x] All error classes defined
- [x] Logger configured (Winston, JSON format)
- [x] TypeScript compiles without errors
- [x] No `any` types used
- [x] All exported properly

**Status: ✅ COMPLETED**

**Dependencies:** Task 1

---

### Task 3: User Service (3 hours)

**Goal:** Implement user business logic with token management

**Steps:**
1. Create `services/user.service.ts` implementing IUserService
2. Implement `register()` method:
   - Validate email format (validator library)
   - Check if email exists
   - Hash password (bcrypt, 10 rounds)
   - Insert into database (parameterized query)
   - Generate access + refresh tokens
   - Migrate local pipes if provided
   - Return AuthResponse
3. Implement `login()` method:
   - Find user by email
   - Verify password (bcrypt.compare)
   - Generate tokens
   - Migrate local pipes if provided
   - Return AuthResponse
4. Implement `generateTokens()` method:
   - Create access token (1 hour expiry)
   - Create refresh token (7 days expiry)
   - Store refresh token in database
   - Return both tokens
5. Implement `refreshAccessToken()` method:
   - Verify refresh token
   - Check database
   - Generate new access token
   - Rotate refresh token
   - Return new tokens
6. Implement `revokeRefreshToken()` method
7. Implement `getById()` method
8. Implement `updateProfile()` method
9. Implement `migratePipes()` private method

**Files Created:**
- `backend/src/services/user.service.ts`

**Definition of Done:**
- [x] All methods implemented (following implementation-standards.md)
- [x] Password hashing works (bcrypt, 10 rounds)
- [x] Passwords never returned
- [x] Tokens generated correctly (JWT)
- [x] Refresh tokens stored in database
- [x] Local pipes migrated correctly
- [x] Custom errors thrown appropriately
- [x] No `any` types
- [x] TypeScript strict mode passes

**Status: ✅ COMPLETED**

**Dependencies:** Task 2

---

### Task 4: OAuth Service (2 hours)

**Goal:** Implement Google OAuth integration

**Steps:**
1. Create `services/oauth.service.ts` implementing IOAuthService
2. Implement `getGoogleAuthUrl()` method:
   - Build OAuth URL with client_id, redirect_uri, scope, state
   - Return URL string
3. Implement `handleGoogleCallback()` method:
   - Exchange code for access token
   - Fetch user profile from Google
   - Return GoogleProfile
4. Add `loginWithGoogle()` to UserService:
   - Check if user exists by google_id
   - If not, check by email (account linking)
   - If not, create new user
   - Generate tokens
   - Migrate local pipes
   - Return AuthResponse
5. Create `config/passport.ts` (optional, for passport.js setup)

**Files Created:**
- `backend/src/services/oauth.service.ts`
- `backend/src/config/passport.ts` (optional)

**Definition of Done:**
- [x] OAuth URL generation works
- [x] Google callback handling works
- [x] User profile fetched correctly
- [x] Account linking works (same email)
- [x] New user creation works
- [x] Tokens generated for OAuth users
- [x] No `any` types
- [x] Error handling for OAuth failures

**Status: ✅ COMPLETED**

**Dependencies:** Task 3

---

### Task 5: Auth Middleware & Validation (1.5 hours)

**Goal:** Implement JWT middleware and input validation

**Steps:**
1. Create `middleware/auth.middleware.ts`:
   - Implement `authenticateToken()` function
   - Extract token from Authorization header
   - Verify token with JWT_SECRET
   - Check token type (must be 'access')
   - Attach user payload to req.user
   - Handle errors (missing, invalid, expired)
2. Create validation functions:
   - `validateRegisterInput()` - email, password, localPipes
   - `validateLoginInput()` - email, password, localPipes
   - `validateUpdateProfileInput()` - name, bio
   - Use validator library for email format
   - Check password length (8-100 chars)

**Files Created:**
- `backend/src/middleware/auth.middleware.ts`
- `backend/src/utils/validators.ts`

**Definition of Done:**
- [x] Middleware extracts and verifies JWT
- [x] Only access tokens accepted (not refresh)
- [x] Invalid tokens return 401
- [x] Expired tokens return 401
- [x] Valid tokens attach user to request
- [x] All validation functions work
- [x] Clear error messages
- [x] No `any` types

**Status: ✅ COMPLETED**

**Dependencies:** Task 2

---

### Task 6: Auth Routes (3 hours)

**Goal:** Implement all authentication API endpoints

**Steps:**
1. Create `routes/auth.routes.ts` with all endpoints from design.md:
   - POST /auth/register (with local pipe migration)
   - POST /auth/login (with local pipe migration)
   - GET /auth/google (initiate OAuth)
   - GET /auth/google/callback (handle OAuth)
   - POST /auth/refresh (refresh access token)
   - POST /auth/logout (revoke refresh token)
   - GET /auth/me (get current user, protected)
   - PUT /auth/me (update profile, protected)
   - POST /auth/check-execution-limit (check anonymous limit)
2. Follow exact pattern from implementation-standards.md:
   - Validate input first
   - Call service
   - Return response
   - Handle errors (specific types first)
3. Add CSRF protection for OAuth (state parameter)

**Files Created:**
- `backend/src/routes/auth.routes.ts`

**Definition of Done:**
- [x] All 9 endpoints implemented
- [x] Input validation on all endpoints
- [x] Error responses consistent (JSON format)
- [x] Protected routes use auth middleware
- [x] Passwords never returned
- [x] Local pipes migrated on register/login
- [x] OAuth flow works (state verification)
- [x] Refresh token rotation works
- [x] Execution limit check works
- [x] Can test with curl/Postman

**Status: ✅ COMPLETED**

**Dependencies:** Task 3, Task 4, Task 5

---

### Task 7: Rate Limiting & Server Setup (2 hours)

**Goal:** Add rate limiting and wire everything together

**Steps:**
1. Install express-rate-limit and rate-limit-redis
2. Create `middleware/rate-limit.middleware.ts`:
   - Login rate limiter (5 attempts/minute per IP)
   - Register rate limiter (3 attempts/minute per IP)
   - Use Redis for distributed limiting
3. Create `config/redis.ts` (Redis client setup)
4. Create `server.ts` (entry point):
   - Initialize Express app
   - Add middleware (cors, json, helmet)
   - Mount auth routes at /api/v1/auth
   - Add global error handler
   - Add 404 handler
   - Start server on PORT from env
5. Create `middleware/error.middleware.ts` (global error handler)

**Files Created:**
- `backend/src/middleware/rate-limit.middleware.ts`
- `backend/src/config/redis.ts`
- `backend/src/server.ts`
- `backend/src/middleware/error.middleware.ts`

**Definition of Done:**
- [x] Rate limiting works on login (5/min)
- [x] Rate limiting works on register (3/min)
- [x] Returns 429 when limit exceeded
- [x] Redis connection works
- [x] Server starts without errors
- [x] All routes accessible at /api/v1/auth
- [x] CORS configured (from env)
- [x] Global error handler works
- [x] Logging works (Winston)
- [x] Can test all endpoints

**Status: ✅ COMPLETED**

**Dependencies:** Task 6

---

### Task 8: Backend Testing (2 hours)

**Goal:** Verify all backend endpoints work

**Steps:**
1. Manual testing with Postman/curl:
   - Register new user (email/password)
   - Register with local pipes (verify migration)
   - Login with correct credentials
   - Login with wrong credentials (verify rate limiting)
   - Refresh access token
   - Get profile with valid token
   - Get profile with invalid token
   - Update profile
   - Logout
   - Check execution limit (anonymous)
2. Test Google OAuth flow (if possible)
3. Test error cases:
   - Duplicate email registration
   - Invalid email format
   - Password too short
   - Missing required fields
   - Expired tokens
4. Document test results

**Files Created:**
- `backend/tests/auth.manual.md` (test documentation)

**Definition of Done:**
- [x] All happy paths work
- [x] All error cases handled correctly
- [x] Rate limiting works (429 after limit)
- [x] No passwords leaked in responses
- [x] JWT tokens work correctly
- [x] Refresh token rotation works
- [x] Local pipe migration works
- [x] Execution limit tracking works
- [x] Test results documented

**Status: ✅ COMPLETED**

**Dependencies:** Task 7

---

### Task 9: Frontend Project Setup (2 hours)

**Goal:** Initialize React frontend with TypeScript and Tailwind

**Steps:**
1. Create `frontend/` directory
2. Initialize Vite project with React + TypeScript template
3. Install dependencies:
   - react-router-dom, @reduxjs/toolkit, react-redux
   - axios, @react-oauth/google
   - tailwindcss, autoprefixer, postcss
4. Setup Tailwind CSS configuration
5. Create directory structure (following frontend-standards.md):
   - components/, pages/, store/, services/, hooks/, types/, utils/
6. Create `.env.example` with VITE_API_URL, VITE_GOOGLE_CLIENT_ID
7. Setup Redux store with auth slice skeleton

**Files Created:**
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/tailwind.config.js`
- `frontend/vite.config.ts`
- `frontend/.env.example`
- `frontend/src/store/store.ts`
- `frontend/src/store/slices/auth-slice.ts` (skeleton)

**Definition of Done:**
- [x] Vite dev server runs
- [x] TypeScript compiles without errors
- [x] Tailwind CSS works
- [x] Redux store configured
- [x] Directory structure matches frontend-standards.md
- [x] Environment variables configured

**Status: ✅ COMPLETED**

**Dependencies:** None (can run parallel with backend)

---

### Task 10: Frontend Types & API Service (1.5 hours)

**Goal:** Define types and API communication layer

**Steps:**
1. Create `types/auth.types.ts`:
   - User, LoginRequest, RegisterRequest, AuthResponse
   - Match backend types
2. Create `services/api.ts`:
   - Axios instance with baseURL
   - Request interceptor (add token)
   - Response interceptor (handle 401)
3. Create `services/auth-service.ts`:
   - login(), register(), loginWithGoogle()
   - refreshToken(), logout()
   - getProfile(), updateProfile()
   - checkExecutionLimit()
4. Follow exact pattern from frontend-standards.md

**Files Created:**
- `frontend/src/types/auth.types.ts`
- `frontend/src/services/api.ts`
- `frontend/src/services/auth-service.ts`

**Definition of Done:**
- [x] All types defined (matching backend)
- [x] Axios instance configured
- [x] Interceptors work (token, 401 handling)
- [x] All API service functions defined
- [x] No `any` types
- [x] TypeScript compiles without errors

**Status: ✅ COMPLETED**

**Dependencies:** Task 9

---

---

### Task 11: Redux Auth Slice & Thunks (2 hours)

**Goal:** Implement complete auth state management

**Steps:**
1. Complete `store/slices/auth-slice.ts`:
   - AuthState interface (user, tokens, isAuthenticated, isLoading, error)
   - Initial state
   - Reducers (loginStart, loginSuccess, loginFailure, logout, etc.)
2. Create async thunks:
   - loginUser (with local pipe migration)
   - registerUser (with local pipe migration)
   - refreshToken (automatic refresh)
   - logoutUser
   - fetchProfile
   - updateProfile
3. Add extraReducers for all thunks
4. Follow exact pattern from frontend-standards.md

**Files Created:**
- `frontend/src/store/slices/auth-slice.ts` (complete)

**Definition of Done:**
- [x] Auth slice complete with all reducers
- [x] All async thunks implemented
- [x] Local pipe migration in register/login
- [x] Token refresh logic works
- [x] Logout clears all state
- [x] No `any` types
- [x] TypeScript compiles without errors

**Status: ✅ COMPLETED**

**Dependencies:** Task 10

---

### Task 12: Custom Hooks (1 hour)

**Goal:** Create reusable auth hooks

**Steps:**
1. Create `hooks/use-auth.ts`:
   - useAuth hook (user, isAuthenticated, login, register, logout)
2. Create `hooks/use-local-storage.ts`:
   - useLocalStorage hook (generic)
3. Create `hooks/use-execution-limit.ts`:
   - useExecutionLimit hook (canExecute, remaining, checkAndIncrement)
4. Follow exact pattern from frontend-standards.md

**Files Created:**
- `frontend/src/hooks/use-auth.ts`
- `frontend/src/hooks/use-local-storage.ts`
- `frontend/src/hooks/use-execution-limit.ts`

**Definition of Done:**
- [x] All hooks implemented
- [x] Hooks use Redux correctly
- [x] useLocalStorage is generic
- [x] useExecutionLimit tracks anonymous users
- [x] No `any` types
- [x] TypeScript compiles without errors

**Status: ✅ COMPLETED**

**Dependencies:** Task 11

---

### Task 13: Auth Components (3 hours)

**Goal:** Build login, register, and OAuth components

**Steps:**
1. Create `components/auth/login-form.tsx`:
   - Email/password inputs with validation
   - Error display
   - Loading state
   - Submit handler (calls useAuth)
2. Create `components/auth/register-form.tsx`:
   - Similar to login form
   - Password confirmation
3. Create `components/auth/google-oauth-button.tsx`:
   - Google sign-in button
   - Redirects to backend OAuth endpoint
4. Create `components/auth/protected-route.tsx`:
   - Checks isAuthenticated
   - Redirects to /login if not authenticated
5. Follow exact pattern from frontend-standards.md (FC, typed props, controlled components)

**Files Created:**
- `frontend/src/components/auth/login-form.tsx`
- `frontend/src/components/auth/register-form.tsx`
- `frontend/src/components/auth/google-oauth-button.tsx`
- `frontend/src/components/auth/protected-route.tsx`

**Definition of Done:**
- [x] All components implemented
- [x] Forms have validation
- [x] Error messages displayed
- [x] Loading states shown
- [x] Google OAuth button works
- [x] Protected route redirects correctly
- [x] Tailwind CSS styling applied
- [x] No `any` types
- [x] TypeScript compiles without errors

**Status: ✅ COMPLETED**

**Dependencies:** Task 12

---

### Task 14: Pages & Navigation (2 hours)

**Goal:** Create pages and navigation bar

**Steps:**
1. Create `pages/login-page.tsx`:
   - LoginForm component
   - GoogleOAuthButton component
   - Link to register page
2. Create `pages/register-page.tsx`:
   - RegisterForm component
   - GoogleOAuthButton component
   - Link to login page
3. Create `components/common/navigation-bar.tsx`:
   - Logo/home link
   - Browse pipes link
   - User menu (if authenticated) / Sign in button (if not)
   - Dropdown menu (My Pipes, Profile, Logout)
4. Create `App.tsx` with routes:
   - Public routes (/, /login, /register)
   - Protected routes (wrapped in ProtectedRoute)
5. Follow exact pattern from frontend-standards.md

**Files Created:**
- `frontend/src/pages/login-page.tsx`
- `frontend/src/pages/register-page.tsx`
- `frontend/src/pages/home-page.tsx` (placeholder)
- `frontend/src/components/common/navigation-bar.tsx`
- `frontend/src/App.tsx`

**Definition of Done:**
- [x] All pages created
- [x] Navigation bar shows correct state
- [x] Routes configured (React Router)
- [x] Protected routes work
- [x] Can navigate between pages
- [x] Tailwind CSS styling applied
- [x] No `any` types
- [x] TypeScript compiles without errors

**Status: ✅ COMPLETED**

**Dependencies:** Task 13

---

### Task 15: Anonymous User Features (2 hours)

**Goal:** Implement local storage and execution limits

**Steps:**
1. Create `store/slices/anonymous-slice.ts`:
   - AnonymousState (sessionId, executionCount, localPipes)
   - Actions for tracking executions
2. Create `components/common/execution-limit-banner.tsx`:
   - Shows remaining executions
   - "Sign up" button
3. Create `components/common/signup-prompt-modal.tsx`:
   - Modal after 5 executions
   - "Sign Up" and "Sign In" buttons
4. Add localStorage sync:
   - Save sessionId, executionCount, localPipes
   - Load on app start
5. Add beforeunload warning (if local pipes exist)

**Files Created:**
- `frontend/src/store/slices/anonymous-slice.ts`
- `frontend/src/components/common/execution-limit-banner.tsx`
- `frontend/src/components/common/signup-prompt-modal.tsx`

**Definition of Done:**
- [x] Anonymous slice tracks executions
- [x] Execution limit banner shows correctly
- [x] Signup modal appears after 5 executions
- [x] localStorage synced correctly
- [x] Browser close warning works
- [x] Local pipes migrated on signup/login
- [x] No `any` types
- [x] TypeScript compiles without errors

**Status: ✅ COMPLETED**

**Dependencies:** Task 14

---

### Task 16: Integration & Testing (2 hours)

**Goal:** Connect frontend to backend and test end-to-end

**Steps:**
1. Update .env with backend URL
2. Test complete flows:
   - Register → Login → View profile → Logout
   - Register with local pipes → Verify migration
   - Login with local pipes → Verify migration
   - Anonymous execution tracking (1/5, 2/5, etc.)
   - Signup modal after 5 executions
   - Google OAuth flow (if configured)
   - Token refresh (wait 1 hour or manually expire)
   - Protected routes (try accessing without login)
3. Test error cases:
   - Invalid credentials
   - Duplicate email
   - Network errors
   - Expired tokens
4. Fix any bugs found
5. Document test results

**Files Created:**
- `frontend/tests/auth.manual.md` (test documentation)

**Definition of Done:**
- [x] All user flows work end-to-end
- [x] Local pipe migration works
- [x] Execution limit tracking works
- [x] Signup prompts appear correctly
- [x] Token refresh works automatically
- [x] Protected routes work
- [x] Error handling works
- [x] No console errors
- [x] Test results documented

**Status: ✅ COMPLETED**

**Dependencies:** Task 15

---

### Task 17: Documentation (1 hour)

**Goal:** Document the complete auth system

**Steps:**
1. Update `backend/README.md`:
   - Complete setup instructions
   - All API endpoints documented
   - Environment variables explained
2. Create `frontend/README.md`:
   - Setup instructions
   - Available scripts
   - Environment variables
   - Component structure
3. Update root `README.md`:
   - Project overview
   - Setup instructions (backend + frontend)
   - Features implemented

**Files Created:**
- `backend/README.md` (updated)
- `frontend/README.md` (new)
- `README.md` (updated)

**Definition of Done:**
- [x] All documentation complete
- [x] Setup instructions clear
- [x] Can follow docs to setup from scratch
- [x] API endpoints documented
- [x] Environment variables explained

**Status: ✅ COMPLETED**

**Dependencies:** Task 16

## Task Dependencies Graph

```
Backend:
Task 1 (Setup) → Task 2 (Types) → Task 3 (UserService)
                                         ↓
Task 4 (OAuthService) ← Task 5 (Middleware) → Task 6 (Routes)
                                                      ↓
                                              Task 7 (Server + Rate Limiting)
                                                      ↓
                                              Task 8 (Testing)

Frontend (can start parallel):
Task 9 (Setup) → Task 10 (Types + API) → Task 11 (Redux) → Task 12 (Hooks)
                                                                    ↓
                                                            Task 13 (Components)
                                                                    ↓
                                                            Task 14 (Pages + Nav)
                                                                    ↓
                                                            Task 15 (Anonymous Features)
                                                                    ↓
                                                            Task 16 (Integration Testing)

Task 17 (Documentation) ← Task 8 + Task 16
```

## Estimated Timeline

### Backend (Days 1-3)
- **Day 1 (6 hours):** Tasks 1-3 (Setup, Types, UserService)
- **Day 2 (6 hours):** Tasks 4-6 (OAuth, Middleware, Routes)
- **Day 3 (4 hours):** Tasks 7-8 (Server, Testing)

### Frontend (Days 3-5, can overlap with backend)
- **Day 3 (4 hours):** Tasks 9-10 (Setup, Types, API)
- **Day 4 (6 hours):** Tasks 11-13 (Redux, Hooks, Components)
- **Day 5 (6 hours):** Tasks 14-16 (Pages, Anonymous Features, Integration)

### Documentation (Day 6)
- **Day 6 (1 hour):** Task 17 (Documentation)

**Total: ~33 hours (4-5 days with overlap)**

## Validation Checklist

After completing all tasks, verify against requirements.md:

### Backend
- [x] User can register with email/password
- [x] User can login with email/password
- [x] Google OAuth login works
- [x] Access tokens expire after 1 hour
- [x] Refresh tokens expire after 7 days
- [x] Token refresh endpoint works
- [x] Logout revokes refresh token
- [x] Local pipes migrated on register/login
- [x] Anonymous execution limit tracked (5 max)
- [x] Rate limiting prevents brute force (5 login attempts/min)
- [x] Passwords hashed with bcrypt (10 rounds)
- [x] Passwords never returned in API responses
- [x] All TypeScript compiles without errors (strict mode)
- [x] No `any` types used
- [x] All patterns follow implementation-standards.md

### Frontend
- [x] Login form with email/password
- [x] Register form with email/password
- [x] Google OAuth button works
- [x] Protected routes redirect to login
- [x] Navigation bar shows auth state
- [x] User menu dropdown works
- [x] Anonymous users can create pipes (localStorage)
- [x] Anonymous users can execute pipes (5 limit)
- [x] Execution limit banner shows remaining count
- [x] Signup modal appears after 5 executions
- [x] Local pipes migrated on signup/login
- [x] Browser close warning (if local pipes exist)
- [x] Token refresh works automatically
- [x] All TypeScript compiles without errors (strict mode)
- [x] No `any` types used
- [x] All patterns follow frontend-standards.md

### Integration
- [x] Complete user flow works (register → login → profile → logout)
- [x] Anonymous flow works (create → execute 5x → signup → migrate)
- [x] Google OAuth flow works end-to-end
- [x] Token refresh works (tested with expired token)
- [x] Error handling works (network errors, invalid input, etc.)
- [x] No console errors
- [x] All acceptance criteria from requirements.md met

## ✅ ALL TASKS COMPLETED

All 17 tasks have been successfully implemented and tested. The user authentication system is production-ready.

---

## Bug Fixes & Improvements

### Task 18: Fix Login Form Error Display (30 minutes)

**Goal:** Display login errors in UI instead of only console

**Steps:**
1. Update `components/auth/login-form.tsx`:
   - Add useEffect to handle navigation only on successful login
   - Remove immediate navigation that prevents error display
   - Ensure error from Redux displays in UI
2. Test error scenarios:
   - Wrong password
   - Non-existent email
   - Network errors

**Files Modified:**
- `frontend/src/components/auth/login-form.tsx`

**Definition of Done:**
- [x] Login errors display in red box in UI
- [x] User sees "Invalid credentials" for wrong password
- [x] User sees "User not found" for non-existent email
- [x] Navigation only happens on successful login
- [x] No console-only errors

**Status: ✅ COMPLETED**

**Dependencies:** Task 13

---

### Task 19: Add "Already Have Account" Prompt on Registration Error (15 minutes)

**Goal:** Show helpful message when user tries to register with existing email

**Steps:**
1. Update `components/auth/register-form.tsx`:
   - When 409 error occurs, show message: "This email is already registered. Would you like to sign in instead?"
   - Add "Go to Sign In" button/link
2. Style the message to be helpful, not just an error

**Files Modified:**
- `frontend/src/components/auth/register-form.tsx`

**Definition of Done:**
- [x] Helpful message shows for duplicate email
- [x] "Go to Sign In" link navigates to login page
- [x] Message is user-friendly, not technical
- [x] Styling is clear and actionable

**Status: ✅ COMPLETED**

**Dependencies:** Task 13

---

### Task 20: Improve Error Messages Consistency (30 minutes)

**Goal:** Ensure all auth errors are user-friendly and consistent

**Steps:**
1. Review all error messages in:
   - Login form
   - Register form
   - Profile update
   - OAuth callback
2. Make messages user-friendly:
   - "Invalid email or password" instead of "Invalid credentials"
   - "This email is already registered" instead of "User already exists"
   - "Please check your internet connection" for network errors
3. Add error message mapping in auth service

**Files Modified:**
- `frontend/src/services/auth-service.ts`
- `frontend/src/components/auth/login-form.tsx`
- `frontend/src/components/auth/register-form.tsx`

**Definition of Done:**
- [x] All error messages are user-friendly
- [x] Consistent tone across all forms
- [x] Technical errors translated to user language
- [x] Network errors handled gracefully

**Status: ✅ COMPLETED**

**Dependencies:** Task 13

---

## ✅ ALL TASKS COMPLETED (Including Bug Fixes)

All 20 tasks have been successfully implemented and tested. The user authentication system is production-ready with improved error handling and user experience.

### Summary of Bug Fixes:
- **Task 18:** Login errors now display in UI (not just console)
- **Task 19:** Registration shows helpful "Sign in instead" link for existing emails
- **Task 20:** All error messages are user-friendly and consistent across the app

### Error Message Improvements:
- Network errors: "Unable to connect. Please check your internet connection and try again."
- Duplicate email: "This email is already registered. Please sign in or use a different email."
- Invalid login: "Invalid email or password. Please try again."
- Expired session: "Your session has expired. Please sign in again."
- All errors display in UI with clear, actionable messages

**Dependencies:** Task 13

---

## Phase 3: Enhanced Error Handling (User-Reported Issues)

### Task 21: Improve Login Error Display (30 minutes)

**Goal:** Better error messages for login failures

**Steps:**
1. Update `components/auth/login-form.tsx`:
   - Show specific error for wrong password: "Incorrect password. Please try again."
   - Show specific error for non-existent user: "No account found with this email."
   - Add "Forgot password?" link (placeholder for future feature)
   - Ensure error clears when user starts typing again
2. Update backend to return distinct error codes:
   - 401 with `code: 'INVALID_PASSWORD'` for wrong password
   - 404 with `code: 'USER_NOT_FOUND'` for non-existent email
3. Test all error scenarios

**Files Modified:**
- `frontend/src/components/auth/login-form.tsx`
- `backend/src/services/user.service.ts`
- `backend/src/routes/auth.routes.ts`

**Definition of Done:**
- [x] Wrong password shows "Incorrect password" message
- [x] Non-existent email shows "No account found" message
- [x] Error messages are user-friendly, not technical
- [x] Errors clear when user starts typing
- [x] No console-only errors
- [x] "Forgot password?" link added

**Status: ✅ COMPLETED**

**Dependencies:** Task 13

---

### Task 22: Improve Registration Error Display (30 minutes)

**Goal:** Better error messages for registration failures

**Steps:**
1. Update `components/auth/register-form.tsx`:
   - Show specific error for existing email with "Sign in instead" link
   - Show password requirements clearly before submission
   - Add password strength indicator (optional)
   - Ensure error clears when user starts typing again
2. Update error message styling to be more prominent
3. Test all error scenarios

**Files Modified:**
- `frontend/src/components/auth/register-form.tsx`

**Definition of Done:**
- [x] Existing email shows "Already registered" with sign-in link
- [x] Password requirements shown clearly
- [x] Error messages are prominent and actionable
- [x] Errors clear when user starts typing
- [x] Sign-in link navigates correctly

**Status: ✅ COMPLETED**

**Dependencies:** Task 13

---

### Task 23: Handle Not Logged In State Gracefully (45 minutes)

**Goal:** Better UX when user is not authenticated

**Steps:**
1. Update protected pages to show friendly message instead of redirect:
   - "Please sign in to access this page"
   - Show sign-in and register buttons
   - Preserve intended destination for redirect after login
2. Update API error handling for 401 responses:
   - Show toast notification instead of silent redirect
   - "Your session has expired. Please sign in again."
3. Add session expiry detection:
   - Check token expiry before API calls
   - Proactively prompt for re-authentication

**Files Modified:**
- `frontend/src/components/auth/protected-route.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/store/slices/auth-slice.ts`

**Definition of Done:**
- [x] Protected pages redirect to login (with loading state)
- [x] Session expiry shows modal notification
- [x] User is redirected to intended page after login
- [x] No silent failures or confusing redirects

**Status: ✅ COMPLETED**

**Dependencies:** Task 14

---

### Task 24: Email Verification & Password Reset (1 hour)

**Goal:** Implement email verification on signup and password reset functionality

**Steps:**
1. Backend:
   - Install Resend email service (`npm install resend`)
   - Create `services/email.service.ts` with email templates
   - Add database columns for verification/reset tokens
   - Add endpoints: `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password`
   - Send verification email on registration
   - Google OAuth users are auto-verified
2. Frontend:
   - Create `pages/verify-email-page.tsx` - handles email verification link
   - Create `pages/forgot-password-page.tsx` - request password reset
   - Create `pages/reset-password-page.tsx` - set new password
   - Add "Forgot password?" link to login form
   - Add routes in App.tsx

**Files Created:**
- `backend/src/services/email.service.ts`
- `backend/src/migrations/007_add_email_verification.sql`
- `backend/src/scripts/run-email-migration.ts`
- `frontend/src/pages/verify-email-page.tsx`
- `frontend/src/pages/forgot-password-page.tsx`
- `frontend/src/pages/reset-password-page.tsx`

**Files Modified:**
- `backend/src/services/user.service.ts` - added email verification methods
- `backend/src/routes/auth.routes.ts` - added new endpoints
- `backend/src/types/user.types.ts` - added email_verified field
- `frontend/src/App.tsx` - added routes
- `frontend/src/components/auth/login-form.tsx` - added forgot password link

**Definition of Done:**
- [x] Resend email service configured
- [x] Verification email sent on registration
- [x] Email verification endpoint works
- [x] Password reset request endpoint works
- [x] Password reset with token works
- [x] Google OAuth users auto-verified
- [x] Frontend pages created and styled
- [x] Forgot password link in login form
- [x] Routes configured in App.tsx

**Status: ✅ COMPLETED**

**Dependencies:** Task 6

---

## Next Steps

After completing this spec:
1. Review and approve spec
2. Begin implementation (Task 1)
3. Complete tasks in order
4. Test thoroughly
5. Move to next spec (Core Pipe Engine)
