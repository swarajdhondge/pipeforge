# Design Document

## Overview

This document outlines the design for implementing essential security features in Yahoo Pipes 2025, specifically secrets management, enhanced domain whitelisting, and security auditing. The design ensures **zero breaking changes** to the existing MVP while adding critical security capabilities that enable users to safely use authenticated APIs.

### Design Goals

1. **Backward Compatibility**: All existing pipes and functionality continue to work unchanged
2. **Additive Architecture**: New features are additions, not modifications to existing code
3. **Security First**: Encrypted storage, secure references, comprehensive auditing
4. **Developer Experience**: Clear APIs, good error messages, easy integration
5. **Performance**: Minimal overhead, efficient caching, optimized queries

### Key Principles

- **Zero Breaking Changes**: Existing pipes execute identically
- **Optional Features**: Secrets are opt-in, not required
- **Fail Secure**: Security failures result in clear errors, not silent failures
- **Audit Everything**: All security events are logged
- **Minimal Complexity**: Simple implementation, no over-engineering

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Secrets      │  │ Pipe Editor  │  │ Execution    │      │
│  │ Management   │  │ (Enhanced)   │  │ Panel        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Express)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /secrets     │  │ /pipes       │  │ /executions  │      │
│  │ (NEW)        │  │ (UNCHANGED)  │  │ (ENHANCED)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ SecretsService│ │ PipeService  │  │ Execution    │      │
│  │ (NEW)        │  │ (UNCHANGED)  │  │ Service      │      │
│  └──────────────┘  └──────────────┘  │ (ENHANCED)   │      │
│                                       └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Operator Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ FetchOperator│  │ FilterOp     │  │ SortOp       │      │
│  │ (ENHANCED)   │  │ (UNCHANGED)  │  │ (UNCHANGED)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ secrets      │  │ pipes        │  │ executions   │      │
│  │ (NEW TABLE)  │  │ (UNCHANGED)  │  │ (UNCHANGED)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                    PostgreSQL                                │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

**NEW Components:**
- `backend/src/services/secrets.service.ts` - Secrets CRUD and encryption
- `backend/src/routes/secrets.routes.ts` - Secrets API endpoints
- `backend/src/utils/encryption.ts` - AES-256-GCM encryption utilities
- `backend/src/utils/domain-whitelist.ts` - Domain validation
- `backend/src/migrations/008_create_secrets.sql` - Secrets table
- `frontend/src/services/secretsService.ts` - Secrets API client
- `frontend/src/components/secrets/` - Secrets management UI
- `frontend/src/store/slices/secretsSlice.ts` - Secrets state

**ENHANCED Components:**
- `backend/src/operators/fetch-operator.ts` - Add secret resolution
- `backend/src/services/execution.service.ts` - Add pre-execution secret validation
- `frontend/src/components/editor/OperatorConfig.tsx` - Add secret selector

**UNCHANGED Components:**
- All existing services, routes, operators (except Fetch)
- All database tables (except new secrets table)
- All frontend pages and core components
- Execution engine core logic
- Authentication and authorization


## Components and Interfaces

### 1. Secrets Service (NEW)

**File**: `backend/src/services/secrets.service.ts`

**Purpose**: Manage encrypted secrets for users

**Interface**:
```typescript
export interface Secret {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  encrypted_value: string;  // AES-256-GCM encrypted
  created_at: Date;
  updated_at: Date;
}

export interface CreateSecretInput {
  name: string;
  description?: string;
  value: string;  // Plain text, will be encrypted
}

export interface SecretMetadata {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  // Note: encrypted_value is NOT included
}

export class SecretsService {
  constructor(private db: Pool);
  
  // Create a new secret (encrypts value)
  async create(userId: string, input: CreateSecretInput): Promise<SecretMetadata>;
  
  // Get secret metadata (without decrypted value)
  async get(secretId: string, userId: string): Promise<SecretMetadata | null>;
  
  // List user's secrets (metadata only)
  async list(userId: string): Promise<SecretMetadata[]>;
  
  // Update secret (re-encrypts if value changed)
  async update(secretId: string, userId: string, input: Partial<CreateSecretInput>): Promise<SecretMetadata>;
  
  // Delete secret
  async delete(secretId: string, userId: string): Promise<void>;
  
  // Decrypt secret for execution (internal use only)
  async decrypt(secretId: string, userId: string): Promise<string>;
  
  // Validate secret exists and belongs to user
  async validate(secretId: string, userId: string): Promise<boolean>;
}
```

**Key Methods**:
- `create()`: Encrypts value with AES-256-GCM, stores in database, logs event
- `decrypt()`: Decrypts value for execution only, never returned in API responses
- `validate()`: Pre-execution check that secret exists and belongs to user
- All methods validate ownership before any operation

### 2. Encryption Utilities (NEW)

**File**: `backend/src/utils/encryption.ts`

**Purpose**: AES-256-GCM encryption/decryption for secrets

**Interface**:
```typescript
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;  // From SECRETS_ENCRYPTION_KEY env var
  
  constructor();
  
  // Encrypt a secret value
  encrypt(plaintext: string): string;
  
  // Decrypt a secret value
  decrypt(encrypted: string): string;
}

// Encrypted format: iv:authTag:encryptedText (all hex)
// Example: "a1b2c3d4....:e5f6g7h8....:i9j0k1l2...."
```

**Implementation Details**:
- Uses `crypto.randomBytes(16)` for IV (initialization vector)
- Uses `cipher.getAuthTag()` for authentication
- Returns format: `${iv}:${authTag}:${encrypted}` (all hex encoded)
- Key loaded from `process.env.SECRETS_ENCRYPTION_KEY` (32 bytes hex)
- Validates key length on startup (must be 64 hex chars = 32 bytes)

### 3. Domain Whitelist (NEW)

**File**: `backend/src/utils/domain-whitelist.ts`

**Purpose**: Validate URLs against approved domains

**Interface**:
```typescript
export class DomainWhitelist {
  private whitelist: Set<string>;
  
  constructor();
  
  // Load whitelist from env var or config
  private loadWhitelist(): Set<string>;
  
  // Check if domain is whitelisted
  isAllowed(url: string): boolean;
  
  // Get whitelist for display
  getWhitelist(): string[];
}

// Environment variable: DOMAIN_WHITELIST (comma-separated)
// Example: "api.github.com,jsonplaceholder.typicode.com,api.openweathermap.org"
```

**Default Whitelist** (for MVP):
```
api.github.com
jsonplaceholder.typicode.com
api.openweathermap.org
api.exchangerate-api.com
restcountries.com
```

**Validation Logic**:
1. Parse URL
2. Extract hostname
3. Check if hostname is in whitelist
4. If not, check existing security rules (no localhost, no private IPs)
5. Return true/false with clear error message


### 4. Enhanced Fetch Operator

**File**: `backend/src/operators/fetch-operator.ts` (ENHANCED)

**Changes**: Add secret resolution support while maintaining backward compatibility

**Enhanced Interface**:
```typescript
export interface FetchConfig {
  url: string;
  headers?: Record<string, string>;  // NEW: Optional headers
  secretRef?: {  // NEW: Optional secret reference
    secretId: string;
    headerName: string;  // e.g., "Authorization", "X-API-Key"
    headerFormat?: string;  // e.g., "Bearer {value}", "ApiKey {value}"
  };
}

export class FetchOperator extends BaseOperator {
  type = 'fetch';
  
  // ENHANCED: Add secretsService parameter (optional for backward compat)
  async execute(
    _input: any, 
    config: FetchConfig,
    context?: { secretsService?: SecretsService; userId?: string }
  ): Promise<any>;
  
  // ENHANCED: Validate config including secret references
  validate(config: any): ValidationResult;
  
  // EXISTING: URL validation (unchanged)
  private isValidUrl(url: string): boolean;
  
  // NEW: Resolve secret and build headers
  private async resolveSecret(
    secretRef: FetchConfig['secretRef'],
    secretsService: SecretsService,
    userId: string
  ): Promise<Record<string, string>>;
}
```

**Execution Flow**:
```
1. Validate config (existing + secret ref if present)
2. Validate URL (existing logic - unchanged)
3. Check domain whitelist (NEW)
4. If secretRef exists:
   a. Validate secretsService and userId are provided
   b. Decrypt secret using secretsService
   c. Build header using format (e.g., "Bearer {value}")
   d. Add to request headers
5. Make HTTP request (existing logic)
6. Return response (existing logic)
```

**Backward Compatibility**:
- If `secretRef` is undefined → execute as before (no changes)
- If `context` is undefined → execute as before (no changes)
- Existing pipes without secrets work identically

### 5. Enhanced Execution Service

**File**: `backend/src/services/execution.service.ts` (ENHANCED)

**Changes**: Add pre-execution secret validation

**Enhanced Methods**:
```typescript
export class ExecutionService {
  private pipeService: PipeService;
  private pipeExecutor: PipeExecutor;
  private secretsService: SecretsService;  // NEW
  
  constructor(private db: Pool) {
    this.pipeService = new PipeService(db);
    this.pipeExecutor = new PipeExecutor(operatorRegistry);
    this.secretsService = new SecretsService(db);  // NEW
  }
  
  // ENHANCED: Add secret validation before execution
  async executeSyncWithTimeout(input: CreateExecutionInput): Promise<Execution> {
    // 1. Get pipe (existing)
    const pipe = await this.pipeService.get(input.pipe_id, input.user_id);
    
    // 2. Validate secrets (NEW)
    await this.validateSecrets(pipe.definition, input.user_id);
    
    // 3. Create execution record (existing)
    const execution = await this.create({...});
    
    // 4. Execute with context (ENHANCED)
    const result = await this.pipeExecutor.execute(
      pipe.definition,
      {  // NEW: execution context
        secretsService: this.secretsService,
        userId: input.user_id
      }
    );
    
    // 5. Update execution record (existing)
    // ...
  }
  
  // NEW: Validate all secret references before execution
  private async validateSecrets(
    definition: PipeDefinition,
    userId: string | null
  ): Promise<void> {
    // Extract all secret references from fetch operators
    const secretRefs = this.extractSecretRefs(definition);
    
    // If no secrets, return early (backward compat)
    if (secretRefs.length === 0) return;
    
    // If secrets but no userId, fail
    if (!userId) {
      throw new Error('Authentication required to use secrets');
    }
    
    // Validate each secret exists and belongs to user
    for (const secretRef of secretRefs) {
      const isValid = await this.secretsService.validate(secretRef.secretId, userId);
      if (!isValid) {
        throw new Error(`Secret not found: ${secretRef.secretId}`);
      }
    }
  }
  
  // NEW: Extract secret references from pipe definition
  private extractSecretRefs(definition: PipeDefinition): Array<{ secretId: string }> {
    return definition.nodes
      .filter(node => node.type === 'fetch')
      .map(node => node.data.config as FetchConfig)
      .filter(config => config.secretRef !== undefined)
      .map(config => ({ secretId: config.secretRef!.secretId }));
  }
}
```

**Key Changes**:
- Add `secretsService` to constructor
- Add `validateSecrets()` before execution
- Pass execution context to `pipeExecutor.execute()`
- Fail fast if secrets are invalid (before execution starts)


### 6. Pipe Executor (ENHANCED)

**File**: `backend/src/services/pipe-executor.ts` (ENHANCED)

**Changes**: Pass execution context to operators

**Enhanced Interface**:
```typescript
export interface ExecutionContext {
  secretsService?: SecretsService;
  userId?: string | null;
}

export class PipeExecutor {
  constructor(private operatorRegistry: OperatorRegistry) {}
  
  // ENHANCED: Add optional context parameter
  async execute(
    definition: PipeDefinition,
    context?: ExecutionContext
  ): Promise<any> {
    // Existing logic: topological sort, cycle detection
    const sortedNodes = this.topologicalSort(definition);
    
    // Execute nodes in order
    const results = new Map<string, any>();
    
    for (const node of sortedNodes) {
      const operator = this.operatorRegistry.get(node.type);
      const input = this.getNodeInput(node, results, definition.edges);
      
      // ENHANCED: Pass context to operator
      const result = await operator.execute(input, node.data.config, context);
      results.set(node.id, result);
    }
    
    // Return final result (existing logic)
    return this.getFinalResult(sortedNodes, results);
  }
  
  // Existing methods unchanged
  private topologicalSort(definition: PipeDefinition): OperatorNode[];
  private detectCycles(definition: PipeDefinition): void;
  private getNodeInput(node: OperatorNode, results: Map<string, any>, edges: Edge[]): any;
  private getFinalResult(nodes: OperatorNode[], results: Map<string, any>): any;
}
```

**Backward Compatibility**:
- `context` parameter is optional
- If not provided, operators execute as before
- Only FetchOperator uses context (for secrets)
- Other operators ignore context


## Data Models

### Secrets Table (NEW)

**Migration**: `backend/src/migrations/008_create_secrets.sql`

```sql
CREATE TABLE IF NOT EXISTS secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  encrypted_value TEXT NOT NULL,  -- AES-256-GCM encrypted (iv:authTag:encrypted)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_secret_name UNIQUE (user_id, name),
  CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Indexes
CREATE INDEX idx_secrets_user_id ON secrets(user_id);

-- Comments
COMMENT ON TABLE secrets IS 'Encrypted API keys and tokens for authenticated API access';
COMMENT ON COLUMN secrets.encrypted_value IS 'AES-256-GCM encrypted value (format: iv:authTag:encrypted)';
```

**Key Points**:
- `user_id` foreign key with CASCADE delete (secrets deleted when user deleted)
- `name` must be unique per user (enforced by constraint)
- `encrypted_value` stores encrypted secret (never plain text)
- No modifications to existing tables

### Pipe Definition Changes (ENHANCED)

**Existing Structure** (unchanged):
```typescript
interface PipeDefinition {
  nodes: OperatorNode[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
}
```

**Enhanced Fetch Node Config**:
```typescript
// BEFORE (still supported):
{
  id: "node-1",
  type: "fetch",
  data: {
    label: "Fetch Data",
    config: {
      url: "https://api.github.com/users/octocat"
    }
  }
}

// AFTER (with secret):
{
  id: "node-1",
  type: "fetch",
  data: {
    label: "Fetch Data",
    config: {
      url: "https://api.github.com/repos/owner/repo",
      secretRef: {
        secretId: "550e8400-e29b-41d4-a716-446655440000",
        headerName: "Authorization",
        headerFormat: "Bearer {value}"
      }
    }
  }
}
```

**Storage**:
- Secret references stored in pipe definition (JSON)
- Only `secretId` stored, never the actual secret value
- When pipe is exported, secret references included with warning
- When pipe is forked, secret references removed

### Environment Variables (NEW)

**Required**:
```bash
# Secrets encryption key (32 bytes = 64 hex characters)
SECRETS_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Domain whitelist (comma-separated)
DOMAIN_WHITELIST=api.github.com,jsonplaceholder.typicode.com,api.openweathermap.org
```

**Validation on Startup**:
```typescript
// backend/src/config/env.ts (ENHANCED)
export function validateEnv(): void {
  // Existing validations...
  
  // NEW: Validate secrets encryption key
  if (!process.env.SECRETS_ENCRYPTION_KEY) {
    throw new Error('SECRETS_ENCRYPTION_KEY is required');
  }
  
  if (process.env.SECRETS_ENCRYPTION_KEY.length !== 64) {
    throw new Error('SECRETS_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  
  // NEW: Validate domain whitelist
  if (!process.env.DOMAIN_WHITELIST) {
    logger.warn('DOMAIN_WHITELIST not set, using default whitelist');
  }
}
```


## API Endpoints

### Secrets API (NEW)

**Base Path**: `/api/v1/secrets`

**Authentication**: All endpoints require JWT authentication

#### 1. Create Secret

```
POST /api/v1/secrets
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "name": "GitHub API Token",
  "description": "Personal access token for GitHub API",
  "value": "ghp_1234567890abcdefghijklmnopqrstuvwxyz"
}

Response (201):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "GitHub API Token",
  "description": "Personal access token for GitHub API",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}

Errors:
400 - Invalid input (name required, value required)
401 - Unauthorized (no token or invalid token)
409 - Conflict (secret name already exists for user)
```

#### 2. List Secrets

```
GET /api/v1/secrets
Authorization: Bearer <token>

Response (200):
{
  "secrets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "GitHub API Token",
      "description": "Personal access token for GitHub API",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "OpenWeather API Key",
      "description": null,
      "created_at": "2025-01-16T14:20:00Z",
      "updated_at": "2025-01-16T14:20:00Z"
    }
  ]
}

Note: encrypted_value is NEVER returned
```

#### 3. Get Secret

```
GET /api/v1/secrets/:id
Authorization: Bearer <token>

Response (200):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "GitHub API Token",
  "description": "Personal access token for GitHub API",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}

Errors:
401 - Unauthorized
404 - Secret not found or doesn't belong to user
```

#### 4. Update Secret

```
PUT /api/v1/secrets/:id
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "name": "GitHub API Token (Updated)",
  "description": "Updated description",
  "value": "ghp_newtoken123456789"  // Optional, only if changing value
}

Response (200):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "GitHub API Token (Updated)",
  "description": "Updated description",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T11:45:00Z"
}

Errors:
400 - Invalid input
401 - Unauthorized
404 - Secret not found
409 - Name conflict
```

#### 5. Delete Secret

```
DELETE /api/v1/secrets/:id
Authorization: Bearer <token>

Response (204):
No content

Errors:
401 - Unauthorized
404 - Secret not found
```

### Enhanced Execution API

**No new endpoints**, but enhanced error messages:

```
POST /api/v1/executions
Authorization: Bearer <token> (optional for public pipes)
Content-Type: application/json

Request:
{
  "pipe_id": "pipe-uuid",
  "mode": "sync"
}

New Error Responses:
400 - { "error": "Secret not found: GitHub API Token" }
400 - { "error": "Authentication required to use secrets" }
400 - { "error": "Domain not whitelisted: api.example.com. Please contact support to request whitelist addition." }
```


## Error Handling

### Error Types

**1. Secret Not Found**
```typescript
class SecretNotFoundError extends Error {
  constructor(secretName: string) {
    super(`Secret not found: ${secretName}`);
    this.name = 'SecretNotFoundError';
  }
}

// HTTP 400 Bad Request
// User-facing message: "Secret not found: GitHub API Token"
// Action: Check secret name, ensure it exists
```

**2. Domain Not Whitelisted**
```typescript
class DomainNotWhitelistedError extends Error {
  constructor(domain: string) {
    super(`Domain not whitelisted: ${domain}. Please contact support to request whitelist addition.`);
    this.name = 'DomainNotWhitelistedError';
  }
}

// HTTP 400 Bad Request
// User-facing message: "Domain not whitelisted: api.example.com. Please contact support to request whitelist addition."
// Action: Contact support or use whitelisted domain
```

**3. Authentication Required**
```typescript
class AuthenticationRequiredError extends Error {
  constructor() {
    super('Authentication required to use secrets');
    this.name = 'AuthenticationRequiredError';
  }
}

// HTTP 401 Unauthorized
// User-facing message: "Authentication required to use secrets"
// Action: Log in to use pipes with secrets
```

**4. Secret Ownership Error**
```typescript
class SecretOwnershipError extends Error {
  constructor() {
    super('Unauthorized: Secret does not belong to you');
    this.name = 'SecretOwnershipError';
  }
}

// HTTP 403 Forbidden
// User-facing message: "Unauthorized: Secret does not belong to you"
// Action: Use your own secrets
```

### Error Handling Flow

```
1. API Endpoint
   ├─ Validate input → 400 Bad Request
   ├─ Check authentication → 401 Unauthorized
   ├─ Check ownership → 403 Forbidden
   └─ Call service

2. Service Layer
   ├─ Validate business logic → throw specific error
   ├─ Call database → catch and wrap errors
   └─ Return result or throw

3. Operator Execution
   ├─ Validate config → throw ValidationError
   ├─ Validate domain → throw DomainNotWhitelistedError
   ├─ Resolve secret → throw SecretNotFoundError
   └─ Execute request → throw network errors

4. Error Middleware (existing)
   ├─ Catch all errors
   ├─ Log with context
   ├─ Map to HTTP status
   └─ Return user-friendly message
```

### Logging Strategy

**Security Events** (using existing Winston logger):

```typescript
// Secret created
logger.info('Secret created', {
  userId: user.id,
  secretId: secret.id,
  secretName: secret.name,
  action: 'secret_created'
});

// Secret accessed (decrypted for execution)
logger.info('Secret accessed', {
  userId: user.id,
  secretId: secret.id,
  pipeId: pipe.id,
  action: 'secret_accessed'
});

// Secret deleted
logger.info('Secret deleted', {
  userId: user.id,
  secretId: secret.id,
  action: 'secret_deleted'
});

// Domain whitelist violation
logger.warn('Domain whitelist violation', {
  userId: user.id,
  pipeId: pipe.id,
  rejectedDomain: domain,
  action: 'domain_rejected'
});

// Pipe forked with secrets
logger.info('Pipe forked with secrets removed', {
  originalUserId: originalPipe.user_id,
  newUserId: user.id,
  pipeId: forkedPipe.id,
  secretsRemoved: secretRefs.length,
  action: 'pipe_forked'
});
```

**Log Format** (existing structured JSON):
```json
{
  "level": "info",
  "message": "Secret created",
  "userId": "user-uuid",
  "secretId": "secret-uuid",
  "secretName": "GitHub API Token",
  "action": "secret_created",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```


## Testing Strategy

### Unit Tests

**1. Encryption Service Tests**
```typescript
describe('EncryptionService', () => {
  it('should encrypt and decrypt correctly', () => {
    const service = new EncryptionService();
    const plaintext = 'my-secret-api-key';
    const encrypted = service.encrypt(plaintext);
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });
  
  it('should produce different ciphertexts for same plaintext', () => {
    const service = new EncryptionService();
    const plaintext = 'my-secret-api-key';
    const encrypted1 = service.encrypt(plaintext);
    const encrypted2 = service.encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2); // Different IVs
  });
  
  it('should throw error for invalid encrypted format', () => {
    const service = new EncryptionService();
    expect(() => service.decrypt('invalid')).toThrow();
  });
});
```

**2. Secrets Service Tests**
```typescript
describe('SecretsService', () => {
  it('should create secret with encrypted value', async () => {
    const secret = await secretsService.create(userId, {
      name: 'Test Secret',
      value: 'plain-text-value'
    });
    
    expect(secret.id).toBeDefined();
    expect(secret.name).toBe('Test Secret');
    expect(secret).not.toHaveProperty('encrypted_value'); // Not in response
  });
  
  it('should decrypt secret for execution', async () => {
    const secret = await secretsService.create(userId, {
      name: 'Test Secret',
      value: 'plain-text-value'
    });
    
    const decrypted = await secretsService.decrypt(secret.id, userId);
    expect(decrypted).toBe('plain-text-value');
  });
  
  it('should throw error when decrypting non-owned secret', async () => {
    const secret = await secretsService.create(userId1, {
      name: 'Test Secret',
      value: 'value'
    });
    
    await expect(
      secretsService.decrypt(secret.id, userId2)
    ).rejects.toThrow('Secret not found');
  });
});
```

**3. Domain Whitelist Tests**
```typescript
describe('DomainWhitelist', () => {
  it('should allow whitelisted domains', () => {
    const whitelist = new DomainWhitelist();
    expect(whitelist.isAllowed('https://api.github.com/users')).toBe(true);
  });
  
  it('should reject non-whitelisted domains', () => {
    const whitelist = new DomainWhitelist();
    expect(whitelist.isAllowed('https://evil.com/api')).toBe(false);
  });
  
  it('should still block localhost even if whitelisted', () => {
    const whitelist = new DomainWhitelist();
    expect(whitelist.isAllowed('http://localhost:3000')).toBe(false);
  });
});
```

**4. Enhanced Fetch Operator Tests**
```typescript
describe('FetchOperator with secrets', () => {
  it('should execute without secret (backward compat)', async () => {
    const operator = new FetchOperator();
    const config = { url: 'https://api.github.com/users/octocat' };
    const result = await operator.execute(null, config);
    expect(result).toBeDefined();
  });
  
  it('should execute with secret', async () => {
    const operator = new FetchOperator();
    const config = {
      url: 'https://api.github.com/user',
      secretRef: {
        secretId: 'secret-uuid',
        headerName: 'Authorization',
        headerFormat: 'Bearer {value}'
      }
    };
    
    const context = {
      secretsService: mockSecretsService,
      userId: 'user-uuid'
    };
    
    const result = await operator.execute(null, config, context);
    expect(result).toBeDefined();
  });
  
  it('should throw error for non-whitelisted domain', async () => {
    const operator = new FetchOperator();
    const config = { url: 'https://evil.com/api' };
    
    await expect(
      operator.execute(null, config)
    ).rejects.toThrow('Domain not whitelisted');
  });
});
```

### Integration Tests

**1. End-to-End Secret Flow**
```typescript
describe('Secrets E2E', () => {
  it('should create, use, and delete secret', async () => {
    // 1. Create secret
    const createRes = await request(app)
      .post('/api/v1/secrets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test API Key',
        value: 'test-key-123'
      });
    expect(createRes.status).toBe(201);
    const secretId = createRes.body.id;
    
    // 2. Create pipe with secret
    const pipe = await createPipeWithSecret(secretId);
    
    // 3. Execute pipe
    const execRes = await request(app)
      .post('/api/v1/executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        pipe_id: pipe.id,
        mode: 'sync'
      });
    expect(execRes.status).toBe(200);
    
    // 4. Delete secret
    const deleteRes = await request(app)
      .delete(`/api/v1/secrets/${secretId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);
    
    // 5. Execution should now fail
    const execRes2 = await request(app)
      .post('/api/v1/executions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        pipe_id: pipe.id,
        mode: 'sync'
      });
    expect(execRes2.status).toBe(400);
    expect(execRes2.body.error).toContain('Secret not found');
  });
});
```

**2. Backward Compatibility Tests**
```typescript
describe('Backward Compatibility', () => {
  it('should execute existing pipes without secrets', async () => {
    // Use existing pipe from Phase 2
    const pipe = await pipeService.get(existingPipeId);
    
    const execRes = await request(app)
      .post('/api/v1/executions')
      .send({
        pipe_id: pipe.id,
        mode: 'sync'
      });
    
    expect(execRes.status).toBe(200);
    expect(execRes.body.status).toBe('completed');
  });
  
  it('should not require secrets service for legacy pipes', async () => {
    // Execute pipe without secrets
    const result = await executionService.executeSyncWithTimeout({
      pipe_id: legacyPipeId,
      user_id: null, // Anonymous
      mode: 'sync'
    });
    
    expect(result.status).toBe('completed');
  });
});
```

### Manual Testing Checklist

**Secrets Management:**
- [ ] Create secret with valid input
- [ ] Create secret with duplicate name (should fail)
- [ ] List secrets (should not show encrypted values)
- [ ] Update secret name and description
- [ ] Update secret value (should re-encrypt)
- [ ] Delete secret
- [ ] Try to access another user's secret (should fail)

**Pipe Execution with Secrets:**
- [ ] Execute pipe with secret (authenticated user)
- [ ] Execute pipe with secret (anonymous user - should fail)
- [ ] Execute pipe with invalid secret reference (should fail)
- [ ] Execute pipe with deleted secret (should fail)
- [ ] Execute legacy pipe without secrets (should work)

**Domain Whitelist:**
- [ ] Execute fetch to whitelisted domain (should work)
- [ ] Execute fetch to non-whitelisted domain (should fail with clear message)
- [ ] Execute fetch to localhost (should fail)
- [ ] Execute fetch to private IP (should fail)

**Pipe Forking:**
- [ ] Fork pipe with secrets (secrets should be removed)
- [ ] Fork pipe without secrets (should work as before)

**Error Messages:**
- [ ] Verify all error messages are user-friendly
- [ ] Verify no sensitive data in error messages
- [ ] Verify error messages include actionable guidance


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Backward Compatibility - Legacy Pipes Execute Unchanged

*For any* pipe created before secrets functionality was implemented, executing that pipe should produce the same result as before the feature was added.

**Validates: Requirements 1.1, 1.5, 8.1**

**Test Strategy**: Load existing pipes from Phase 2, execute them, and compare results to baseline executions.

### Property 2: Fetch Operator Backward Compatibility

*For any* Fetch operator configuration without a secret reference, the operator should execute using the existing HTTP request logic without any modifications.

**Validates: Requirements 1.2, 3.3, 8.4**

**Test Strategy**: Generate random Fetch configurations without secretRef, execute them, and verify behavior matches original implementation.

### Property 3: Encryption Round Trip

*For any* secret value, encrypting and then decrypting should return the original value.

**Validates: Requirements 2.1**

**Test Strategy**: Generate random secret values, encrypt them, decrypt them, and verify equality.

### Property 4: Secret Metadata Never Contains Values

*For any* API response containing secret metadata, the response should never include the encrypted_value or decrypted value fields.

**Validates: Requirements 2.2**

**Test Strategy**: Create secrets, call list/get endpoints, and verify responses don't contain value fields.

### Property 5: Secret Deletion Prevents Future Use

*For any* secret, after deletion, attempting to execute a pipe that references that secret should fail with a clear error.

**Validates: Requirements 2.4**

**Test Strategy**: Create secret, create pipe using it, delete secret, attempt execution, verify failure.

### Property 6: Pre-Execution Secret Validation

*For any* pipe with secret references, the system should validate all secrets exist and belong to the user before execution starts.

**Validates: Requirements 2.5**

**Test Strategy**: Create pipes with invalid secret references (non-existent, wrong owner), attempt execution, verify failure before execution.

### Property 7: Pipe Definitions Never Contain Secret Values

*For any* pipe with secret references, the pipe definition should only contain secret IDs, never the actual secret values.

**Validates: Requirements 3.2**

**Test Strategy**: Create pipes with secrets, inspect pipe definitions, verify only IDs are present.

### Property 8: Fork Removes Secret References

*For any* pipe with secret references, forking that pipe should remove all secret references from the forked copy.

**Validates: Requirements 3.5**

**Test Strategy**: Create pipe with secrets, fork it, verify forked pipe has no secret references.

### Property 9: Domain Whitelist Validation

*For any* URL, if the domain is not on the whitelist, the Fetch operator should reject the request before making it.

**Validates: Requirements 4.2, 4.3**

**Test Strategy**: Generate random URLs with non-whitelisted domains, attempt fetch, verify rejection.

### Property 10: Whitelisted Domain Allows All Paths

*For any* whitelisted domain and any path, the Fetch operator should allow the request.

**Validates: Requirements 4.4**

**Test Strategy**: Generate random paths on whitelisted domains, attempt fetch, verify success.

### Property 11: Localhost and Private IPs Always Blocked

*For any* URL with localhost or private IP addresses, the Fetch operator should reject the request regardless of whitelist.

**Validates: Requirements 4.5**

**Test Strategy**: Generate localhost and private IP URLs, attempt fetch, verify rejection.

### Property 12: Error Messages Don't Expose Internals

*For any* security violation, the error message should be user-friendly and not expose system internals (stack traces, file paths, database details).

**Validates: Requirements 5.5**

**Test Strategy**: Trigger various security violations, inspect error messages, verify no internal details.

### Property 13: Logs Never Contain Secret Values

*For any* secret usage in execution, the logs should contain the secret ID but never the decrypted value.

**Validates: Requirements 6.3**

**Test Strategy**: Execute pipes with secrets, inspect logs, verify no secret values present.

### Property 14: New Pipes Without Secrets Work Identically

*For any* newly created pipe without secret references, the system should behave identically to the current implementation.

**Validates: Requirements 8.3**

**Test Strategy**: Create new pipes without secrets, execute them, verify behavior matches pre-secrets implementation.


## Security Considerations

### Encryption

**Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Why**: Authenticated encryption (prevents tampering)
- **Key Size**: 256 bits (32 bytes)
- **IV**: Random 16 bytes per encryption (prevents pattern analysis)
- **Auth Tag**: 16 bytes (ensures integrity)

**Key Management**:
- Key stored in environment variable `SECRETS_ENCRYPTION_KEY`
- Key must be 64 hex characters (32 bytes)
- Key should be generated using cryptographically secure random generator
- Key rotation not implemented in MVP (can be added later)

**Generation Command**:
```bash
# Generate secure encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Secret Storage

**Database**:
- Secrets stored in dedicated `secrets` table
- Only encrypted values stored (never plaintext)
- User ownership enforced by foreign key
- Cascade delete when user deleted

**Access Control**:
- Secrets only accessible by owner
- Ownership validated on every operation
- No admin access to decrypt secrets (by design)

### Secret Usage

**Decryption**:
- Only during pipe execution
- Never returned in API responses
- Never logged (only secret ID logged)
- Decrypted value only in memory during execution

**Transmission**:
- Secrets never sent to frontend
- Only secret IDs and metadata transmitted
- HTTPS required in production

### Domain Whitelist

**Purpose**: Prevent abuse and protect external APIs

**Default Whitelist**:
- api.github.com
- jsonplaceholder.typicode.com
- api.openweathermap.org
- api.exchangerate-api.com
- restcountries.com

**Expansion Process**:
- Users request whitelist addition via support
- Admin reviews request (checks for abuse potential)
- Admin adds domain to whitelist
- Restart required (or implement hot-reload)

**Security Rules** (always enforced):
- No localhost (127.0.0.1, ::1)
- No private IPs (10.x, 172.16-31.x, 192.168.x)
- No link-local (169.254.x)
- Only HTTP/HTTPS protocols

### Audit Logging

**What's Logged**:
- Secret creation, access, deletion
- Domain whitelist violations
- Secret validation failures
- Pipe forks with secrets

**What's NOT Logged**:
- Secret values (encrypted or decrypted)
- User passwords
- JWT tokens
- Internal system errors (only sanitized messages)

**Log Retention**:
- Logs stored by Winston (existing configuration)
- Retention policy: 30 days (configurable)
- Logs can be exported for analysis

### Attack Vectors & Mitigations

**1. Secret Theft**
- **Attack**: Attacker tries to access another user's secrets
- **Mitigation**: Ownership validation on every operation, database foreign keys

**2. Secret Exposure in Logs**
- **Attack**: Secrets leaked through error messages or logs
- **Mitigation**: Never log secret values, only IDs; sanitize error messages

**3. Secret Exposure in Pipe Definitions**
- **Attack**: Secrets stored in pipe definitions, exposed when shared
- **Mitigation**: Only store secret IDs, remove references on fork

**4. Domain Whitelist Bypass**
- **Attack**: Attacker tries to access non-whitelisted domains
- **Mitigation**: Validate before request, block localhost/private IPs

**5. Timing Attacks on Encryption**
- **Attack**: Attacker uses timing to infer secret values
- **Mitigation**: Use constant-time comparison for auth tags (built into GCM)

**6. Replay Attacks**
- **Attack**: Attacker replays encrypted secrets
- **Mitigation**: Random IV per encryption prevents replay


## Implementation Notes

### Phase 3 Implementation Order

**Day 1: Foundation**
1. Create encryption utilities (`backend/src/utils/encryption.ts`)
2. Create secrets table migration (`backend/src/migrations/008_create_secrets.sql`)
3. Create secrets service (`backend/src/services/secrets.service.ts`)
4. Create secrets routes (`backend/src/routes/secrets.routes.ts`)
5. Add environment variable validation

**Day 2: Integration**
6. Create domain whitelist utility (`backend/src/utils/domain-whitelist.ts`)
7. Enhance Fetch operator with secret support
8. Enhance execution service with secret validation
9. Update pipe executor to pass context
10. Add security audit logging

**Day 3: Frontend & Testing**
11. Create secrets API client (`frontend/src/services/secretsService.ts`)
12. Create secrets Redux slice (`frontend/src/store/slices/secretsSlice.ts`)
13. Create secrets management UI (`frontend/src/components/secrets/`)
14. Enhance operator config panel with secret selector
15. Write unit tests and integration tests
16. Manual testing and bug fixes

### Backward Compatibility Checklist

Before merging Phase 3:
- [ ] All existing pipes execute successfully
- [ ] All 77 Phase 2 tasks still pass
- [ ] No modifications to existing database tables
- [ ] No modifications to existing API endpoints (except enhancements)
- [ ] No modifications to existing frontend components (except enhancements)
- [ ] Fetch operator works without secrets
- [ ] Execution service works without secrets
- [ ] Anonymous users can still execute public pipes

### Migration Strategy

**Database Migration**:
```sql
-- 008_create_secrets.sql
-- Safe to run: only creates new table, no modifications to existing tables
CREATE TABLE IF NOT EXISTS secrets (...);
```

**Environment Variables**:
```bash
# Add to .env (required)
SECRETS_ENCRYPTION_KEY=<64-hex-chars>
DOMAIN_WHITELIST=api.github.com,jsonplaceholder.typicode.com,...

# Generate key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Deployment Steps**:
1. Add environment variables to production
2. Run database migration
3. Deploy backend code
4. Deploy frontend code
5. Verify existing pipes still work
6. Announce new feature to users

### Performance Considerations

**Encryption/Decryption**:
- AES-256-GCM is fast (~1ms per operation)
- Minimal impact on execution time
- No caching of decrypted values (security over performance)

**Database Queries**:
- Secrets table has index on user_id
- Typical query: SELECT by user_id (fast)
- No N+1 queries (secrets validated in batch)

**Domain Whitelist**:
- Whitelist loaded once on startup
- Stored in Set for O(1) lookup
- No database queries for validation

**Caching**:
- No caching of secrets (security risk)
- Pipe definitions cached as before (only contain secret IDs)
- No impact on existing cache strategy

### Testing Requirements

**Unit Tests** (required):
- Encryption service (encrypt/decrypt round trip)
- Secrets service (CRUD operations)
- Domain whitelist (allow/reject logic)
- Enhanced Fetch operator (with and without secrets)

**Integration Tests** (required):
- End-to-end secret flow (create, use, delete)
- Backward compatibility (existing pipes)
- Error handling (missing secrets, invalid domains)

**Manual Tests** (required):
- Create and manage secrets via UI
- Use secrets in pipe execution
- Fork pipe with secrets (verify removal)
- Test all error scenarios

### Documentation Updates

**User Documentation**:
- How to create and manage secrets
- How to use secrets in Fetch operator
- Domain whitelist and how to request additions
- Security best practices

**Developer Documentation**:
- Encryption implementation details
- API endpoint documentation
- Integration guide for new operators
- Security considerations

### Future Enhancements (Post-MVP)

**Not in Phase 3, but possible later**:
- Key rotation support
- Secret expiration dates
- Secret usage analytics
- Hot-reload domain whitelist
- Secret sharing between users (with permissions)
- Secret templates (e.g., "GitHub Token", "API Key")
- Bulk secret import/export
- Secret versioning
- Audit log UI for admins

