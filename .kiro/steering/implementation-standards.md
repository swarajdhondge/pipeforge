---
inclusion: always
---

# Implementation Standards

## Purpose

Concrete implementation details that AI must follow. Not architecture (that's in architecture-principles.md), but the specific "how" for code.

## Database Standards

### Connection & Queries

```typescript
// ✅ ALWAYS: Use pg Pool with parameterized queries
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // connection pool size
});

// ✅ ALWAYS: Parameterized queries (prevents SQL injection)
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ NEVER: String concatenation
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'` // SQL injection risk!
);
```

### Schema Conventions

```sql
-- ✅ ALWAYS: Use these exact patterns

-- Primary keys: UUID with gen_random_uuid()
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- Timestamps: Always include both
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()

-- Foreign keys: Always {table}_id
user_id UUID REFERENCES users(id)
pipe_id UUID REFERENCES pipes(id)

-- Indexes: Always idx_{table}_{column}
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_pipes_user_id ON pipes(user_id);
CREATE INDEX idx_pipes_is_public ON pipes(is_public);
CREATE INDEX idx_executions_pipe_id ON executions(pipe_id);
CREATE INDEX idx_executions_user_id ON executions(user_id);

-- Enums: Use VARCHAR with CHECK constraint
status VARCHAR(20) CHECK (status IN ('draft', 'active', 'archived'))
visibility VARCHAR(10) CHECK (visibility IN ('public', 'private'))
execution_status VARCHAR(20) CHECK (execution_status IN ('pending', 'running', 'completed', 'failed'))

-- JSONB for flexible data structures
definition JSONB NOT NULL  -- Pipe definition (nodes, edges)
result JSONB               -- Execution result
config JSONB               -- Operator configuration

-- Arrays for tags
tags TEXT[]                -- Pipe tags for discovery
```

### Migrations

```sql
-- ✅ ALWAYS: Include both up and down migrations

-- migrations/001_create_users.sql (up)
CREATE TABLE users (...);

-- migrations/001_create_users.down.sql (down)
DROP TABLE IF EXISTS users;
```

## API Standards

### Endpoint Structure

```typescript
// ✅ ALWAYS: Follow this exact pattern

router.post('/endpoint', async (req, res) => {
  try {
    // 1. Validate input (ALWAYS first)
    const validatedData = validateInput(req.body);
    
    // 2. Extract user from token (if protected route)
    const userId = req.user?.userId;
    
    // 3. Call service (business logic)
    const result = await service.method(userId, validatedData);
    
    // 4. Return success response
    return res.status(200).json(result);
    
  } catch (error) {
    // 5. Handle errors (specific types first)
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({ error: error.message });
    }
    
    // 6. Log unexpected errors
    logger.error('Unexpected error', { error, path: req.path });
    
    // 7. Return generic error
    return res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Response Format

```typescript
// ✅ ALWAYS: Consistent response format

// Success (200, 201)
{
  "id": "uuid",
  "name": "value",
  "created_at": "2025-01-01T00:00:00Z"
}

// Error (400, 401, 404, 500)
{
  "error": "Clear error message"
}

// List (200)
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### Status Codes

```typescript
// ✅ ALWAYS: Use correct status codes

200 // OK - successful GET, PUT
201 // Created - successful POST
204 // No Content - successful DELETE
400 // Bad Request - validation error
401 // Unauthorized - missing/invalid token
403 // Forbidden - valid token, insufficient permissions
404 // Not Found - resource doesn't exist
409 // Conflict - duplicate resource (e.g., email exists)
429 // Too Many Requests - rate limited
500 // Internal Server Error - unexpected error
```

## Service Layer Standards

### Service Class Pattern

```typescript
// ✅ ALWAYS: Follow this exact pattern

export interface IMyService {
  method(param: Type): Promise<ReturnType>;
}

export class MyService implements IMyService {
  constructor(
    private db: Pool,
    private logger: Logger
  ) {}
  
  async method(param: Type): Promise<ReturnType> {
    // 1. Validate input
    if (!param) {
      throw new ValidationError('Param is required');
    }
    
    // 2. Business logic
    const result = await this.db.query(...);
    
    // 3. Transform and return
    return this.transformResult(result);
  }
  
  private transformResult(data: any): ReturnType {
    // Helper methods are private
    return { ... };
  }
}
```

### Error Handling in Services

```typescript
// ✅ ALWAYS: Throw specific error types

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// In service
if (!user) {
  throw new NotFoundError('User', userId);
}

// ❌ NEVER: Generic errors or swallowing
try {
  await something();
} catch (error) {
  // Don't swallow!
}
```

## Validation Standards

### Input Validation Pattern

```typescript
// ✅ ALWAYS: Validate at API boundary

import validator from 'validator';

function validateRegisterInput(data: unknown): RegisterInput {
  // 1. Check data exists and is object
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid input');
  }
  
  const { email, password } = data as any;
  
  // 2. Check required fields
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }
  
  // 3. Validate types
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ValidationError('Email and password must be strings');
  }
  
  // 4. Validate format
  if (!validator.isEmail(email)) {
    throw new ValidationError('Invalid email format');
  }
  
  // 5. Validate constraints
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }
  
  if (password.length > 100) {
    throw new ValidationError('Password must be less than 100 characters');
  }
  
  // 6. Sanitize (if needed)
  const sanitizedEmail = validator.normalizeEmail(email) || email;
  
  // 7. Return typed object
  return {
    email: sanitizedEmail,
    password: password,
  };
}
```

## Security Standards

### Password Handling

```typescript
// ✅ ALWAYS: Use bcrypt with 10 rounds

import bcrypt from 'bcrypt';

// Hash password
const passwordHash = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, user.password_hash);

// ❌ NEVER: Store plain text passwords
// ❌ NEVER: Return password_hash in API responses
// ❌ NEVER: Log passwords
```

### JWT Handling

```typescript
// ✅ ALWAYS: Follow this pattern

import jwt from 'jsonwebtoken';

// Generate token
const token = jwt.sign(
  { userId: user.id, email: user.email }, // minimal payload
  process.env.JWT_SECRET!,
  { expiresIn: '1h' } // short expiry
);

// Verify token (in middleware)
const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

// ❌ NEVER: Include sensitive data in JWT (passwords, secrets)
// ❌ NEVER: Use long expiry (> 24 hours)
```

### Secrets Management (Phase 3 - COMPLETED)

```typescript
// ✅ ALWAYS: Encrypt secrets at rest using AES-256-GCM

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.SECRETS_ENCRYPTION_KEY!, 'hex');

function encryptSecret(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptSecret(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// ❌ NEVER: Store secrets in plain text
// ❌ NEVER: Return decrypted secrets in API responses
// ❌ NEVER: Log secrets (only log secret IDs)
```

### Secret References in Operators (Phase 3 - COMPLETED)

```typescript
// ✅ ALWAYS: Use secret references, never store actual values in pipe definitions

// Fetch operator config with secret reference
interface FetchConfig {
  url: string;
  headers?: Record<string, string>;
  secretRef?: {
    secretId: string;      // Reference to encrypted secret
    headerName: string;    // e.g., "Authorization", "X-API-Key"
    headerFormat?: string; // e.g., "Bearer {value}", "ApiKey {value}"
  };
}

// ✅ ALWAYS: Validate secrets before execution
async function validateSecrets(definition: PipeDefinition, userId: string): Promise<void> {
  const secretRefs = extractSecretRefs(definition);
  for (const ref of secretRefs) {
    const isValid = await secretsService.validate(ref.secretId, userId);
    if (!isValid) {
      throw new SecretNotFoundError(ref.secretId);
    }
  }
}

// ✅ ALWAYS: Remove secret references when forking pipes
function removeSecretRefs(definition: PipeDefinition): PipeDefinition {
  return {
    ...definition,
    nodes: definition.nodes.map(node => {
      if (node.type === 'fetch' && node.data.config?.secretRef) {
        const { secretRef, ...configWithoutSecret } = node.data.config;
        return { ...node, data: { ...node.data, config: configWithoutSecret } };
      }
      return node;
    })
  };
}

// ❌ NEVER: Store actual secret values in pipe definitions
// ❌ NEVER: Allow forked pipes to retain original owner's secrets
```

### Domain Whitelist (Phase 3 - COMPLETED)

```typescript
// ✅ ALWAYS: Validate URLs against domain whitelist

// Load from environment variable
const DOMAIN_WHITELIST = process.env.DOMAIN_WHITELIST?.split(',') || [
  'api.github.com',
  'jsonplaceholder.typicode.com',
  'api.openweathermap.org'
];

function isAllowedDomain(url: string): boolean {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  
  // Always block localhost and private IPs
  if (isLocalhost(hostname) || isPrivateIP(hostname)) {
    return false;
  }
  
  // Check whitelist
  return DOMAIN_WHITELIST.some(domain => 
    hostname === domain || hostname.endsWith('.' + domain)
  );
}

// ❌ NEVER: Allow localhost or private IP access
// ❌ NEVER: Skip domain validation in Fetch operator
```

### Email Service (Phase 4 - COMPLETED)

```typescript
// ✅ ALWAYS: Use SendGrid for transactional emails

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Email types supported:
// - Verification email (24 hour expiry)
// - Password reset email (1 hour expiry)
// - Welcome email (after verification)

async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  await sgMail.send({
    to: email,
    from: process.env.FROM_EMAIL!, // e.g., noreply@pipeforge.nooqo.dev
    subject: 'Verify your email - PipeForge',
    html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
  });
}

// ✅ ALWAYS: Validate email domains for common typos
const EMAIL_TYPO_MAP: Record<string, string> = {
  // Gmail typos
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  // Hotmail typos
  'hotmai.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  // Outlook typos
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  // iCloud typos
  'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com',
};

function detectEmailTypo(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  return EMAIL_TYPO_MAP[domain] || null;
}

// ✅ ALWAYS: Clean up unverified accounts after 48 hours
// Run via: npm run cleanup:unverified

// ❌ NEVER: Send emails without proper domain verification
// ❌ NEVER: Store email tokens without expiry
// ❌ NEVER: Allow unverified accounts indefinitely
```

## TypeScript Standards

### Type Definitions

```typescript
// ✅ ALWAYS: Define explicit types

// Interfaces for data structures
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: Date;
}

// Separate interface for DB row (includes sensitive fields)
export interface UserRow extends User {
  password_hash: string;
}

// Request/Response types
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ❌ NEVER: Use `any`
function doSomething(data: any): any { } // NO!

// ✅ ALWAYS: Use proper types
function doSomething(data: RegisterRequest): AuthResponse { }
```

### Async/Await

```typescript
// ✅ ALWAYS: Use async/await (not callbacks or .then())

async function getUser(userId: string): Promise<User> {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0];
}

// ❌ NEVER: Callbacks
function getUser(userId: string, callback: (user: User) => void) { }

// ❌ NEVER: .then() chains
function getUser(userId: string) {
  return db.query(...).then(result => result.rows[0]);
}
```

## Logging Standards

```typescript
// ✅ ALWAYS: Structured logging

import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

// Log with context
logger.info('User registered', { userId: user.id, email: user.email });
logger.error('Database error', { error: error.message, query: 'SELECT...' });

// ❌ NEVER: console.log in production code
console.log('User registered'); // NO!

// ❌ NEVER: Log sensitive data
logger.info('User logged in', { password: password }); // NO!
```

## Environment Variables

```typescript
// ✅ ALWAYS: Validate env vars on startup

interface Config {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  nodeEnv: 'development' | 'production';
}

function loadConfig(): Config {
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
  ];
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    databaseUrl: process.env.DATABASE_URL!,
    redisUrl: process.env.REDIS_URL!,
    jwtSecret: process.env.JWT_SECRET!,
    nodeEnv: (process.env.NODE_ENV as any) || 'development',
  };
}

// Load once at startup
export const config = loadConfig();

// ❌ NEVER: Access process.env directly in code
const secret = process.env.JWT_SECRET; // NO! Use config.jwtSecret
```

## File Organization

```
src/
├─ config/
│  ├─ database.ts      // Pool setup
│  ├─ redis.ts         // Redis client
│  └─ env.ts           // Environment validation
├─ routes/
│  ├─ auth.routes.ts   // Auth endpoints
│  ├─ pipes.routes.ts  // Pipe endpoints
│  ├─ executions.routes.ts // Execution endpoints
│  └─ secrets.routes.ts    // Secrets endpoints (Phase 3)
├─ services/
│  ├─ user.service.ts  // User business logic
│  ├─ pipe.service.ts  // Pipe business logic
│  ├─ execution.service.ts // Execution orchestration
│  ├─ secrets.service.ts   // Secrets CRUD & encryption (Phase 3)
│  └─ email.service.ts     // Email sending via SendGrid (Phase 4)
├─ operators/
│  ├─ operator-registry.ts // Plugin management
│  ├─ base-operator.ts     // IOperator interface
│  ├─ fetch-operator.ts    // Fetch operator (with secret support)
│  ├─ filter-operator.ts   // Filter operator
│  ├─ sort-operator.ts     // Sort operator
│  └─ transform-operator.ts // Transform operator
├─ middleware/
│  ├─ auth.middleware.ts      // JWT verification
│  ├─ error.middleware.ts     // Global error handler
│  └─ rate-limit.middleware.ts // Rate limiting
├─ types/
│  ├─ user.types.ts    // User interfaces
│  ├─ pipe.types.ts    // Pipe interfaces
│  ├─ operator.types.ts // Operator interfaces
│  └─ secrets.types.ts  // Secrets interfaces (Phase 3)
├─ errors/
│  ├─ index.ts         // Custom error classes
│  ├─ auth.errors.ts   // Auth-specific errors
│  └─ secrets.errors.ts // Secrets-specific errors (Phase 3)
├─ utils/
│  ├─ logger.ts        // Winston logger
│  ├─ encryption.ts    // AES-256-GCM encryption (Phase 3)
│  └─ domain-whitelist.ts // Domain validation (Phase 3)
└─ server.ts           // Entry point
```

## Testing Standards

```typescript
// ✅ ALWAYS: Test happy path and errors

describe('UserService.register', () => {
  it('should register a new user', async () => {
    const user = await userService.register('test@example.com', 'password123');
    
    expect(user.email).toBe('test@example.com');
    expect(user.id).toBeDefined();
    expect(user).not.toHaveProperty('password_hash'); // Never returned
  });
  
  it('should throw error for duplicate email', async () => {
    await userService.register('test@example.com', 'password123');
    
    await expect(
      userService.register('test@example.com', 'password123')
    ).rejects.toThrow(UserAlreadyExistsError);
  });
  
  it('should throw error for invalid email', async () => {
    await expect(
      userService.register('invalid-email', 'password123')
    ).rejects.toThrow(ValidationError);
  });
});
```

## Performance Standards

### Database

```typescript
// ✅ ALWAYS: Use indexes for queries
CREATE INDEX idx_pipes_user_id ON pipes(user_id);

// ✅ ALWAYS: Limit results
SELECT * FROM pipes WHERE user_id = $1 LIMIT 20 OFFSET 0;

// ✅ ALWAYS: Use connection pooling (already configured)

// ❌ NEVER: SELECT * in production (specify columns)
SELECT id, name, created_at FROM pipes WHERE user_id = $1;
```

### Caching

```typescript
// ✅ ALWAYS: Cache frequently accessed data

import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });

// Cache pipe definition
await redis.setEx(
  `pipe:${pipeId}`,
  3600, // 1 hour TTL
  JSON.stringify(pipe)
);

// Get from cache
const cached = await redis.get(`pipe:${pipeId}`);
if (cached) {
  return JSON.parse(cached);
}
```

## What AI Should NOT Decide

These are already decided. AI must follow exactly:

- ✅ Database: PostgreSQL with pg Pool
- ✅ Queries: Parameterized only
- ✅ Primary keys: UUID with gen_random_uuid()
- ✅ Timestamps: created_at, updated_at
- ✅ Password hashing: bcrypt with 10 rounds
- ✅ JWT expiry: 1 hour
- ✅ Secrets encryption: AES-256-GCM (Phase 3)
- ✅ Secret references: Store IDs only, never values (Phase 3)
- ✅ Domain whitelist: Configurable via env var (Phase 3)
- ✅ Logging: Winston with JSON format
- ✅ Security audit logging: All secret operations (Phase 3)
- ✅ Error handling: Specific error types
- ✅ Validation: At API boundary
- ✅ Response format: Consistent JSON
- ✅ Status codes: Standard HTTP codes
- ✅ File organization: As specified above

## Summary

**AI has freedom in:**
- Business logic implementation details
- Helper function names (following conventions)
- Internal algorithms (as long as they work)

**AI has NO freedom in:**
- Database patterns (use exactly as shown)
- API patterns (use exactly as shown)
- Security patterns (use exactly as shown)
- Validation patterns (use exactly as shown)
- Error handling patterns (use exactly as shown)
- File organization (use exactly as shown)

**When in doubt, follow the patterns in this document exactly.**
