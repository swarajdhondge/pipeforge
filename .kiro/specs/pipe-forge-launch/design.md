# Pipe Forge Launch - Technical Design

## Overview

This document outlines the technical approach for transforming Yahoo Pipes 2025 into Pipe Forge, ensuring all requirements are met with minimal risk and maximum quality.

---

## Architecture Context

### Current Stack
- **Frontend**: React 19, TypeScript, Redux Toolkit, ReactFlow, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Redis
- **State Management**: Redux slices for canvas, auth, schema, secrets

### Key Files Affected

| Requirement | Primary Files |
|-------------|---------------|
| FR-1 Rebrand | ~32 files containing "Yahoo" |
| FR-2 Operators | Backend operators/, frontend inline-config/ |
| FR-3 Footer | Footer.tsx |
| FR-4 Execution | EditorToolbar.tsx, OperatorNode.tsx, canvas-slice.ts |
| FR-5 Canvas | EditorCanvas.tsx, SelectableEdge.tsx, OperatorNode.tsx |
| FR-6 Polish | Various component files |

---

## Design Decisions

### D1: Rebrand Strategy

**Approach**: Global find-and-replace with manual verification

**Changes Required**:

1. **Text Content** (user-visible):
   - "Yahoo Pipes" → "Pipe Forge"
   - "Yahoo Pipes 2025" → "Pipe Forge"

2. **CSS Classes**:
   - `bg-yahoo-pipes` → `bg-pipe-forge`
   - Update tailwind.config.js color definitions

3. **Constants/Keys**:
   - `yahoo_pipes_*` → `pipe_forge_*`
   - `YAHOO_PIPES_*` → `PIPE_FORGE_*`

4. **Comments** (code):
   - Update file headers and inline comments

**Files to Update**:
```
frontend/src/components/common/Footer.tsx
frontend/src/components/common/navigation-bar.tsx
frontend/src/pages/login-page.tsx
frontend/src/pages/register-page.tsx
frontend/src/pages/home-page.tsx
frontend/src/index.css
frontend/src/styles/design-tokens.ts
frontend/index.html (title, meta)
frontend/tailwind.config.js
backend/package.json (if name contains yahoo)
README.md
```

---

### D2: Footer Simplification

**Approach**: Remove non-existent pages, keep only working links

**Before**:
```
Product: Browse Pipes, Create Pipe, Templates
Resources: Documentation, FAQ, About
Legal: Privacy Policy, Terms of Service
```

**After**:
```
Product: Browse Pipes, Create Pipe
Connect: GitHub (actual repo link)
```

**Rationale**: Better to have fewer working links than many broken ones. Legal pages can be added post-hackathon.

---

### D3: Operator Verification Strategy

**Approach**: Create verification test script + manual testing

**Test Matrix**:

| Operator | Test Input | Expected Output | Config Options |
|----------|------------|-----------------|----------------|
| fetch-json | jsonplaceholder.typicode.com/posts | 100 posts | url |
| fetch-rss | NYT RSS feed | RSS items | url, maxItems |
| fetch-csv | Sample CSV URL | Parsed rows | url, delimiter, hasHeader |
| filter | Posts array | Filtered subset | mode, matchMode, rules |
| sort | Posts array | Sorted array | field, direction |
| transform | Posts array | Mapped fields | mappings[] |
| truncate | 100 items | First N items | count |
| tail | 100 items | Last N items | count, skip |
| unique | Items with dupes | Deduplicated | field |
| string-replace | Text field | Modified text | field, search, replacement |
| rename | Object | Renamed fields | mappings[] |
| pipe-output | Any data | Passed through | - |

---

### D4: Execution Feedback Implementation

**Current Flow**:
```
User clicks Run → setIsExecuting(true) → API call → setExecutionResult → setIsExecuting(false)
```

**Enhanced Flow**:
```
User clicks Run 
  → Set all nodes to "pending" status
  → setIsExecuting(true)
  → API call (with intermediate results)
  → For each intermediate result:
      → Update node status to "success" or "error"
      → Update node with result preview
  → setIsExecuting(false)
```

**Node Status States**:
```typescript
type NodeStatus = 'idle' | 'pending' | 'running' | 'success' | 'error';
```

**Visual Indicators**:
- `idle`: Default neutral styling
- `pending`: Light blue border, subtle pulse
- `running`: Blue border, animated spinner
- `success`: Green border, checkmark icon
- `error`: Red border, X icon, error tooltip

---

### D5: Canvas Polish Details

**Edge Arrows** (already implemented):
- Global SVG marker definitions in EditorCanvas
- SelectableEdge uses markerEnd with dynamic colors
- Ensure pipe-detail-page.tsx also has markers ✓

**Empty Canvas State**:
```tsx
// When nodes.length === 0
<div className="absolute inset-0 flex items-center justify-center">
  <div className="text-center">
    <PipeIcon className="w-16 h-16 mx-auto text-neutral-300" />
    <h3 className="mt-4 text-lg font-medium text-neutral-600">
      Start building your pipe
    </h3>
    <p className="mt-2 text-sm text-neutral-500">
      Drag operators from the sidebar to begin
    </p>
  </div>
</div>
```

**Node Hover Effects**:
```css
/* Add to OperatorNode */
.operator-node:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

---

### D6: Toast Deduplication

**Problem**: Multiple toasts appearing for single action

**Solution**: Already partially fixed. Additional measures:

1. Add ref guard in EditorPage to prevent double-loading toasts ✓
2. Remove redundant toasts from inline config components ✓
3. Ensure execution only shows one success/error toast

---

## Component Changes Summary

### EditorCanvas.tsx
- Add empty state component
- Ensure arrow markers render (done)
- Add node hover animations via CSS

### OperatorNode.tsx
- Enhance status indicator visibility
- Add hover transform effect
- Show result preview count

### Footer.tsx
- Rebrand to Pipe Forge
- Remove broken links
- Simplify to essential links only

### navigation-bar.tsx
- Rebrand logo text
- Update CSS class names

### canvas-slice.ts
- Ensure node status updates propagate correctly

### tailwind.config.js
- Rename yahoo-pipes color to pipe-forge

---

## Testing Strategy

### Unit Tests
- Verify canvas-slice reducers work correctly
- Verify operator configs are applied properly

### Integration Tests
- Run each sample pipe end-to-end
- Verify execution results match expected output

### Manual Testing Checklist
- [ ] Load each sample pipe from Browse
- [ ] Run each sample pipe successfully
- [ ] Verify arrows visible on all pages
- [ ] Verify no console errors
- [ ] Verify no duplicate toasts
- [ ] Verify all footer links work
- [ ] Verify rebrand complete (no "Yahoo" visible)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing a "Yahoo" reference | Medium | Global grep search before completion |
| Breaking operator functionality | High | Test each operator individually |
| CSS class rename breaking styles | Medium | Search for all class usages |
| localStorage key change breaking sessions | Low | Handle gracefully, users re-login |

---

## Rollout Plan

1. **Phase 1**: Rebrand (FR-1) - Highest visibility, lowest risk
2. **Phase 2**: Footer fixes (FR-3) - Quick win
3. **Phase 3**: Operator verification (FR-2) - Core functionality
4. **Phase 4**: Execution feedback (FR-4) - User experience
5. **Phase 5**: Canvas polish (FR-5) - Visual delight
6. **Phase 6**: Final polish (FR-6) - Professional finish

