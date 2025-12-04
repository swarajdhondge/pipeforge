---
inclusion: always
---

# Development Process

## Spec-Driven Development

Every feature MUST have a spec before any code is written.

### Spec Structure

```
specs/{feature-name}/
├─ requirements.md  (What we're building and why)
├─ design.md        (How we're building it)
└─ tasks.md         (Step-by-step implementation)
```

### Requirements Document

Must answer:
- What problem are we solving?
- Who is this for?
- What are the acceptance criteria?
- What are we NOT building?
- Why this feature? (ties to Yahoo Pipes resurrection)

### Design Document

Must include:
- System architecture changes
- Database schema changes
- API endpoints (request/response)
- Component hierarchy (frontend)
- Class/interface definitions (backend)
- Security considerations
- Performance implications

### Tasks Document

Must include:
- Ordered list of implementation steps
- Each task is small (< 2 hours)
- Clear definition of done
- Dependencies between tasks

## Development Phases

### Phase 1: Foundation (Week 1)
**Goal:** User management and authentication

Features:
- User registration/login
- JWT authentication
- Database schema
- Basic API structure

### Phase 2: Core Pipe Engine (Week 2) - COMPLETED
**Goal:** Create and save pipes visually

Features:
- ✅ Visual pipe editor (ReactFlow)
- ✅ Save/load pipes (JSON)
- ✅ Operator registry system
- ✅ Basic operators (Fetch, Filter, Sort, Transform)
- ✅ Operator palette (drag & drop)
- ✅ Operator configuration panel
- ✅ Canvas interactions (zoom, pan, undo/redo)
- ✅ Manual save (Save as Draft / Publish Pipe)
- ✅ Draft management (max 5 per user)
- ✅ Version history (last 5 versions, restore)
- ✅ Public/private pipes
- ✅ Browse/search/filter pipes
- ✅ Fork pipes
- ✅ Like/unlike pipes
- ✅ Trending and featured pipes
- ✅ Consolidated profile page

### Phase 3: Advanced Security (Week 2-3) - COMPLETED
**Goal:** Make platform safe and secure

Features:
- ✅ Secrets management (AES-256-GCM encryption)
- ✅ Secret references in Fetch operator
- ✅ Domain whitelist for Fetch
- ✅ Security audit logging
- ✅ Pre-execution secret validation
- ✅ Fork removes secret references
- ✅ Export warns about secrets
- ✅ Backward compatibility verified

### Phase 4: UI Polish (Week 3-4) - COMPLETED
**Goal:** Production-ready, demo-quality UI

Features:
- ✅ Loading states and skeletons
- ✅ Empty states with helpful CTAs
- ✅ User-friendly error messages
- ✅ Toast notifications
- ✅ Onboarding flow for new users
- ✅ Demo pipes and templates
- ✅ Keyboard shortcuts
- ✅ Responsive design improvements
- ✅ Accessibility enhancements
- ✅ Reusable UI components
- ✅ Fixed navbar spacing across all pages
- ✅ Email verification system (SendGrid with verified domain)
- ✅ Password reset flow (1-hour token expiry)
- ✅ Email typo detection (Gmail, Yahoo, Hotmail, Outlook, iCloud)
- ✅ Session expiry handling
- ✅ Unverified account cleanup (48 hours)
- ✅ SQL parameterized query fixes
- ✅ All 53 backend endpoint tests passing

### Phase 5: Pipe Forge Canvas (Week 4-5) - COMPLETED
**Goal:** True visual pipe editing experience with dynamic schema propagation and inline configuration

Features:
- ⏳ Dynamic schema propagation (preview → extract fields → populate dropdowns)
- ⏳ Inline operator configuration (remove side panel, config embedded in nodes)
- ⏳ Source operators (Fetch JSON, CSV, RSS, Page)
- ⏳ User Input operators (Text, Number, URL, Date)
- ⏳ Enhanced Filter (Permit/Block, any/all, dynamic field dropdowns)
- ⏳ Enhanced Sort (dynamic field dropdowns)
- ⏳ New operators (Unique, Truncate, Tail, Rename)
- ⏳ URL Builder operator
- ⏳ String operators (Replace, Regex, Substring)
- ⏳ Tree-based execution engine ("Run Selected" traces upstream)
- ⏳ Operator palette organization by category
- ⏳ Pipe Output node
- ⏳ Connection validation (single input, no cycles)
- ⏳ Production security (no source maps, minified)

### Phase 6: Execution Enhancements (Week 5-6)
**Goal:** Enhanced execution experience

Features:
- WebSocket for live updates
- Enhanced execution history
- Execution retry with backoff
- Execution cancellation

### Phase 7: Scheduling (Week 6-7)
**Goal:** Automated pipe execution

Features:
- Cron scheduling
- Enable/disable schedules
- Execution logs

### Phase 8: AI Integration (Post-MVP)
**Goal:** AI-powered pipe creation

Features:
- Natural language pipe creation
- Smart operator suggestions
- Auto-fix common errors

### Phase 9: Advanced Operators (Post-MVP)
**Goal:** Extended operator capabilities

Features:
- Merge operator (combine multiple sources)
- Join operator (SQL-like joins)
- Loop operator (iterate over arrays)
- Conditional operator (if/else logic)

## Coding Standards

### TypeScript

```typescript
// ✅ Good: Clear types, single responsibility
interface IPipeService {
  create(userId: string, pipe: PipeDefinition): Promise<Pipe>;
  get(pipeId: string, userId: string): Promise<Pipe>;
  update(pipeId: string, userId: string, pipe: PipeDefinition): Promise<Pipe>;
  delete(pipeId: string, userId: string): Promise<void>;
}

class PipeService implements IPipeService {
  constructor(private db: Database) {}
  
  async create(userId: string, pipe: PipeDefinition): Promise<Pipe> {
    // Implementation
  }
}

// ❌ Bad: No types, multiple responsibilities
class PipeManager {
  async doEverything(data: any): Promise<any> {
    // Too much in one method
  }
}
```

### Error Handling

```typescript
// ✅ Good: Specific error types
class PipeNotFoundError extends Error {
  constructor(pipeId: string) {
    super(`Pipe ${pipeId} not found`);
    this.name = 'PipeNotFoundError';
  }
}

// ✅ Good: Try-catch with specific handling
try {
  const pipe = await pipeService.get(pipeId, userId);
} catch (error) {
  if (error instanceof PipeNotFoundError) {
    return res.status(404).json({ error: 'Pipe not found' });
  }
  throw error; // Re-throw unexpected errors
}

// ❌ Bad: Silent failures
try {
  await pipeService.get(pipeId, userId);
} catch (error) {
  // Swallowing errors
}
```

### Validation

```typescript
// ✅ Good: Validate at boundaries
function validatePipeDefinition(pipe: unknown): PipeDefinition {
  if (!pipe || typeof pipe !== 'object') {
    throw new ValidationError('Invalid pipe definition');
  }
  
  const { nodes, edges } = pipe as any;
  
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new ValidationError('Nodes and edges must be arrays');
  }
  
  // More validation...
  
  return pipe as PipeDefinition;
}

// ❌ Bad: Assume data is valid
function savePipe(pipe: any) {
  // No validation, will fail at runtime
  db.save(pipe);
}
```

### Naming

```typescript
// ✅ Good: Clear, descriptive names
async function executePipeWithRetry(
  pipeId: string,
  maxRetries: number = 3
): Promise<ExecutionResult> {
  // Implementation
}

// ❌ Bad: Unclear names
async function doIt(id: string, n: number): Promise<any> {
  // What does this do?
}
```

## Git Workflow

### Branch Naming
- `feature/{feature-name}` - New features
- `fix/{bug-description}` - Bug fixes
- `refactor/{component-name}` - Code refactoring
- `docs/{doc-name}` - Documentation updates

### Commit Messages
```
feat: add user registration endpoint
fix: prevent duplicate pipe names
refactor: extract operator validation logic
docs: update API documentation
```

### Pull Request Process
1. Create feature branch from `main`
2. Implement feature (following spec)
3. Test locally
4. Create PR with description
5. Review against spec
6. Merge to `main`

## Testing Strategy

### Unit Tests
- Test individual functions/methods
- Mock external dependencies
- Fast execution (< 1 second)

### Integration Tests
- Test API endpoints
- Use test database
- Test operator execution

### Manual Testing
- Test UI flows
- Test edge cases
- Test error scenarios

## Code Review Checklist

- [ ] Follows spec requirements
- [ ] TypeScript strict mode (no `any`)
- [ ] Error handling implemented
- [ ] Input validation at boundaries
- [ ] Security considerations addressed
- [ ] Performance acceptable
- [ ] Code is readable and maintainable
- [ ] No hardcoded values (use env vars)
- [ ] Logging added for debugging
- [ ] Comments for complex logic only

## Core Rules (Anti-Hallucination)

### Rule 1: Spec is Law
**NEVER write code without a spec.** If spec is missing or unclear, STOP and ask.

### Rule 2: No Feature Creep
**Only implement what's in the spec.** No additions, no "improvements", no refactoring unrelated code.

### Rule 3: One Task at a Time
**Complete current task before moving to next.** Don't jump ahead, don't combine tasks.

### Rule 4: No `any` Types
**All types must be explicit.** If you don't know the type, define it properly.

### Rule 5: Validate Everything
**Validate at every boundary.** API endpoints, service methods, database queries.

### Rule 6: Handle All Errors
**Every operation can fail.** Use try-catch, specific error types, proper propagation.

### Rule 7: Single Responsibility
**Each component does ONE thing.** If it does multiple things, split it.

### Rule 8: Test Your Work
**Don't assume it works.** Test happy path, error cases, edge cases.

## When to Stop and Ask

Stop immediately if:
- Spec is unclear or incomplete
- You're adding features not in spec
- You discover a security issue
- Implementation is more complex than expected
- You need to change something outside current task

## Documentation

### Code Comments
- Only for complex logic
- Explain "why", not "what"
- Keep comments up to date

### API Documentation
- Document all endpoints
- Include request/response examples
- Document error codes
- Keep in sync with code

### README
- Setup instructions
- Environment variables
- Development workflow
- Deployment guide

## Environment Management

### Local Development
```bash
# .env.local
DATABASE_URL=postgresql://localhost:5432/pipes_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-change-in-production
NODE_ENV=development
```

### Production
```bash
# .env.production (never commit)
DATABASE_URL=postgresql://prod-host:5432/pipes_prod
REDIS_URL=redis://prod-host:6379
JWT_SECRET=<strong-random-secret>
NODE_ENV=production
```

### Required Environment Variables
See `.env.example` for complete list

## Deployment Checklist

- [ ] All tests pass
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Secrets properly encrypted
- [ ] Rate limiting configured
- [ ] Monitoring enabled
- [ ] Error tracking enabled
- [ ] Backup strategy in place
- [ ] Rollback plan documented

## Performance Guidelines

### Database
- Use indexes for frequently queried columns
- Limit query results (pagination)
- Use connection pooling
- Avoid N+1 queries

### API
- Cache frequently accessed data (Redis)
- Use compression (gzip)
- Implement rate limiting
- Return minimal data (no over-fetching)

### Frontend
- Lazy load components
- Debounce user inputs
- Optimize images
- Minimize bundle size

## Security Guidelines

### Authentication
- Hash passwords (bcrypt, 10+ rounds)
- Use JWT with short expiry (1 hour)
- Implement refresh tokens (7 days for "remember me")
- Rate limit login attempts (5 attempts per minute per IP)
- Google OAuth for social login
- Session persists across page refreshes

### Authorization
- Verify user owns resource
- Check permissions on every request
- Never trust client-side data
- Anonymous users: 5 execution limit (tracked in localStorage)
- Authenticated users: unlimited executions

### Input Validation
- Sanitize all user inputs
- Validate against schemas
- Reject invalid data early
- Use parameterized queries (prevent SQL injection)

### Secrets
- Never commit secrets to git
- Use environment variables
- Encrypt secrets at rest (AES-256-GCM)
- Rotate secrets regularly
- Never return decrypted secrets in API responses
- Never log secrets

### Fetch Operator Security
- 30-second timeout
- Rate limiting (10 requests per minute per user)
- No localhost/private IPs (domain whitelist)
- Max response size: 1MB

## Monitoring

### Metrics to Track
- Request rate (requests/second)
- Error rate (errors/total requests)
- Response time (p50, p95, p99)
- Database query time
- Queue depth (Bull)
- Memory usage
- CPU usage

### Logs to Capture
- All API requests (method, path, status, duration)
- All errors (stack trace, context)
- All executions (pipe_id, status, duration)
- All authentication attempts (success/failure)

### Alerts to Configure
- Error rate > 5%
- Response time p95 > 1 second
- Queue depth > 1000
- Database connections > 80% of pool
- Memory usage > 80%
- Disk usage > 80%
