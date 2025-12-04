---
inclusion: always
---

# Architecture Principles

## Core Philosophy

This is a **resurrection of Yahoo Pipes with 2025 technology**, not another n8n or workflow platform.

### What Yahoo Pipes Was
- Visual data mashup tool
- Connect RSS feeds, APIs, data sources
- Filter, transform, combine data
- Output as RSS/JSON
- Simple, focused, powerful

### What We're Building
- Same concept, same simplicity
- Modern tech stack (React, Node, PostgreSQL)
- JSON-based pipe definitions
- Public/private sharing
- Security and safety guardrails

## Design Decision Framework

Every feature must answer:
1. **Why this?** - What problem does it solve?
2. **Why not this?** - What alternatives did we reject?
3. **Why not simpler?** - Is this the minimal solution?
4. **Why not just 2025 tech?** - Does this add value beyond modernization?

## Architectural Patterns

### 1. Plugin Architecture (Operators)
- Every operator is a plugin
- Operators implement `IOperator` interface
- `OperatorRegistry` discovers and manages operators
- Add new operators without touching core code

**Why:** Extensibility without complexity
**Why not hardcode:** Every new operator would touch core code

### 2. JSON-First Design
- Pipes are JSON documents
- Portable, version-controllable, shareable
- Users own their data

**Why:** Portability and user ownership
**Why not DB-only:** No export/import, vendor lock-in

### 3. Event-Driven Execution
- Pipes execute asynchronously via Bull queues
- Supports scheduled, manual, and webhook triggers
- Retry logic built-in

**Why:** Pipes can take minutes, can't block HTTP
**Why not synchronous:** Timeouts, no retry, poor UX

### 4. Sharded Database
- Shard by user_id hash
- Horizontal scaling for 1M+ users

**Why:** Scale requirement
**Why not single DB:** Works until ~100K users, then rewrite

### 5. Type Safety
- TypeScript everywhere
- Interfaces for all data structures
- Strict mode enabled

**Why:** Catch errors at compile time
**Why not JavaScript:** Runtime errors, harder to maintain

## Security Principles

### Defense in Depth (Phase 3 - COMPLETED)
1. **Input Validation** - Sanitize all user inputs ✅
2. **Domain Whitelist** - Only approved APIs in Fetch operator ✅
3. **Resource Limits** - Max time, memory, API calls ✅
4. **Rate Limiting** - Prevent abuse ✅
5. **Secrets Management** - AES-256-GCM encrypted, never exposed ✅
6. **Audit Logging** - Track all security events ✅

### Secrets Management (Phase 3 - COMPLETED)
- Secrets encrypted at rest with AES-256-GCM
- Secret references in pipe definitions (never actual values)
- Pre-execution validation of all secret references
- Secrets removed when pipes are forked
- Export warns about secrets reconfiguration
- All secret operations logged (create, access, delete)
- Secrets never returned in API responses
- Secrets never logged (only IDs)

### Pipe Forge Canvas (Phase 5 - COMPLETED)
Key architectural decisions for the true visual pipe editing experience:

**Schema Propagation:**
- Preview button on source operators fetches sample data
- SchemaExtractor service extracts field paths (including nested via dot notation)
- Schema stored in Redux and propagated to downstream operators
- Field dropdowns auto-populate from upstream schema
- Fallback to manual text input when schema unavailable

**Inline Configuration:**
- All operator config embedded in node body (no side panel)
- OperatorConfigPanel.tsx to be removed
- Each operator type has dedicated InlineConfig component
- Config changes save immediately to Redux

**Single Input Per Operator:**
- No merging/joining (simplifies execution model)
- Connection validation rejects second input
- Cycle detection prevents circular connections

**Tree-Based Execution:**
- "Run Selected" traces upstream via BFS
- Builds subgraph of target + all upstream nodes
- Executes in topological order
- Preserves intermediate results on failure

**Operator Categories:**
- Sources: Fetch JSON, CSV, RSS, Page
- User Inputs: Text, Number, URL, Date
- Operators: Filter, Sort, Unique, Truncate, Tail, Rename, Transform
- String: Replace, Regex, Substring
- URL: URL Builder

### Abuse Prevention
- Monitor for suspicious patterns
- Flag/report system for public pipes
- Admin review for high-risk operators
- Rate limits on executions

### Anonymous User Limits
- Can create pipes (stored in localStorage as drafts)
- Can execute pipes up to 5 times (tracked in localStorage)
- After 5 executions, show signup prompt
- Can fork public pipes (stored locally)
- Max 5 drafts in localStorage (auto-cleanup after 30 days)
- Warning when pipes are only stored locally
- "Sign up to save permanently" button visible
- Editor state preserved during auth flow

### Draft Management
- Drafts are always private (enforced backend + frontend)
- Max 5 drafts per authenticated user
- Drafts only visible on owner's profile page
- Drafts excluded from Browse Pipes, Trending, Featured
- Can publish drafts as Public or Private
- Can delete drafts with confirmation
- No auto-save - manual save only (user control)

## OOP Principles

### Single Responsibility
- Each class has one job
- `PipeService` = CRUD only
- `ExecutionService` = Orchestration only
- `OperatorRegistry` = Plugin management only

### Open/Closed Principle
- Open for extension (new operators)
- Closed for modification (core doesn't change)

### Dependency Injection
- Services receive dependencies via constructor
- Easy to test, easy to swap implementations

### Interface Segregation
- Small, focused interfaces
- `IOperator`, `IPipeService`, `IExecutionService`

## Naming Conventions

### Code
- **Classes**: PascalCase (`PipeExecutor`, `FilterOperator`)
- **Interfaces**: PascalCase with `I` prefix (`IPipeDefinition`, `IOperator`)
- **Functions**: camelCase (`executePipe`, `validateConfig`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_EXECUTION_TIME`, `DEFAULT_TIMEOUT`)
- **Files**: kebab-case (`pipe-executor.ts`, `filter-operator.ts`)

### Database
- **Tables**: snake_case, plural (`pipes`, `executions`)
- **Columns**: snake_case (`user_id`, `created_at`)
- **Indexes**: `idx_{table}_{column}` (`idx_pipes_user_id`)

### API
- RESTful, kebab-case (`/api/pipes`, `/api/executions`)
- Versioned (`/api/v1/pipes`)

## What We're NOT Building

- ❌ Collaborative real-time editing (too complex)
- ❌ Time travel debugging (nice to have, not MVP)
- ❌ Federated execution (over-engineered)
- ❌ Pipe testing framework (can add later)
- ❌ Advanced analytics dashboard (can add later)
- ❌ A/B testing (not needed for resurrection)
- ❌ Comments on pipes (add later)
- ❌ Ratings/reviews (add later)
- ❌ Personalized timeline/feed (add later)
- ❌ Notifications (likes, forks, etc. - add later)
- ❌ Merge/Join operators (complex, add in Phase 9)
- ❌ Loop/Iterate operators (complex, add in Phase 9)
- ❌ Conditional operators (if/else - add in Phase 9)
- ❌ Custom JavaScript operators (security risk, add later)
- ⏳ RSS/XML support (Phase 5 - IN PROGRESS via Fetch RSS operator)
- ❌ Scheduled execution (add in Phase 7)
- ❌ Pipe templates/marketplace (add later)
- ❌ Export to code (add later)
- ✅ Email verification (Phase 4 - COMPLETED via SendGrid)
- ✅ Password reset (Phase 4 - COMPLETED via SendGrid)
- ✅ Email typo detection (Phase 4 - COMPLETED)
- ❌ Two-factor authentication (can add later)
- ❌ Other OAuth providers (GitHub, Twitter) (can add later)
- ❌ Account deletion (can add later)
- ❌ Password change (can add later)

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- ReactFlow for visual editor
- Redux Toolkit for state management
- Vite for build tooling

### Backend
- Node.js 20+ with TypeScript
- Express for API server
- PostgreSQL for data storage
- Redis for caching and rate limiting
- Bull for job queues
- bcrypt for password hashing
- jsonwebtoken for authentication
- SendGrid for transactional emails (verification, password reset)

### Deployment
- Environment-agnostic (12-factor app)
- All config via environment variables
- Stateless (horizontal scaling)
- Docker support (optional)

## Performance Targets

- Page load: < 2 seconds
- Pipe save: < 500ms
- Execution start: < 1 second
- API response: < 200ms (p95)
- Support 1M concurrent users (with sharding)
- Pipe execution: < 5 seconds for simple workflows
- Sync execution: < 30 seconds
- Async execution: < 5 minutes (with timeout)

## Resource Limits

- Max execution time: 5 minutes (async), 30 seconds (sync)
- Max JSON response size: 1MB per operator output
- Max operators per pipe: 50
- Concurrent executions per user: 3
- Fetch operator timeout: 30 seconds
- Fetch operator rate limit: 10 requests per minute per user

## Scalability Strategy

### Horizontal Scaling
- Stateless API servers (scale with load balancer)
- Multiple Bull workers (scale with queue depth)
- Database sharding (scale with user growth)
- Redis cluster (scale with cache needs)

### Vertical Scaling
- PostgreSQL read replicas (scale reads)
- Connection pooling (efficient resource use)
- Query optimization (indexes, explain plans)

## Monitoring & Observability

### Metrics
- Execution success rate
- Average execution time
- API error rates
- System resource usage

### Logging
- Structured logs (JSON)
- Execution traces (trace_id)
- Error tracking (Sentry or similar)
- Audit logs (who did what when)

### Alerting
- Execution failure rate > 10%
- Average execution time > 2x baseline
- External API errors
- System resource exhaustion

## Development Workflow

1. **Spec First** - Write requirements, design, tasks
2. **Incremental** - Build in small chunks
3. **Test** - Validate each chunk
4. **Review** - Check against principles
5. **Iterate** - Refine based on feedback

## User Experience Patterns

### Try Before Signup
- Like GitHub - browse without signing in
- Anonymous users can create pipes (localStorage)
- Anonymous users can execute pipes (5 execution limit)
- Sign up only when needed (save permanently or after 5 executions)
- Reduces barrier to entry significantly

### Local Pipe Migration
- After registration, migrate local pipes to account
- Check localStorage for pipes
- Save them to database
- Clear localStorage
- Show success message: "Your pipes have been saved!"

### Discovery & Social
- Tags/categories for pipes
- Like/unlike pipes
- Usage count tracking
- Trending pipes (last 7 days)
- Featured pipes
- Consolidated profile page (own pipes + drafts)
- User profiles (view other users' public pipes)
- Search by name, description, tags
- Sort by popular/recent/most used
- Version history (last 5 versions, restore)
- Fork pipes (authenticated users only, secrets removed)

### Secrets in Pipes (Phase 3 - COMPLETED)
- Users can store encrypted API keys and tokens
- Fetch operator supports secret references for authentication
- Secrets validated before pipe execution
- Forked pipes have secret references removed
- Exported pipes warn about secrets reconfiguration
- All secret operations are audit logged

## Critical Reminders

- **Spec first, code second** - Never code without a spec
- **Simple over clever** - Yahoo Pipes was simple, keep it that way
- **No feature creep** - Only implement what's in the spec
- **Type safety** - No `any` types
- **Validate everywhere** - At every boundary
- **One thing per component** - Single responsibility
- **Question everything** - Why this? Why not simpler?
