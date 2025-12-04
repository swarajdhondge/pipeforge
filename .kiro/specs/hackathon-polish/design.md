# Hackathon Polish - Technical Design

## Overview

Technical design for implementing the hackathon polish requirements. Organized by system component.

---

## 1. Smart URL Detection System

### 1.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    URL Input (User pastes)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    URL Pattern Matcher                       │
│  - Regex patterns for each supported source                 │
│  - Returns: { source, convertedUrl, fetchType }             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Fetch Operator                            │
│  - Uses convertedUrl for actual fetch                       │
│  - Shows hint to user about conversion                      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 URL Pattern Definitions

**File**: `frontend/src/utils/url-converter.ts`

```typescript
interface UrlConversion {
  source: string;
  pattern: RegExp;
  convert: (match: RegExpMatchArray) => string;
  fetchType: 'json' | 'rss' | 'html';
  hint: string;
}

const URL_PATTERNS: UrlConversion[] = [
  {
    source: 'Medium',
    pattern: /^https?:\/\/(www\.)?medium\.com\/@([^\/]+)/,
    convert: (m) => `https://medium.com/feed/@${m[2]}`,
    fetchType: 'rss',
    hint: 'Detected Medium profile - using RSS feed'
  },
  {
    source: 'Reddit',
    pattern: /^https?:\/\/(www\.)?reddit\.com\/r\/([^\/]+)/,
    convert: (m) => `https://reddit.com/r/${m[2]}.json`,
    fetchType: 'json',
    hint: 'Detected Reddit - using JSON API'
  },
  {
    source: 'DEV.to',
    pattern: /^https?:\/\/(www\.)?dev\.to\/([^\/]+)$/,
    convert: (m) => `https://dev.to/api/articles?username=${m[2]}`,
    fetchType: 'json',
    hint: 'Detected DEV.to profile - using API'
  },
  {
    source: 'GitHub User',
    pattern: /^https?:\/\/(www\.)?github\.com\/([^\/]+)$/,
    convert: (m) => `https://api.github.com/users/${m[2]}/repos?sort=updated`,
    fetchType: 'json',
    hint: 'Detected GitHub user - fetching repositories'
  },
  {
    source: 'GitHub Repo',
    pattern: /^https?:\/\/(www\.)?github\.com\/([^\/]+)\/([^\/]+)$/,
    convert: (m) => `https://api.github.com/repos/${m[2]}/${m[3]}`,
    fetchType: 'json',
    hint: 'Detected GitHub repo - fetching details'
  },
  {
    source: 'Hacker News',
    pattern: /^https?:\/\/(www\.)?news\.ycombinator\.com/,
    convert: () => `https://hacker-news.firebaseio.com/v0/topstories.json`,
    fetchType: 'json',
    hint: 'Detected Hacker News - fetching top stories'
  },
  {
    source: 'Wikipedia',
    pattern: /^https?:\/\/(\w+)\.wikipedia\.org\/wiki\/([^#?]+)/,
    convert: (m) => `https://${m[1]}.wikipedia.org/api/rest_v1/page/summary/${m[2]}`,
    fetchType: 'json',
    hint: 'Detected Wikipedia - fetching article summary'
  }
];
```

### 1.3 Integration Points

**FetchJSONInlineConfig.tsx**:
- Add `onUrlChange` handler that calls `convertUrl()`
- Show conversion hint below input
- Store both original and converted URL

**Backend Domain Whitelist** (`backend/src/config/domain-whitelist.ts`):
```typescript
export const WHITELISTED_DOMAINS = [
  // Existing
  'jsonplaceholder.typicode.com',
  'api.github.com',
  // New additions
  'medium.com',
  'reddit.com',
  'dev.to',
  'news.ycombinator.com',
  'hacker-news.firebaseio.com',
  'en.wikipedia.org',
  'api.wikipedia.org',
];
```

---

## 2. User Privacy System

### 2.1 Database Changes

**Migration**: `011_add_username_slug.sql`
```sql
-- Add username column for URL slugs
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;

-- Add slug column for pipes
ALTER TABLE pipes ADD COLUMN slug VARCHAR(100);

-- Create index for username lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_pipes_slug ON pipes(slug);

-- Function to generate username from email
CREATE OR REPLACE FUNCTION generate_username(email VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN LOWER(SPLIT_PART(email, '@', 1));
END;
$$ LANGUAGE plpgsql;
```

### 2.2 Username Generation

**File**: `backend/src/services/user.service.ts`

```typescript
async generateUniqueUsername(email: string): Promise<string> {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  let username = base;
  let counter = 1;
  
  while (await this.usernameExists(username)) {
    username = `${base}${counter}`;
    counter++;
  }
  
  return username;
}
```

### 2.3 API Response Sanitization

**File**: `backend/src/middleware/sanitize-response.ts`

```typescript
// Remove sensitive fields from API responses
const SENSITIVE_FIELDS = ['email', 'password_hash', 'verification_token'];

export const sanitizeUser = (user: User, isOwnProfile: boolean): PublicUser => ({
  id: user.id, // Keep for internal use
  username: user.username,
  displayName: user.name || user.username,
  avatarUrl: user.avatar_url,
  bio: user.bio,
  ...(isOwnProfile && { email: user.email }), // Only show email on own profile
  createdAt: user.created_at,
});
```

### 2.4 URL Structure Changes

| Current | New |
|---------|-----|
| `/profile/:userId` | `/profile/:username` |
| `/pipes/:pipeId` | `/pipes/:slug` (fallback to ID) |

**Router Updates**:
```typescript
// Profile by username
router.get('/users/:username', async (req, res) => {
  const user = await userService.findByUsername(req.params.username);
  // ...
});

// Pipe by slug or ID
router.get('/pipes/:identifier', async (req, res) => {
  const pipe = await pipeService.findBySlugOrId(req.params.identifier);
  // ...
});
```

---

## 3. UI Component Updates

### 3.1 Navigation Bar Centering

**File**: `frontend/src/components/common/navigation-bar.tsx`

```tsx
// Current
<nav className="fixed top-0 left-0 right-0 z-50 bg-pipe-forge">
  <div className="max-w-7xl mx-auto px-4">
    {/* Logo left, links scattered */}
  </div>
</nav>

// Fixed
<nav className="fixed top-0 left-0 right-0 z-50 bg-pipe-forge">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center justify-between h-12">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <Logo className="h-6 w-6" />
        <span className="font-bold text-white">Pipe Forge</span>
      </Link>
      
      {/* Centered navigation */}
      <div className="flex items-center gap-6">
        <NavLink to="/pipes">Browse</NavLink>
        <NavLink to="/editor">Create</NavLink>
      </div>
      
      {/* Right side - user menu */}
      <div className="flex items-center gap-4">
        {/* User dropdown */}
      </div>
    </div>
  </div>
</nav>
```

### 3.2 Button Width Consistency

**File**: `frontend/src/components/common/Button.tsx`

Add size variants:
```typescript
const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm min-w-[80px]',
  md: 'px-4 py-2 text-sm min-w-[100px]',
  lg: 'px-6 py-3 text-base min-w-[120px]',
  full: 'px-4 py-2 text-sm w-full',
};
```

### 3.3 Fit View on Load

**File**: `frontend/src/pages/editor/components/EditorCanvas.tsx`

```typescript
// Add fitView on initial load and when pipe changes
useEffect(() => {
  if (nodes.length > 0) {
    // Small delay to ensure nodes are rendered
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 100);
  }
}, [pipeId]); // Trigger when pipe changes
```

---

## 4. Terminology Changes

### 4.1 Fork → Copy

**Files to Update**:
- `frontend/src/pages/pipe-detail-page.tsx`
- `frontend/src/components/pipes/PipeCard.tsx`
- `frontend/src/services/pipe-service.ts`
- `backend/src/routes/pipes.routes.ts`

**Changes**:
```typescript
// Button text
"Fork Pipe" → "Copy Pipe"

// API endpoint (keep for compatibility, add alias)
POST /pipes/:id/fork → POST /pipes/:id/copy (alias)

// Success message
"Pipe forked successfully" → "Pipe copied to your account"

// Icon: Keep the same (copy icon works)
```

---

## 5. Page Designs

### 5.1 Home Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Navigation Bar                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hero Section                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  "Build Data Pipelines Visually"                     │   │
│  │  [Get Started Free]  [Browse Templates]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Visual Demo (Static screenshot or GIF)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Editor preview image]                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  3 Key Features (Icons + short text)                        │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                 │
│  │ Connect   │ │ Transform │ │ Automate  │                 │
│  │ Any API   │ │ Your Data │ │ Workflows │                 │
│  └───────────┘ └───────────┘ └───────────┘                 │
│                                                             │
│  "Popular Sources" (logos: Reddit, Medium, GitHub, etc.)    │
│                                                             │
│  CTA Section                                                │
│  "Start building in seconds - no signup required"           │
│  [Try the Editor]                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Footer                                                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Browse Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Navigation Bar                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Search Bar (prominent)                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 Search pipes by name, description, or tag...      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Filter Tabs: [All] [Templates] [Community]                 │
│                                                             │
│  ── Templates ──────────────────────────────────────────   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Reddit  │ │ Medium  │ │ GitHub  │ │ HN      │          │
│  │ Reader  │ │ Digest  │ │ Repos   │ │ Stories │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  ── Trending This Week ─────────────────────────────────   │
│  (3-4 pipe cards with run count, copy count)                │
│                                                             │
│  ── Recently Created ───────────────────────────────────   │
│  (6 pipe cards, paginated)                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Footer                                                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Settings Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Navigation Bar                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Settings                                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Profile                                              │   │
│  │ ┌─────┐                                              │   │
│  │ │ 👤  │  Display Name: [Kate        ]               │   │
│  │ └─────┘  Bio: [Short bio here...    ]               │   │
│  │          [Change Picture]                            │   │
│  │                                        [Save]        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Account                                              │   │
│  │ Email: kate@gmail.com (verified ✓)                   │   │
│  │ [Change Password]                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Danger Zone                                          │   │
│  │ [Delete Account] - This cannot be undone             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Template Pipes

### 6.1 Template Definitions

**File**: `backend/src/scripts/seed-templates.ts`

Each template includes:
- Pre-configured operators
- Helpful inline comments
- Default values that work out of the box
- Placeholder text showing where to customize

### 6.2 Template: Reddit Feed Reader

```json
{
  "name": "📱 Reddit Feed Reader",
  "description": "Fetch and filter posts from any subreddit",
  "is_template": true,
  "definition": {
    "nodes": [
      {
        "id": "fetch-1",
        "type": "fetch-json",
        "data": {
          "label": "Fetch Subreddit",
          "config": {
            "url": "https://reddit.com/r/programming.json",
            "_hint": "Change 'programming' to any subreddit"
          }
        }
      },
      {
        "id": "transform-1",
        "type": "transform",
        "data": {
          "label": "Extract Posts",
          "config": {
            "path": "data.children",
            "mappings": [
              { "source": "data.title", "target": "title" },
              { "source": "data.score", "target": "score" },
              { "source": "data.url", "target": "link" }
            ]
          }
        }
      },
      {
        "id": "sort-1",
        "type": "sort",
        "data": {
          "label": "Sort by Score",
          "config": { "field": "score", "direction": "desc" }
        }
      },
      {
        "id": "truncate-1",
        "type": "truncate",
        "data": {
          "label": "Top 10",
          "config": { "count": 10 }
        }
      },
      {
        "id": "output-1",
        "type": "pipe-output",
        "data": { "label": "Output" }
      }
    ],
    "edges": [
      { "source": "fetch-1", "target": "transform-1" },
      { "source": "transform-1", "target": "sort-1" },
      { "source": "sort-1", "target": "truncate-1" },
      { "source": "truncate-1", "target": "output-1" }
    ]
  }
}
```

---

## 7. Logo Design

### 7.1 Logo Concept

Simple pipe/flow icon:
- Two connected nodes with an arrow
- Uses brand gradient (purple → blue)
- Works at 16x16 (favicon) and larger sizes

### 7.2 Implementation

**File**: `frontend/src/components/common/Logo.tsx`

```tsx
export const Logo: FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6B4C9A" />
        <stop offset="100%" stopColor="#4A90D9" />
      </linearGradient>
    </defs>
    {/* Two connected circles with arrow */}
    <circle cx="6" cy="12" r="4" fill="url(#logo-gradient)" />
    <circle cx="18" cy="12" r="4" fill="url(#logo-gradient)" />
    <path d="M10 12h4m0 0l-2-2m2 2l-2 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
```

---

## 8. Testing Strategy

### 8.1 Backend Tests

| Feature | Test File | Coverage |
|---------|-----------|----------|
| URL Conversion | `url-converter.test.ts` | All patterns |
| Username Generation | `user.service.test.ts` | Unique generation |
| Profile API | `users.routes.test.ts` | Privacy, CRUD |
| Delete Account | `auth.routes.test.ts` | Full deletion |

### 8.2 Manual Testing Checklist

- [ ] Paste Medium URL → converts to RSS
- [ ] Paste Reddit URL → converts to JSON
- [ ] Profile shows username, not email
- [ ] Profile URLs use username slug
- [ ] Copy Pipe works (formerly Fork)
- [ ] Templates appear on Browse page
- [ ] Search returns relevant results
- [ ] Delete account removes all data

---

## 9. Migration Plan

### Phase 1: Database & Backend (No UI changes)
1. Add migration for username/slug columns
2. Backfill usernames from existing emails
3. Add new API endpoints (keep old ones working)

### Phase 2: URL Conversion
1. Add url-converter utility
2. Integrate into Fetch operators
3. Update domain whitelist

### Phase 3: UI Updates
1. Navigation bar centering
2. Button consistency
3. Page layouts (home, browse, settings)

### Phase 4: Templates & Content
1. Seed template pipes
2. Update Browse page sections
3. Help page content

### Phase 5: Final Polish
1. Logo integration
2. Terminology updates (fork → copy)
3. Full testing pass

