# Pipe Forge Launch - Implementation Tasks

## Overview

Phased implementation plan for transforming Yahoo Pipes 2025 into Pipe Forge.

**Estimated Total Time**: 4-6 hours
**Priority**: All tasks are required for hackathon submission

---

## Phase 1: Rebrand to Pipe Forge (FR-1) ✅

**Estimated Time**: 45 minutes

### 1.1 Update Core Branding Files

- [x] 1.1.1 Update `frontend/index.html`
  - [x] Change `<title>` to "Pipe Forge"
  - [x] Update meta description

- [x] 1.1.2 Update `frontend/tailwind.config.js`
  - [x] Rename `yahoo-pipes` color to `pipe-forge`

- [x] 1.1.3 Update `frontend/src/index.css`
  - [x] Rename `.bg-yahoo-pipes` to `.bg-pipe-forge`
  - [x] Update any Yahoo references in comments

### 1.2 Update Components

- [x] 1.2.1 Update `frontend/src/components/common/navigation-bar.tsx`
  - [x] Change logo text from "Yahoo Pipes" to "Pipe Forge"
  - [x] Update CSS class `bg-yahoo-pipes` to `bg-pipe-forge`

- [x] 1.2.2 Update `frontend/src/components/common/Footer.tsx`
  - [x] Change brand name to "Pipe Forge"
  - [x] Update tagline to "Visual data pipelines for everyone"
  - [x] Update copyright text

- [x] 1.2.3 Update `frontend/src/components/common/WelcomeModal.tsx`
  - [x] Change any Yahoo references to Pipe Forge

### 1.3 Update Auth Pages

- [x] 1.3.1 Update `frontend/src/pages/login-page.tsx`
  - [x] Change heading to "Sign in to Pipe Forge"
  - [x] Update `AUTH_REDIRECT_KEY` constant

- [x] 1.3.2 Update `frontend/src/pages/register-page.tsx`
  - [x] Change heading to "Create your Pipe Forge account"

### 1.4 Update Home Page

- [x] 1.4.1 Update `frontend/src/pages/home-page.tsx`
  - [x] Update hero section text
  - [x] Update any Yahoo references

### 1.5 Update Remaining Files

- [x] 1.5.1 Search and replace in remaining files:
  - [x] `frontend/src/styles/design-tokens.ts`
  - [x] `frontend/src/utils/localStorage.ts`
  - [x] `frontend/src/store/slices/auth-slice.ts`
  - [x] `frontend/src/components/common/anonymous-banner.tsx`
  - [x] `frontend/src/components/editor/SelectableEdge.tsx` (comments)
  - [x] `frontend/src/components/editor/OperatorNode.tsx` (comments)
  - [x] Any test files with Yahoo references

### 1.6 Verification

- [x] 1.6.1 Run `grep -r "Yahoo" frontend/src/` and verify no user-visible references remain
- [x] 1.6.2 Run `grep -r "yahoo" frontend/src/` and update code references
- [x] 1.6.3 Visual inspection of all pages

---

## Phase 2: Fix Footer & Broken Links (FR-3) ✅

**Estimated Time**: 20 minutes

### 2.1 Simplify Footer

- [x] 2.1.1 Update `frontend/src/components/common/Footer.tsx`
  - [x] Remove Resources section (docs, faq, about don't exist)
  - [x] Remove Legal section (privacy, terms don't exist)
  - [x] Keep only: Browse Pipes, Create Pipe
  - [x] Update GitHub link to actual repo URL
  - [x] Remove Twitter link (or update to real handle)

### 2.2 Verification

- [x] 2.2.1 Click every link in footer
- [x] 2.2.2 Verify no 404 errors

---

## Phase 3: Operator Verification (FR-2) ✅

**Estimated Time**: 60 minutes

### 3.1 Test Source Operators

- [x] 3.1.1 Test Fetch JSON operator
  - [x] Preview with jsonplaceholder.typicode.com/posts
  - [x] Verify schema populates downstream

- [x] 3.1.2 Test Fetch RSS operator
  - [x] Preview with a valid RSS feed
  - [x] Verify items are parsed correctly

- [x] 3.1.3 Test Fetch CSV operator
  - [x] Preview with a sample CSV URL
  - [x] Verify delimiter and header options work

- [x] 3.1.4 Test Fetch Page operator
  - [x] Preview with a web page and selector
  - [x] Verify content is extracted

### 3.2 Test Transform Operators

- [x] 3.2.1 Test Filter operator
  - [x] Create pipe: Fetch JSON → Filter → Output
  - [x] Test Permit mode with equals rule
  - [x] Test Block mode
  - [x] Test Any vs All match mode

- [x] 3.2.2 Test Sort operator
  - [x] Create pipe: Fetch JSON → Sort → Output
  - [x] Test ascending sort
  - [x] Test descending sort

- [x] 3.2.3 Test Transform operator
  - [x] Create pipe: Fetch JSON → Transform → Output
  - [x] Verify field mappings work
  - [x] Verify only mapped fields appear in output

- [x] 3.2.4 Test Truncate operator
  - [x] Verify first N items returned

- [x] 3.2.5 Test Tail operator
  - [x] Verify last N items returned

- [x] 3.2.6 Test Unique operator
  - [x] Verify duplicates removed based on field

- [x] 3.2.7 Test String Replace operator
  - [x] Verify text replacement works

- [x] 3.2.8 Test Rename operator
  - [x] Verify field renaming works

### 3.3 Test Sample Pipelines

- [x] 3.3.1 Run "🟢 Simple: First 5 Posts" - verify success
- [x] 3.3.2 Run "🟡 Medium: User 1 Posts Sorted" - verify success
- [x] 3.3.3 Run "🟠 Hard: Transform & Dedupe" - verify success
- [x] 3.3.4 Run "🔴 Complex: RSS Feed Cleaner" - verify success
- [x] 3.3.5 Run "⭐ GitHub Top Repos" - verify success
- [x] 3.3.6 Run "📝 Last 3 Comments" - verify success
- [x] 3.3.7 Run "🏷️ Rename Fields Demo" - verify success

### 3.4 Fix Any Broken Operators

- [x] 3.4.1 Document and fix any operators that fail testing

---

## Phase 4: Execution Feedback (FR-4) ✅

**Estimated Time**: 45 minutes

### 4.1 Enhance Node Status Display

- [x] 4.1.1 Update `OperatorNode.tsx`
  - [x] Enhance status indicator size/visibility
  - [x] Add status text label (Running, Success, Error)
  - [x] Show item count from result preview

### 4.2 Improve Error Display

- [x] 4.2.1 Update `OperatorNode.tsx`
  - [x] Show error message on node when status is error
  - [x] Make error state more visually prominent (red border pulse)

### 4.3 Verification

- [x] 4.3.1 Run a successful pipe - verify green checkmarks appear
- [x] 4.3.2 Run a failing pipe - verify red X and error message
- [x] 4.3.3 Verify status resets between runs

---

## Phase 5: Canvas Polish (FR-5) ✅

**Estimated Time**: 30 minutes

### 5.1 Empty Canvas State

- [x] 5.1.1 Update `EditorCanvas.tsx`
  - [x] Add empty state component when nodes.length === 0
  - [x] Include icon, heading, and instructions
  - [x] Style to be visually appealing but not intrusive

### 5.2 Node Interactions

- [x] 5.2.1 Update `OperatorNode.tsx` CSS
  - [x] Add subtle hover lift effect
  - [x] Enhance selection border visibility

### 5.3 Edge Arrows Verification

- [x] 5.3.1 Verify arrows show on `/editor` page
- [x] 5.3.2 Verify arrows show on `/pipes/:id` detail page
- [x] 5.3.3 Verify arrows change color on hover/select

---

## Phase 6: Final Polish (FR-6) ✅

**Estimated Time**: 30 minutes

### 6.1 Toast Notifications

- [x] 6.1.1 Verify no duplicate toasts on pipe load
- [x] 6.1.2 Verify no duplicate toasts on execution
- [x] 6.1.3 Verify no duplicate toasts on preview

### 6.2 Loading States

- [x] 6.2.1 Verify loading spinner on pipe load
- [x] 6.2.2 Verify loading state on execution
- [x] 6.2.3 Verify skeleton loaders on browse page

### 6.3 Error Handling

- [x] 6.3.1 Test with invalid URL in Fetch - verify helpful error
- [x] 6.3.2 Test with network disconnected - verify error message
- [x] 6.3.3 Verify no uncaught errors in console

### 6.4 Final Verification

- [x] 6.4.1 Full app walkthrough:
  - [x] Visit home page
  - [x] Browse pipes
  - [x] Open sample pipe
  - [x] Run sample pipe
  - [x] Create new pipe
  - [x] Add operators
  - [x] Connect operators
  - [x] Configure operators
  - [x] Run pipe
  - [x] Save pipe (if logged in)

- [x] 6.4.2 No console errors throughout walkthrough
- [x] 6.4.3 No visual glitches or broken layouts

---

## Phase 7: Documentation Update ✅

**Estimated Time**: 20 minutes

### 7.1 Update README

- [x] 7.1.1 Update project name to Pipe Forge
- [x] 7.1.2 Update description
- [x] 7.1.3 Verify setup instructions work
- [x] 7.1.4 Add screenshot/GIF of working app

### 7.2 Update .kiro Docs

- [x] 7.2.1 Update steering docs with Pipe Forge name
- [x] 7.2.2 Ensure all specs are complete and accurate
- [x] 7.2.3 Mark completed tasks in this file

---

## Completion Checklist

Before considering launch-ready:

- [x] All "Yahoo" references removed from user-visible content
- [x] All footer links work or are removed
- [x] All 7 sample pipelines run successfully
- [x] Edge arrows visible on all pages
- [x] No duplicate toast notifications
- [x] No console errors
- [x] README updated
- [x] .kiro documentation complete

## ✅ ALL PHASES COMPLETED - December 4, 2025

---

## Fixes Applied

### Email Verification Fix
- **Issue**: SendGrid failing with `ECONNRESET` in development
- **Fix**: Made email sending non-blocking in development mode
- **Workaround**: Verification URL is logged to console for manual verification

---

## Notes

- Keep commits atomic and well-described for hackathon judges
- Test after each phase before moving to next
- Document any issues found and fixes applied
