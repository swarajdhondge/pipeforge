# Yahoo Pipes 2025 - Backend

Node.js + TypeScript backend API for Yahoo Pipes 2025.

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

The server will start on `http://localhost:3000` (or PORT from .env).

## Environment Variables

See `.env.example` for all required variables.

**Critical variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Strong random secret (min 32 chars)

## API Endpoints

### Authentication

#### POST /api/v1/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "token": "jwt.token.here"
}
```

#### POST /api/v1/auth/login
Login with existing credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "token": "jwt.token.here"
}
```

#### GET /api/v1/auth/me
Get current user profile (requires authentication).

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

#### PUT /api/v1/auth/me
Update current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
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
  "updated_at": "2025-01-01T00:00:00Z"
}
```

## Project Structure

```
backend/
├─ src/
│  ├─ config/           # Configuration (database, redis, env)
│  ├─ routes/           # API routes
│  ├─ services/         # Business logic
│  ├─ middleware/       # Express middleware
│  ├─ models/           # Data models
│  ├─ types/            # TypeScript types
│  ├─ errors/           # Custom error classes
│  ├─ utils/            # Utility functions
│  ├─ migrations/       # Database migrations
│  ├─ scripts/          # Utility scripts
│  └─ server.ts         # Entry point
├─ dist/                # Compiled JavaScript (gitignored)
├─ package.json
├─ tsconfig.json
└─ README.md
```

## Development

### Running Locally

```bash
npm run dev
```

Uses `tsx` for hot reloading during development.

### Building for Production

```bash
npm run build
npm start
```

### Database Migrations

Migrations are in `src/migrations/` directory.

```bash
# Run all pending migrations
npm run migrate
```

### Environment Validation

Before deploying to production, validate your environment configuration:

```bash
# Validate all environment variables and test connections
npm run validate-env
```

This checks:
- All required environment variables are set
- Encryption key is valid (64 hex characters)
- Database connection works
- Redis connection works
- JWT secret is strong enough

### Generate Encryption Key

For Phase 3 secrets management, generate a secure encryption key:

```bash
# Generate 256-bit encryption key
npm run generate-key
```

**IMPORTANT:** Store the generated key securely and add it to your `.env` file as `SECRETS_ENCRYPTION_KEY`.

## Testing

### Manual Testing with curl

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (replace TOKEN)
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"

# Update profile (replace TOKEN)
curl -X PUT http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","bio":"Data enthusiast"}'
```

## Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Image Storage (Avatars)

Profile pictures are stored locally on disk in the `uploads/avatars` folder.

### Configuration (.env)
```env
STORAGE_PROVIDER=disk
STORAGE_DISK_ROOT=./uploads
STORAGE_DISK_AVATAR_PATH=./uploads/avatars
STORAGE_PUBLIC_BASE_URL=http://localhost:3000/uploads
MAX_AVATAR_SIZE_BYTES=2097152
```

The `uploads` folder is automatically created when you upload your first image. Images are served at `http://localhost:3000/uploads/avatars/...`

### For Production
When deploying to production, update `STORAGE_PUBLIC_BASE_URL` to your domain:
```env
STORAGE_PUBLIC_BASE_URL=https://yourdomain.com/uploads
```

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 1 hour
- Rate limiting on auth endpoints
- Input validation on all endpoints
- CORS configured for allowed origins
- SQL injection prevention (parameterized queries)

## Common Issues

### Database connection fails
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

### Redis connection fails
- Check Redis is running
- Verify REDIS_URL in .env

### JWT token invalid
- Check JWT_SECRET matches between requests
- Token may have expired (1 hour)

### Rate limiting triggers
- Wait 1 minute and try again
- Check RATE_LIMIT_* settings in .env

## Next Steps

After completing user authentication:
1. Implement core pipe engine
2. Add operator system
3. Build execution engine
4. Add public marketplace
5. Implement scheduling

See `specs/` directory for detailed specifications.
