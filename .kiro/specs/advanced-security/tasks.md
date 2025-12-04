# Implementation Plan

## Overview

This implementation plan covers the advanced security features for Yahoo Pipes 2025, including secrets management, domain whitelisting, and security auditing. The plan is structured to ensure **zero breaking changes** to existing functionality while adding critical security capabilities.

**Key Principles:**
- Backward compatibility is mandatory - all existing pipes must continue to work
- New features are additive only - no modifications to existing core logic
- Security first - fail secure with clear error messages
- Test thoroughly - both new features and existing functionality

## Current Status (2025-11-25)

**✅ ALL TASKS COMPLETE** - All 22 implementation tasks + all property/unit/integration tests complete

### Completed Phases:
- ✅ **Phase 1**: Foundation - Encryption and Database (Tasks 1-3)
- ✅ **Phase 2**: API Layer - Secrets Endpoints (Task 4)
- ✅ **Phase 3**: Domain Whitelisting (Task 5)
- ✅ **Phase 4**: Operator Enhancement - Fetch with Secrets (Task 6)
- ✅ **Phase 5**: Execution Integration - Secret Validation (Tasks 7-8)
- ✅ **Phase 6**: Security Auditing (Task 9)
- ✅ **Phase 7**: Pipe Operations - Fork and Export (Tasks 10-11)
- ✅ **Phase 8**: Frontend - Secrets Management UI (Tasks 12-15)
- ✅ **Phase 9**: Error Handling and User Experience (Tasks 16-17)
- ✅ **Phase 10**: Backward Compatibility Validation (Task 18)
- ✅ **Phase 11**: Final Testing and Deployment (Tasks 19-22)
- ✅ **All Property Tests**: Complete and verified
- ✅ **All Unit Tests**: Complete and verified
- ✅ **All Integration Tests**: Complete and verified

---

## Phase 1: Foundation - Encryption and Database

- [x] 1. Set up encryption infrastructure



  - Create encryption utility with AES-256-GCM
  - Implement encrypt() and decrypt() methods
  - Add environment variable validation for SECRETS_ENCRYPTION_KEY
  - Generate secure encryption key for development
  - _Requirements: 2.1_

- [x] 1.1 Write property test for encryption round trip
  - **Property 3: Encryption Round Trip**
  - **Validates: Requirements 2.1**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 2. Create secrets database table
  - Write migration 008_create_secrets.sql
  - Define table schema with user_id foreign key, encrypted_value, name, description
  - Add indexes on user_id
  - Add unique constraint on (user_id, name)
  - Add CASCADE delete on user_id
  - _Requirements: 2.1, 7.1_

- [x] 3. Implement secrets service
  - Create SecretsService class with CRUD operations
  - Implement create() method with encryption
  - Implement list() method returning metadata only (no encrypted values)
  - Implement get() method returning metadata only
  - Implement update() method with re-encryption
  - Implement delete() method
  - Implement decrypt() method for internal use only
  - Implement validate() method for pre-execution checks
  - Add ownership validation to all methods
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Write property test for secret metadata never contains values
  - **Property 4: Secret Metadata Never Contains Values**
  - **Validates: Requirements 2.2**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 3.2 Write property test for secret deletion prevents future use
  - **Property 5: Secret Deletion Prevents Future Use**
  - **Validates: Requirements 2.4**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 3.3 Write unit tests for secrets service
  - Test create with valid input
  - Test create with duplicate name (should fail)
  - Test list returns metadata only
  - Test decrypt for execution
  - Test decrypt with wrong owner (should fail)
  - Test delete removes secret
  - Test validate with valid and invalid secrets
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - **Status**: ✅ COMPLETE - Testing verified

---

## Phase 2: API Layer - Secrets Endpoints

- [x] 4. Create secrets API routes
  - Create /api/v1/secrets routes file
  - Implement POST /secrets (create secret)
  - Implement GET /secrets (list user's secrets)
  - Implement GET /secrets/:id (get secret metadata)
  - Implement PUT /secrets/:id (update secret)
  - Implement DELETE /secrets/:id (delete secret)
  - Add JWT authentication middleware to all routes
  - Add input validation for all endpoints
  - Add error handling with user-friendly messages
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4.1 Write integration tests for secrets API
  - Test create secret endpoint
  - Test list secrets endpoint
  - Test get secret endpoint
  - Test update secret endpoint
  - Test delete secret endpoint
  - Test unauthorized access (no token)
  - Test accessing another user's secret (should fail)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - **Status**: ✅ COMPLETE - Testing verified

---

## Phase 3: Domain Whitelisting

- [x] 5. Implement domain whitelist utility
  - Create DomainWhitelist class
  - Load whitelist from DOMAIN_WHITELIST environment variable
  - Implement isAllowed() method to validate URLs
  - Add default whitelist (api.github.com, jsonplaceholder.typicode.com, etc.)
  - Ensure localhost and private IPs are always blocked
  - Add clear error messages for rejected domains
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.1 Write property test for domain whitelist validation
  - **Property 9: Domain Whitelist Validation**
  - **Validates: Requirements 4.2, 4.3**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 5.2 Write property test for whitelisted domain allows all paths
  - **Property 10: Whitelisted Domain Allows All Paths**
  - **Validates: Requirements 4.4**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 5.3 Write property test for localhost and private IPs always blocked
  - **Property 11: Localhost and Private IPs Always Blocked**
  - **Validates: Requirements 4.5**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 5.4 Write unit tests for domain whitelist
  - Test whitelisted domains are allowed
  - Test non-whitelisted domains are rejected
  - Test localhost is always blocked
  - Test private IPs are always blocked
  - Test various URL formats and edge cases
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - **Status**: ✅ COMPLETE - Testing verified

---

## Phase 4: Operator Enhancement - Fetch with Secrets

- [x] 6. Enhance Fetch operator with secret support
  - Extend FetchConfig interface to include optional secretRef field
  - Add resolveSecret() private method to decrypt and format headers
  - Modify execute() method to accept optional context parameter
  - Add domain whitelist validation before making requests
  - Ensure backward compatibility - execute without secrets works unchanged
  - Add clear error messages for secret and domain validation failures
  - _Requirements: 3.1, 3.2, 3.3, 4.2, 4.3_

- [x] 6.1 Write property test for Fetch operator backward compatibility
  - **Property 2: Fetch Operator Backward Compatibility**
  - **Validates: Requirements 1.2, 3.3, 8.4**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 6.2 Write unit tests for enhanced Fetch operator
  - Test execute without secret (backward compat)
  - Test execute with secret reference
  - Test execute with invalid secret (should fail)
  - Test execute with non-whitelisted domain (should fail)
  - Test execute with whitelisted domain and secret
  - Test various header formats (Bearer, ApiKey, etc.)
  - _Requirements: 3.1, 3.2, 3.3, 4.2, 4.3_
  - **Status**: ✅ COMPLETE - Testing verified

---



## Phase 5: Execution Integration - Secret Validation

- [x] 7. Enhance execution service with secret validation
  - Add secretsService to ExecutionService constructor
  - Implement extractSecretRefs() method to find all secret references in pipe
  - Implement validateSecrets() method for pre-execution validation
  - Modify executeSyncWithTimeout() to validate secrets before execution
  - Pass execution context (secretsService, userId) to pipe executor
  - Ensure backward compatibility - pipes without secrets work unchanged
  - Add clear error messages for missing or invalid secrets
  - _Requirements: 2.5, 3.1, 7.3_

- [x] 7.1 Write property test for pre-execution secret validation
  - **Property 6: Pre-Execution Secret Validation**
  - **Validates: Requirements 2.5**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 8. Update pipe executor to pass context
  - Add optional ExecutionContext parameter to execute() method
  - Pass context to operator execute() calls
  - Ensure backward compatibility - context is optional
  - _Requirements: 7.3_

- [x] 8.1 Write integration test for end-to-end secret flow
  - Test create secret, create pipe with secret, execute pipe, delete secret
  - Test execution fails after secret deletion
  - Test anonymous user cannot execute pipe with secrets
  - _Requirements: 2.1, 2.4, 2.5, 3.1_
  - **Status**: ✅ COMPLETE - Testing verified

---

## Phase 6: Security Auditing

- [x] 9. Implement security audit logging
  - Add logging for secret creation events
  - Add logging for secret access (decryption) events
  - Add logging for secret deletion events
  - Add logging for domain whitelist violations
  - Add logging for pipe forks with secret references
  - Use existing Winston logger with structured JSON format
  - Ensure secret values are NEVER logged (only IDs)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9.1 Write property test for logs never contain secret values
  - **Property 13: Logs Never Contain Secret Values**
  - **Validates: Requirements 6.3**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 9.2 Write unit tests for audit logging
  - Test secret creation is logged
  - Test secret access is logged
  - Test secret deletion is logged
  - Test domain violations are logged
  - Test logs contain no secret values
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - **Status**: ✅ COMPLETE - Testing verified

---



## Phase 7: Pipe Operations - Fork and Export

- [x] 10. Enhance pipe fork to remove secret references
  - Modify fork operation to detect secret references in pipe definition
  - Remove all secretRef fields from forked pipe
  - Log fork event with secret removal count
  - Add warning message to user about removed secrets
  - _Requirements: 3.5, 6.4_

- [x] 10.1 Write property test for fork removes secret references
  - **Property 8: Fork Removes Secret References**
  - **Validates: Requirements 3.5**
  - **Status**: ✅ COMPLETE - Testing verified



- [x] 11. Enhance pipe export with secret warnings
  - Detect secret references in pipe definition during export
  - Include warning message in export that secrets must be reconfigured
  - Ensure secret IDs are included but values are not
  - _Requirements: 3.4, 5.4_

- [x] 11.1 Write property test for pipe definitions never contain secret values
  - **Property 7: Pipe Definitions Never Contain Secret Values**
  - **Validates: Requirements 3.2**
  - **Status**: ✅ COMPLETE - Testing verified




---

## Phase 8: Frontend - Secrets Management UI

- [x] 12. Create secrets API client
  - Create secretsService.ts with API methods
  - Implement createSecret(), listSecrets(), getSecret(), updateSecret(), deleteSecret()
  - Add error handling and type definitions
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 13. Create secrets Redux slice
  - Create secretsSlice.ts with state management
  - Implement async thunks for all CRUD operations
  - Add loading and error states
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 14. Create secrets management UI components
  - Create SecretsList component to display user's secrets
  - Create CreateSecretModal component for creating new secrets
  - Create EditSecretModal component for updating secrets
  - Create DeleteSecretConfirmation component
  - Add secrets management page to user profile
  - Style with Tailwind CSS
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 15. Enhance operator config panel with secret selector


  - Add secret selector dropdown to Fetch operator config
  - Load user's secrets from Redux store
  - Add header name and format inputs
  - Show "Create Secret" button if no secrets exist
  - Update pipe definition with secretRef when secret selected
  - Ensure backward compatibility - existing configs work unchanged
  - _Requirements: 3.1, 3.2_

---

## Phase 9: Error Handling and User Experience

- [x] 16. Implement comprehensive error handling
  - Create custom error classes (SecretNotFoundError, DomainNotWhitelistedError, etc.)
  - Add user-friendly error messages for all security violations
  - Ensure error messages don't expose system internals
  - Add actionable guidance in error messages
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 16.1 Write property test for error messages don't expose internals
  - **Property 12: Error Messages Don't Expose Internals**
  - **Validates: Requirements 5.5**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 17. Add user documentation
  - Document how to create and manage secrets
  - Document how to use secrets in Fetch operator
  - Document domain whitelist and request process
  - Document security best practices
  - _Requirements: 5.1, 5.2, 5.3, 5.4_



---

## Phase 10: Backward Compatibility Validation

- [x] 18. Validate backward compatibility
  - Test all existing pipes from Phase 2 execute successfully
  - Test Fetch operator without secrets works unchanged
  - Test execution service without secrets works unchanged
  - Test anonymous users can still execute public pipes
  - Test new pipes without secrets behave identically to before
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 18.1 Write property test for backward compatibility - legacy pipes execute unchanged
  - **Property 1: Backward Compatibility - Legacy Pipes Execute Unchanged**
  - **Validates: Requirements 1.1, 1.5, 8.1**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 18.2 Write property test for new pipes without secrets work identically
  - **Property 14: New Pipes Without Secrets Work Identically**
  - **Validates: Requirements 8.3**
  - **Status**: ✅ COMPLETE - Testing verified

- [x] 18.3 Write integration tests for backward compatibility
  - Test existing pipes execute successfully
  - Test pipes without secrets work as before
  - Test anonymous execution still works
  - Test all Phase 2 functionality remains intact
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.3, 8.4, 8.5_
  - **Status**: ✅ COMPLETE - Testing verified

---

## Phase 11: Final Testing and Deployment

- [x] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Manual testing
  - Test secrets management UI (create, list, update, delete)
  - Test using secrets in pipe execution
  - Test domain whitelist validation
  - Test error scenarios (missing secrets, invalid domains)
  - Test pipe forking with secrets
  - Test pipe export with secrets



  - Test backward compatibility with existing pipes
  - _Requirements: All_

- [x] 21. Prepare deployment
  - Generate production encryption key
  - Configure DOMAIN_WHITELIST environment variable
  - Run database migration in production
  - Update deployment documentation
  - Create rollback plan
  - _Requirements: 2.1, 4.1_

- [x] 22. Deploy and verify

  - Deploy backend with new features
  - Deploy frontend with new UI
  - Verify existing pipes still work
  - Verify new features work correctly
  - Monitor logs for errors
  - _Requirements: All_

---

## Implementation Notes

### Critical Requirements

1. **Zero Breaking Changes**: All existing pipes must continue to work exactly as before
2. **Additive Only**: New features are additions, not modifications to existing code
3. **Security First**: Fail secure with clear error messages, never expose secrets
4. **Test Thoroughly**: Test both new features and existing functionality

### Key Integration Points

**NEW Components:**
- `backend/src/utils/encryption.ts`
- `backend/src/utils/domain-whitelist.ts`
- `backend/src/services/secrets.service.ts`
- `backend/src/routes/secrets.routes.ts`
- `backend/src/migrations/008_create_secrets.sql`
- `frontend/src/services/secretsService.ts`
- `frontend/src/store/slices/secretsSlice.ts`
- `frontend/src/components/secrets/`

**ENHANCED Components:**
- `backend/src/operators/fetch-operator.ts` (add secret resolution)
- `backend/src/services/execution.service.ts` (add secret validation)
- `backend/src/services/pipe-executor.ts` (pass context)
- `frontend/src/components/editor/OperatorConfigPanel.tsx` (add secret selector)

**UNCHANGED Components:**
- All other services, routes, operators
- All database tables (except new secrets table)
- All other frontend components
- Core execution engine logic

### Environment Variables

Required new environment variables:
```bash
# 32 bytes (64 hex characters)
SECRETS_ENCRYPTION_KEY=<generate-with-crypto.randomBytes(32).toString('hex')>

# Comma-separated list of allowed domains
DOMAIN_WHITELIST=api.github.com,jsonplaceholder.typicode.com,api.openweathermap.org,api.exchangerate-api.com,restcountries.com
```

### Testing Strategy

**Unit Tests**: Test individual components in isolation
- Encryption service (encrypt/decrypt)
- Secrets service (CRUD operations)
- Domain whitelist (validation logic)
- Enhanced Fetch operator (with and without secrets)

**Property-Based Tests**: Test universal properties across all inputs
- Encryption round trip
- Secret metadata never contains values
- Fork removes secret references
- Domain whitelist validation
- Backward compatibility

**Integration Tests**: Test end-to-end flows
- Create secret → use in pipe → execute → delete
- Backward compatibility with existing pipes
- Error handling for all security violations

**Manual Tests**: Test user-facing functionality
- Secrets management UI
- Pipe execution with secrets
- Error messages and user experience

### Deployment Checklist

Before deploying to production:
- [x] All tests pass (unit, property, integration)
- [x] Manual testing complete
- [x] Environment variables configured
- [x] Database migration ready
- [x] Existing pipes verified to work
- [x] Rollback plan documented
- [x] User documentation complete
- [x] Monitoring and alerting configured

### Success Criteria

Phase 3 is complete when:
1. All 22 tasks are completed
2. All tests pass (unit, property, integration, manual)
3. All existing pipes from Phase 2 continue to work unchanged
4. Users can create, manage, and use secrets in pipes
5. Domain whitelist prevents access to non-approved domains
6. Security events are logged comprehensively
7. Error messages are clear and actionable
8. No secrets are exposed in logs, API responses, or pipe definitions
9. Deployment is successful with zero downtime
10. User documentation is complete and accurate
