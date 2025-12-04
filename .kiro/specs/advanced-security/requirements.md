# Requirements Document

## Introduction

This feature enhances the security infrastructure of Yahoo Pipes 2025 by implementing secrets management, enhanced domain whitelisting, and security auditing. The goal is to enable users to safely use external APIs that require authentication while preventing abuse and protecting the platform from malicious actors. This phase focuses on essential security features that provide maximum value with minimal complexity, making the platform demo-ready and hackathon-competitive.

## Glossary

- **System**: Yahoo Pipes 2025 platform
- **User**: Authenticated user of the platform
- **Secret**: Encrypted API key, token, or credential stored for use in pipe execution
- **Secret Reference**: A pointer to a secret (using secret ID) stored in a pipe definition instead of the actual secret value
- **Operator**: A node in a pipe that performs a specific operation (Fetch, Filter, Sort, Transform)
- **Fetch Operator**: Operator that makes HTTP requests to external APIs
- **Domain Whitelist**: List of approved domains that the Fetch operator can access
- **Pipe**: A workflow composed of connected operators
- **Pipe Definition**: JSON structure containing nodes, edges, and operator configurations
- **Execution**: A single run of a pipe
- **Legacy Pipe**: A pipe created before secrets management was implemented
- **Backward Compatibility**: Ensuring existing pipes continue to work after new features are added

## Backward Compatibility & Interoperability Principles

### Core Principles

1. **Zero Breaking Changes**: All existing pipes MUST continue to work exactly as they do now
2. **Additive Only**: New features are additions, not replacements
3. **Graceful Degradation**: If secrets are unavailable, pipes should fail with clear errors, not crash
4. **Optional Features**: Secrets management is optional - users can continue using public APIs without secrets
5. **Migration Path**: Clear path for users to upgrade pipes to use secrets when needed

### Compatibility Requirements

- **Existing Pipes**: All 77 completed tasks and existing functionality MUST remain unchanged
- **Fetch Operator**: Must work with both plain URLs (current) and URLs with secret-based auth (new)
- **Pipe Execution**: Execution engine must handle pipes with and without secret references
- **API Endpoints**: All existing endpoints must maintain current behavior
- **Database Schema**: New tables only, no modifications to existing tables
- **Frontend Components**: Existing components work as-is, new components are additions

## Requirements

### Requirement 1

**User Story:** As a platform maintainer, I want to ensure backward compatibility with existing pipes, so that no existing functionality breaks when security features are added.

#### Acceptance Criteria

1. WHEN the System loads an existing pipe without secret references THEN the System SHALL execute it exactly as before without any changes
2. WHEN a Fetch operator has no secret reference THEN the System SHALL execute the HTTP request using the current implementation without modification
3. WHEN the secrets table does not exist THEN the System SHALL continue to function normally for pipes without secret references
4. WHEN a user has never created secrets THEN the System SHALL not require or prompt for secrets in existing workflows
5. WHERE a pipe definition contains no secret references THEN the System SHALL treat it as a legacy pipe and execute normally

### Requirement 2

**User Story:** As a user, I want to securely store API keys and tokens, so that I can use authenticated APIs in my pipes without exposing credentials.

#### Acceptance Criteria

1. WHEN a user creates a secret THEN the System SHALL encrypt the secret value using AES-256-GCM before storing it in the database
2. WHEN a user retrieves their secrets list THEN the System SHALL return only secret metadata (name, description, created date) without decrypted values
3. WHEN a pipe executes with a secret reference THEN the System SHALL decrypt the secret only during execution and never log or expose the decrypted value
4. WHEN a user deletes a secret THEN the System SHALL remove it from the database and prevent its use in future executions
5. WHERE a secret is referenced in a pipe THEN the System SHALL validate the secret exists and belongs to the user before execution starts

### Requirement 3

**User Story:** As a user, I want to reference my stored secrets in operator configurations, so that I can use authenticated APIs without hardcoding credentials.

#### Acceptance Criteria

1. WHEN a user configures a Fetch operator THEN the System SHALL provide an option to select from their stored secrets for authentication headers
2. WHEN a secret is selected in an operator THEN the System SHALL store only a reference (secret ID) in the pipe definition, not the actual secret value
3. WHEN a Fetch operator has no secret reference THEN the System SHALL execute using the existing header configuration without any changes
4. WHEN a pipe is exported THEN the System SHALL exclude secret values and include only secret references with a warning message
5. WHEN a pipe is forked THEN the System SHALL remove all secret references and require the new owner to configure their own secrets

### Requirement 4

**User Story:** As a platform administrator, I want to maintain a domain whitelist for the Fetch operator, so that users can only access approved external APIs.

#### Acceptance Criteria

1. WHEN the System starts THEN the System SHALL load the domain whitelist from configuration or environment variables
2. WHEN a Fetch operator executes THEN the System SHALL validate the target URL against the domain whitelist before making the request
3. WHEN a URL is not on the whitelist THEN the System SHALL reject the request and return a clear error message with the rejected domain
4. WHERE a domain is on the whitelist THEN the System SHALL allow requests to any path on that domain
5. WHEN validating URLs THEN the System SHALL continue to prevent localhost, private IP ranges (10.x, 172.16-31.x, 192.168.x), and loopback addresses as currently implemented

### Requirement 5

**User Story:** As a user, I want to see clear error messages when my pipe fails due to security restrictions, so that I can understand and fix the issue.

#### Acceptance Criteria

1. WHEN a secret is not found during execution THEN the System SHALL return an error message indicating which secret is missing by name
2. WHEN a domain is not whitelisted THEN the System SHALL return an error message with the rejected domain and instructions to request whitelist addition
3. WHEN a secret reference is invalid or malformed THEN the System SHALL return an error message explaining the issue and how to fix it
4. WHEN a pipe is exported with secret references THEN the System SHALL include a warning message that secrets must be reconfigured by the recipient
5. WHEN a security violation occurs THEN the System SHALL log the incident for administrator review while providing a user-friendly error message without exposing system internals

### Requirement 6

**User Story:** As a platform administrator, I want to audit security events, so that I can detect and respond to abuse or attacks.

#### Acceptance Criteria

1. WHEN a secret is created, accessed, or deleted THEN the System SHALL log the event with user ID, secret ID, action type, and timestamp using the existing Winston logger
2. WHEN a domain whitelist violation occurs THEN the System SHALL log the event with user ID, rejected URL, and timestamp
3. WHEN a secret is used in pipe execution THEN the System SHALL log the event with user ID, pipe ID, secret ID (not value), and timestamp
4. WHEN a pipe is forked with secret references THEN the System SHALL log the event with original owner ID, new owner ID, and pipe ID
5. WHEN security logs are written THEN the System SHALL use the existing structured JSON format and Winston configuration without modifications

### Requirement 7

**User Story:** As a developer, I want clear integration points for secrets in the existing codebase, so that implementation does not break current functionality.

#### Acceptance Criteria

1. WHEN adding secrets functionality THEN the System SHALL create new database tables without modifying existing tables (users, pipes, executions, pipe_versions, pipe_likes)
2. WHEN modifying the Fetch operator THEN the System SHALL extend the existing operator interface without changing the base IOperator interface
3. WHEN adding secret resolution to execution THEN the System SHALL add it as a pre-execution step without modifying the core execution engine logic
4. WHEN adding API endpoints for secrets THEN the System SHALL create new routes under /api/v1/secrets without modifying existing route files
5. WHEN adding frontend components for secrets THEN the System SHALL create new components without modifying existing editor, profile, or browse components

### Requirement 8

**User Story:** As a quality assurance engineer, I want to validate that existing functionality remains intact, so that no regressions are introduced.

#### Acceptance Criteria

1. WHEN secrets functionality is implemented THEN all existing pipes created before the feature SHALL execute successfully without modification
2. WHEN running existing test scenarios THEN all 77 completed tasks from core-pipe-engine SHALL continue to pass
3. WHEN a user creates a new pipe without secrets THEN the System SHALL behave identically to the current implementation
4. WHEN the Fetch operator is used without secret references THEN the System SHALL use the existing HTTP request logic without any changes
5. WHEN testing the implementation THEN the System SHALL include test cases for both legacy pipes (no secrets) and new pipes (with secrets)
