# User Authentication & Management - Requirements

## Problem Statement

Users need to authenticate to:
- **Create and own pipes** (edit, delete their own pipes)
- **Save pipes** (can view public pipes without account, but need account to save)
- **Execute pipes** (run pipes on their behalf)
- **Store secrets** (API keys for operators)
- **Mark pipes as public/private**

**Key Insight:** Like GitHub - anyone can view public repos, but you need an account to create/fork.

## Target Users

- Developers building data workflows
- Data analysts creating data mashups
- Content creators aggregating feeds
- Anyone who used original Yahoo Pipes

## User Flows

### Anonymous User (No Account) - "Try Before Signup"
- ✅ Browse public pipes
- ✅ View pipe details
- ✅ **Create pipes** (stored in browser localStorage)
- ✅ **Execute pipes** (up to 5 executions)
- ✅ Fork public pipes (stored locally)
- ❌ Cannot save pipes permanently (lost on browser clear)
- ❌ Cannot mark pipes as public/private
- ❌ Cannot store secrets (API keys)
- **Prompts:**
  - After 5 executions: "Sign up to continue using pipes"
  - When trying to save: "Sign up to save your pipes permanently"
  - When clearing browser: Warning that pipes will be lost

### Authenticated User (Has Account)
- ✅ Everything anonymous users can do
- ✅ **Permanent storage** (pipes saved to database)
- ✅ **Unlimited executions**
- ✅ Save/edit their own pipes
- ✅ Mark pipes as public/private
- ✅ Store secrets (API keys)
- ✅ Access pipes from any device
- ✅ Execution history

## Acceptance Criteria

### Authentication Methods (MVP)
- [x] Email + Password login (primary method)
- [x] Google OAuth login (social login)
- [x] Session persists across page refreshes
- [x] "Remember me" keeps user logged in for 7 days
- [x] User can logout

### User Registration (Email/Password)
- [x] User can register with email and password
- [x] Email must be unique and valid format
- [x] Password must be at least 8 characters
- [x] Password is hashed before storage (bcrypt, 10+ rounds)
- [x] Returns JWT token on successful registration
- [x] User is automatically logged in after registration
- [x] **After registration, migrate local pipes to account**
  - Check localStorage for pipes
  - Save them to database
  - Clear localStorage
  - Show success message: "Your pipes have been saved!"

### User Login (Email/Password)
- [x] User can login with email and password
- [x] Returns JWT token on successful login
- [x] JWT token expires after 1 hour (access token)
- [x] Refresh token expires after 7 days (if "remember me")
- [x] Invalid credentials show clear error message
- [x] Rate limited to 5 attempts per minute per IP

### User Login (Google OAuth)
- [x] "Sign in with Google" button
- [x] OAuth flow redirects to Google
- [x] User authorizes app
- [x] Returns to app with user info
- [x] Creates account if first time (using Google email)
- [x] Returns JWT token
- [x] User is logged in
- [x] **After login, migrate local pipes to account** (same as email registration)

### Session Management
- [x] JWT token stored in localStorage (for MVP, httpOnly cookies in production)
- [x] Token automatically sent with API requests
- [x] Token refreshed before expiry (if user active)
- [x] Expired token triggers re-login
- [x] Logout clears token and redirects to home

### Anonymous User Limits
- [x] Can create pipes (stored in localStorage)
- [x] Can execute pipes up to 5 times (tracked in localStorage)
- [x] After 5 executions, show signup prompt
- [x] Can fork public pipes (stored locally)
- [x] Warning when pipes are only stored locally
- [x] "Sign up to save permanently" button visible

### Protected Actions (Require Authentication)
- [x] Permanent pipe storage (save to database)
- [x] Unlimited executions
- [x] Mark pipes as public/private
- [x] Store secrets (API keys)
- [x] Access pipes from multiple devices
- [x] View execution history
- [x] Viewing public pipes does NOT require authentication

### User Profile
- [x] User can view their profile (id, email, name, created_at)
- [x] User can update their profile (name, bio, avatar URL)
- [x] User cannot change email (for MVP)
- [x] User cannot change password (for MVP - add in Phase 7)
- [x] Google OAuth users have email from Google

### Error Handling
- [x] Clear error messages for all failure cases
- [x] "Email already exists" (registration)
- [x] "Invalid email or password" (login)
- [x] "Session expired, please login again" (expired token)
- [x] "Please sign in to create pipes" (unauthenticated action)
- [x] "Too many login attempts, try again later" (rate limited)
- [x] Network errors handled gracefully

### UI/UX Requirements

#### Login/Register Page
- [x] Clean, simple form (email + password)
- [x] "Sign in with Google" button (prominent)
- [x] Toggle between "Login" and "Register"
- [x] "Remember me" checkbox
- [x] Clear error messages inline
- [x] Loading states during authentication
- [x] Redirect to previous page after login

#### Navigation Bar (Unauthenticated)
- [x] "Sign In" button (top right)
- [x] "Browse Pipes" link
- [x] Logo/Home link

#### Navigation Bar (Authenticated)
- [x] User avatar/name (top right)
- [x] Dropdown menu:
  - My Pipes
  - Create New Pipe
  - Profile
  - Logout
- [x] "Browse Pipes" link
- [x] Logo/Home link

#### Anonymous User Prompts
- [x] When creating pipe (unauthenticated):
  - Info banner: "Your pipe is saved locally. Sign up to save permanently."
  - "Sign Up" button in banner
- [x] After 5 executions:
  - Modal: "You've used your 5 free executions. Sign up to continue!"
  - "Sign Up" and "Sign In" buttons
  - Cannot execute until signed up
- [x] When trying to save permanently:
  - Modal: "Sign up to save your pipes permanently"
  - "Sign Up" and "Sign In" buttons
- [x] Warning before browser close (if pipes exist locally):
  - "You have unsaved pipes. Sign up to save them permanently."

### Security
- [x] Passwords never returned in API responses
- [x] JWT secret stored in environment variable
- [x] Tokens stored in localStorage (for MVP, httpOnly cookies in production)
- [x] All auth endpoints use HTTPS in production
- [x] Rate limiting on login endpoint
- [x] Input validation on all fields
- [x] Google OAuth uses secure flow (state parameter)
- [x] CSRF protection for cookie-based auth

## What We're NOT Building (MVP)

- ❌ Email verification (can add later)
- ❌ Password reset (can add later)
- ❌ Two-factor authentication (can add later)
- ❌ Other OAuth providers (GitHub, Twitter) (can add later)
- ❌ Account deletion (can add later)
- ❌ Password change (can add later)

## What We ARE Building (MVP)

✅ **Email/Password Authentication**
- Simple, works everywhere
- No external dependencies
- Full control over flow

✅ **Google OAuth**
- Reduces friction (no password to remember)
- Trusted by users
- Fast signup/login

✅ **Session Persistence**
- JWT tokens in httpOnly cookies
- Refresh tokens for "remember me"
- Automatic token refresh

✅ **Public Viewing Without Account**
- Like GitHub - browse without signing in
- Reduces barrier to entry
- Sign in only when needed (create/save)

## Why This Feature?

**Ties to Yahoo Pipes Resurrection:**
- Yahoo Pipes had user accounts
- Users owned their pipes
- Public/private sharing required authentication
- This is foundational - can't build pipes without users

**Why email/password + Google OAuth?**
- Email/password: Simple, no external dependencies, works for everyone
- Google OAuth: Reduces friction, most users have Google accounts
- Two methods cover 95% of users
- Can add more OAuth providers later if needed

**Why "try before signup" approach?**
- Like Figma/Canva - let users create without friction
- Users can experiment before committing
- Increases conversion (they've already invested time)
- Sign up only when they want to save permanently or after 5 executions
- Reduces barrier to entry significantly

**Why 5 executions limit?**
- Enough to try the product (not too restrictive)
- Creates urgency to sign up (not too generous)
- Prevents abuse (can't use forever without account)
- Industry standard (many products use similar limits)

**Why JWT + httpOnly cookies?**
- JWT: Stateless, scales horizontally
- httpOnly cookies: Secure (not accessible via JavaScript, prevents XSS)
- Refresh tokens: Better UX ("remember me" without long-lived access tokens)

**Why not simpler?**
- Could skip auth entirely → No ownership, no privacy, no security
- Could skip Google OAuth → Higher friction for new users
- Could skip public viewing → Lower discoverability, fewer users

## Success Metrics

- User can register in < 30 seconds
- Login response time < 200ms
- Google OAuth flow < 5 seconds
- Zero password leaks (hashed storage)
- Rate limiting prevents brute force attacks
- Session persists across page refreshes
- Clear error messages for all failure cases

## Dependencies

### Backend
- PostgreSQL database
- bcrypt library (password hashing)
- jsonwebtoken library (JWT tokens)
- passport.js (OAuth handling)
- passport-google-oauth20 (Google OAuth strategy)
- Express middleware for auth

### Frontend
- React Router (navigation, protected routes)
- Axios or Fetch (API calls)
- Context API or Redux (auth state management)
- Google OAuth client library

## Risks & Mitigations

**Risk:** Password storage vulnerability
**Mitigation:** Use bcrypt with 10+ rounds, never log passwords, never return password_hash

**Risk:** JWT token theft (XSS attack)
**Mitigation:** httpOnly cookies (not accessible via JavaScript), short expiry (1 hour), HTTPS only

**Risk:** CSRF attacks (cookie-based auth)
**Mitigation:** CSRF tokens, SameSite cookie attribute, verify origin header

**Risk:** Brute force attacks
**Mitigation:** Rate limiting on login endpoint (5 attempts/minute), account lockout after 10 failed attempts

**Risk:** Google OAuth misconfiguration
**Mitigation:** Use official passport-google-oauth20 library, validate state parameter, verify tokens

**Risk:** Session hijacking
**Mitigation:** Short-lived access tokens, refresh token rotation, logout invalidates tokens

**Risk:** Poor error messages leak information
**Mitigation:** Generic messages ("Invalid email or password" not "Email not found"), log details server-side only

## Timeline

### Backend (2 days)
- Database schema: 1 hour
- Email/password registration: 2 hours
- Email/password login: 1 hour
- Google OAuth setup: 2 hours
- JWT + refresh token logic: 2 hours
- Auth middleware: 1 hour
- Profile endpoints: 1 hour
- Rate limiting: 1 hour
- Testing: 3 hours

### Frontend (2 days)
- Login/Register UI: 3 hours
- Google OAuth button: 2 hours
- Auth state management: 2 hours
- Protected routes: 1 hour
- Navigation bar (auth states): 2 hours
- Protected action prompts: 2 hours
- Error handling: 2 hours
- Testing: 2 hours

**Total: ~4 days (32 hours)**

## Open Questions

1. **Avatar images:** Allow users to upload avatars or just use Gravatar/Google profile pic?
   - **Decision:** Use Google profile pic for OAuth users, Gravatar for email users (no upload for MVP)

2. **Account linking:** If user signs up with email, then later uses Google with same email, link accounts?
   - **Decision:** Yes, link accounts if email matches (ask user to confirm)

3. **Session duration:** 1 hour access token + 7 day refresh token good balance?
   - **Decision:** Yes, standard practice

4. **Rate limiting scope:** Per IP or per email?
   - **Decision:** Per IP (prevents enumeration attacks)

5. **Public pipe execution:** Can anonymous users execute public pipes?
   - **Decision:** No, execution requires account (prevents abuse, tracks usage)


## Test Cases

### Backend API Tests (15 test cases)

**TC1: User Registration (Email/Password)**
- Input: Valid email and password
- Expected: 201, user created, tokens returned
- Verify: Password hashed in DB, no password in response

**TC2: Duplicate Email Registration**
- Input: Existing email
- Expected: 409, error message
- Verify: No duplicate user created

**TC3: Invalid Email Format**
- Input: Invalid email
- Expected: 400, validation error

**TC4: Password Too Short**
- Input: Password < 8 characters
- Expected: 400, validation error

**TC5: User Login (Correct Credentials)**
- Input: Valid email and password
- Expected: 200, user data, tokens returned

**TC6: User Login (Wrong Password)**
- Input: Valid email, wrong password
- Expected: 401, generic error message

**TC7: Rate Limiting (Login)**
- Input: 6 rapid login attempts
- Expected: First 5 return 401, 6th returns 429

**TC8: Get Profile (Valid Token)**
- Input: Valid access token
- Expected: 200, user profile, no password_hash

**TC9: Get Profile (Invalid Token)**
- Input: Invalid token
- Expected: 401, error message

**TC10: Update Profile**
- Input: Valid token, name and bio
- Expected: 200, updated profile

**TC11: Token Refresh**
- Input: Valid refresh token
- Expected: 200, new tokens, old token deleted

**TC12: Logout**
- Input: Valid tokens
- Expected: 200, refresh token deleted from DB

**TC13: Google OAuth Flow**
- Input: Google authorization code
- Expected: Redirect with tokens, user created/logged in

**TC14: Local Pipe Migration**
- Input: Registration with localPipes array
- Expected: 201, migratedPipes count returned

**TC15: Anonymous Execution Limit Check**
- Input: Session ID
- Expected: 200, execution count and remaining

### Frontend UI Tests (10 test cases)

**TC16: Login Form Validation**
- Input: Empty fields
- Expected: Validation errors shown, form not submitted

**TC17: Register Form Password Mismatch**
- Input: Different passwords
- Expected: Validation error shown

**TC18: Protected Route Redirect**
- Input: Access /editor without login
- Expected: Redirect to /login

**TC19: Navigation Bar State**
- Input: Login/logout
- Expected: Nav bar updates correctly

**TC20: Execution Limit Banner**
- Input: Anonymous user with 3 executions
- Expected: Banner shows "2 remaining"

**TC21: Signup Modal After 5 Executions**
- Input: 5th execution by anonymous user
- Expected: Modal appears, cannot execute

**TC22: Local Pipe Migration (Frontend)**
- Input: Register with local pipes
- Expected: localStorage cleared after signup

**TC23: Token Refresh (Frontend)**
- Input: Expired access token
- Expected: Automatic refresh, request retried

**TC24: OAuth Callback**
- Input: Redirect from Google with tokens
- Expected: Tokens stored, user logged in

**TC25: Logout Clears State**
- Input: Click logout
- Expected: Tokens cleared, localStorage cleared

**Total: 25 test cases**
