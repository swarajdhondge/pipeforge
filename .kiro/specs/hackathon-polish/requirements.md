# Hackathon Polish - Requirements

## Overview

Final polish pass for Pipe Forge to make it hackathon-winning quality. Focuses on:
- Smart URL detection (paste any link, it just works)
- User privacy (hide emails, secure user data)
- Professional UI/UX polish
- New data source templates

---

## FR-1: Smart URL Detection & Auto-Conversion

### FR-1.1: Intelligent URL Parser
- **GIVEN** a user pastes any URL into a Fetch operator
- **WHEN** the URL matches a known pattern (Medium, Reddit, HN, DEV.to, etc.)
- **THEN** the System SHALL automatically convert it to the appropriate API/RSS URL
- **AND** display a hint showing the conversion

### FR-1.2: Supported URL Patterns

| User Pastes | System Converts To | Type |
|-------------|-------------------|------|
| `medium.com/@user` | `medium.com/feed/@user` | RSS |
| `medium.com/@user/article-slug` | `medium.com/feed/@user` | RSS |
| `reddit.com/r/programming` | `reddit.com/r/programming.json` | JSON |
| `reddit.com/r/sub/comments/id` | `reddit.com/r/sub/comments/id.json` | JSON |
| `dev.to/username` | `dev.to/api/articles?username=username` | JSON |
| `news.ycombinator.com` | `hacker-news.firebaseio.com/v0/topstories.json` | JSON |
| `github.com/user/repo` | `api.github.com/repos/user/repo` | JSON |
| `github.com/user` | `api.github.com/users/user/repos` | JSON |
| `wikipedia.org/wiki/Article` | `en.wikipedia.org/api/rest_v1/page/summary/Article` | JSON |

### FR-1.3: URL Conversion Feedback
- **WHEN** a URL is auto-converted
- **THEN** the System SHALL show a subtle toast: "✨ Detected Medium blog - using RSS feed"
- **AND** the input field SHALL show the converted URL with option to see original

### FR-1.4: Domain Whitelist Update
- **GIVEN** the domain whitelist configuration
- **THEN** the System SHALL include all supported source domains:
  - `medium.com`
  - `reddit.com`
  - `dev.to`
  - `news.ycombinator.com`
  - `hacker-news.firebaseio.com`
  - `api.github.com`
  - `github.com`
  - `en.wikipedia.org`
  - `*.wikipedia.org`

---

## FR-2: User Privacy & Security

### FR-2.1: Email Hiding
- **GIVEN** any page except the user's own profile settings
- **THEN** the System SHALL NOT display the user's email address
- **AND** SHALL display the user's display name instead

### FR-2.2: Default Display Name from Email
- **WHEN** a new user registers with email `kate@gmail.com`
- **THEN** the System SHALL set default display name to `kate`
- **AND** the user can change this later in settings

### FR-2.3: URL Slugs Instead of IDs
- **GIVEN** a user profile URL
- **THEN** the System SHALL use `/profile/username` instead of `/profile/uuid`
- **AND** pipe URLs SHALL use `/pipes/pipe-slug` instead of `/pipes/uuid`

### FR-2.4: Hide Internal IDs
- **GIVEN** any public-facing page or API response
- **THEN** the System SHALL NOT expose internal UUIDs to users
- **AND** SHALL use slugs or display-friendly identifiers

### FR-2.5: Pipe Ownership Display
- **GIVEN** a pipe detail page
- **THEN** the System SHALL show "Created by @username" instead of user ID or email

---

## FR-3: UI Layout Fixes

### FR-3.1: Navigation Bar Centering
- **GIVEN** the main navigation bar
- **THEN** the navigation links SHALL be properly centered
- **AND** spacing SHALL be consistent across all viewport sizes

### FR-3.2: Button Width Consistency
- **GIVEN** any page with action buttons
- **THEN** buttons in the same row SHALL have consistent widths
- **AND** primary actions SHALL be visually prominent

### FR-3.3: Default Zoom/Fit View
- **GIVEN** a pipe is loaded in the editor (`/editor/:id`)
- **THEN** the canvas SHALL automatically fit all nodes in view
- **AND** maintain reasonable padding around edges

- **GIVEN** a pipe is displayed on the detail page (`/pipes/:id`)
- **THEN** the preview SHALL fit all nodes in view

### FR-3.4: Decluttered UI
- **GIVEN** any page in the application
- **THEN** the UI SHALL be clean, simple, and not overwhelming
- **AND** use whitespace effectively
- **AND** group related elements logically

---

## FR-4: Terminology & UX Improvements

### FR-4.1: Replace "Fork" with "Copy"
- **GIVEN** any UI text containing "fork" or "Fork"
- **THEN** the System SHALL display "Copy" or "Copy Pipe" instead
- **AND** button text SHALL read "Copy Pipe"
- **AND** success message SHALL read "Pipe copied successfully"

### FR-4.2: User-Friendly Labels
- **GIVEN** technical terms in the UI
- **THEN** the System SHALL use user-friendly alternatives:
  - "Execution" → "Run" or "Run History"
  - "Definition" → "Structure" or omit
  - "Nodes" → "Operators" or "Steps"

---

## FR-5: Page-Specific Polish

### FR-5.1: Home Page
- **GIVEN** the home page
- **THEN** the System SHALL display:
  - Clear value proposition
  - Visual demo/preview of the editor
  - "Get Started" CTA button
  - 3-4 key features (not overwhelming)
  - Sample pipes section (3 examples max)
- **AND** SHALL NOT display:
  - Cluttered feature lists
  - Technical jargon
  - Walls of text

### FR-5.2: Browse Page
- **GIVEN** the browse pipes page
- **THEN** the System SHALL display sections:
  - "Templates" - Pre-built starter pipes (top)
  - "Trending" - Most used this week
  - "Recent" - Newly created public pipes
- **AND** SHALL have:
  - Search bar (prominent, top)
  - Filter by source type (JSON, RSS, etc.)
- **AND** SHALL NOT display:
  - "Popular Pipes" section (redundant with Trending)

### FR-5.3: Profile Page
- **GIVEN** the user's own profile page
- **THEN** the System SHALL display:
  - Profile picture (or initials avatar)
  - Display name (editable)
  - Bio (optional, editable)
  - "My Pipes" tab
  - "Drafts" tab
  - Account settings link
- **AND** design SHALL be clean and professional

### FR-5.4: Settings Page
- **GIVEN** the settings page
- **THEN** the System SHALL have sections:
  - Profile (name, bio, avatar)
  - Account (email - read only, password change)
  - Preferences (future: theme, notifications)
  - Danger Zone (delete account)
- **AND** layout SHALL be organized with clear section headers

### FR-5.5: Contact/Support Page
- **GIVEN** the contact/support page
- **THEN** the System SHALL display:
  - GitHub issues link for bug reports
  - FAQ section with common questions
  - Email contact (if available)
- **AND** SHALL NOT have broken links or placeholder content

---

## FR-6: Templates & Examples

### FR-6.1: Pre-built Templates
- **GIVEN** the browse page "Templates" section
- **THEN** the System SHALL provide these starter templates:

| Template Name | Source | Description |
|---------------|--------|-------------|
| Reddit Feed Reader | reddit.com | Fetch and filter posts from any subreddit |
| Medium Blog Digest | medium.com | Get latest posts from a Medium author |
| Hacker News Top Stories | HN API | Fetch top stories with scores |
| DEV.to Articles | dev.to | Get articles by tag or author |
| GitHub Repo Stats | GitHub API | Fetch repo info and stats |
| Wikipedia Summary | Wikipedia | Get article summaries |

### FR-6.2: Template Usage
- **WHEN** a user clicks "Use Template"
- **THEN** the System SHALL:
  - Create a copy of the template in the user's account
  - Open it in the editor
  - Show inline hints for customization (e.g., "Change subreddit name here")

---

## FR-7: Help & Documentation

### FR-7.1: Help Page Content
- **GIVEN** the help page
- **THEN** the System SHALL include:
  - "Getting Started" guide (5 steps max)
  - "Keyboard Shortcuts" reference
  - "Supported Data Sources" list
  - "Operator Reference" (brief description of each)
  - Link to GitHub for detailed docs

### FR-7.2: Keyboard Shortcuts
- **GIVEN** the keyboard shortcuts reference
- **THEN** the System SHALL list:

| Action | Shortcut |
|--------|----------|
| Save Pipe | Ctrl/Cmd + S |
| Run Pipe | Ctrl/Cmd + Enter |
| Undo | Ctrl/Cmd + Z |
| Redo | Ctrl/Cmd + Shift + Z |
| Delete Selected | Delete/Backspace |
| Select All | Ctrl/Cmd + A |
| Fit View | Ctrl/Cmd + 0 |
| Zoom In | Ctrl/Cmd + + |
| Zoom Out | Ctrl/Cmd + - |

### FR-7.3: In-Editor Help
- **GIVEN** the editor page
- **THEN** the help icon (?) SHALL open a panel with:
  - Quick tips
  - Keyboard shortcuts
  - Link to full documentation

---

## FR-8: Search & Discovery

### FR-8.1: Search Functionality
- **GIVEN** the browse page search bar
- **WHEN** a user types a query
- **THEN** the System SHALL search:
  - Pipe names
  - Pipe descriptions
  - Tags
- **AND** results SHALL be ranked by relevance
- **AND** search SHALL be performant (< 500ms)

### FR-8.2: Trending Algorithm
- **GIVEN** the "Trending" section
- **THEN** the System SHALL rank pipes by:
  - Executions in last 7 days (weight: 40%)
  - Copies in last 7 days (weight: 30%)
  - Recent creation date (weight: 20%)
  - Like count (weight: 10%)
- **AND** refresh trending data every hour

---

## FR-9: Profile & Account Management

### FR-9.1: Profile Picture
- **GIVEN** the profile settings
- **THEN** the user SHALL be able to:
  - Upload a profile picture (max 2MB, jpg/png)
  - Remove profile picture
  - See avatar preview before saving
- **AND** images SHALL be stored in:
  - Development: Local filesystem
  - Production: Cloud storage (future)

### FR-9.2: Profile Fields
- **GIVEN** the profile settings
- **THEN** the user SHALL be able to edit:
  - Display name (required, 2-50 chars)
  - Bio (optional, max 200 chars)
  - Profile picture
- **AND** email SHALL be read-only (displayed but not editable)

### FR-9.3: Delete Account
- **GIVEN** the settings page "Danger Zone"
- **WHEN** a user clicks "Delete Account"
- **THEN** the System SHALL:
  - Show confirmation modal
  - Require typing "DELETE" to confirm
  - Delete all user data (pipes, drafts, profile)
  - Log user out
  - Show "Account deleted" message

---

## FR-10: Logo & Branding

### FR-10.1: Logo Design
- **GIVEN** the application header and favicon
- **THEN** the logo SHALL be:
  - Simple and recognizable
  - Work at small sizes (favicon)
  - Include a pipe/flow visual metaphor
  - Use brand colors (purple/blue gradient)

### FR-10.2: Logo Usage
- **GIVEN** any page header
- **THEN** the logo SHALL appear:
  - Left side of navigation bar
  - Favicon in browser tab
  - Open Graph image for social sharing

---

## NFR-1: Code Quality

### NFR-1.1: Professional Standards
- All code SHALL follow established patterns in the codebase
- No TODO comments left in production code
- Proper error handling for all user actions
- Consistent naming conventions

### NFR-1.2: Testing Requirements
- All new API endpoints SHALL have unit tests
- Critical UI flows SHALL be manually tested
- No regressions in existing functionality

### NFR-1.3: Performance
- Page load time SHALL be under 3 seconds
- Search results SHALL appear within 500ms
- Canvas operations SHALL be smooth (60fps)

---

## Out of Scope

The following are explicitly NOT included in this release:
- Dark mode
- Scheduled/automated runs
- Real-time collaboration
- AI-powered features
- Mobile phone support (< 768px)
- OAuth providers beyond existing (Google)
- Payment/subscription features

