# Pipe Forge Launch - Requirements

## Overview

Transform "Yahoo Pipes 2025" into "Pipe Forge" - a polished, hackathon-ready visual data pipeline builder that wins the Kiroween Resurrection category.

## Goals

1. **Legal Safety**: Remove all Yahoo branding to avoid trademark issues
2. **Core Functionality**: Ensure all operators work correctly end-to-end
3. **Professional Polish**: Fix broken links, empty states, and UI inconsistencies
4. **Visual Delight**: Add animations and feedback that make the app feel alive
5. **Hackathon Ready**: Documentation, demo-ability, and wow factor

---

## Functional Requirements

### FR-1: Rebrand to "Pipe Forge"

#### FR-1.1: Update Application Name
- **WHEN** a user visits any page
- **THEN** the System SHALL display "Pipe Forge" instead of "Yahoo Pipes" or "Yahoo Pipes 2025"

#### FR-1.2: Update Navigation Bar
- **WHEN** the navigation bar renders
- **THEN** the logo text SHALL read "Pipe Forge"
- **AND** the CSS class `bg-yahoo-pipes` SHALL be renamed to `bg-pipe-forge`

#### FR-1.3: Update Footer
- **WHEN** the footer renders
- **THEN** the brand name SHALL read "Pipe Forge"
- **AND** the tagline SHALL read "Visual data pipelines for everyone"

#### FR-1.4: Update Auth Pages
- **WHEN** a user views login or register pages
- **THEN** the heading SHALL read "Sign in to Pipe Forge" or "Create your Pipe Forge account"

#### FR-1.5: Update Meta Tags
- **WHEN** the application loads
- **THEN** the page title SHALL include "Pipe Forge"
- **AND** meta description SHALL reference "Pipe Forge"

#### FR-1.6: Update Code Constants
- **WHEN** localStorage keys are used
- **THEN** they SHALL use `pipe_forge_` prefix instead of `yahoo_pipes_`

---

### FR-2: Operator Verification

#### FR-2.1: Source Operators
- **GIVEN** a Fetch JSON operator with valid URL
- **WHEN** the user clicks Preview or Run
- **THEN** the System SHALL fetch data and display results
- **AND** schema SHALL propagate to downstream operators

#### FR-2.2: Filter Operator
- **GIVEN** a Filter operator with configured rules
- **WHEN** data flows through the operator
- **THEN** the System SHALL correctly apply Permit/Block mode
- **AND** correctly apply All(AND)/Any(OR) match logic

#### FR-2.3: Sort Operator
- **GIVEN** a Sort operator with field and direction
- **WHEN** data flows through the operator
- **THEN** the System SHALL sort items by the specified field
- **AND** in the specified direction (asc/desc)

#### FR-2.4: Transform Operator
- **GIVEN** a Transform operator with field mappings
- **WHEN** data flows through the operator
- **THEN** the System SHALL extract only the mapped fields
- **AND** rename them to target field names

#### FR-2.5: Truncate/Tail Operators
- **GIVEN** a Truncate operator with count N
- **WHEN** data flows through the operator
- **THEN** the System SHALL return only the first N items

- **GIVEN** a Tail operator with count N
- **WHEN** data flows through the operator
- **THEN** the System SHALL return only the last N items

#### FR-2.6: String Operators
- **GIVEN** a String Replace operator with search/replace values
- **WHEN** data flows through the operator
- **THEN** the System SHALL replace all occurrences in the target field

#### FR-2.7: Unique Operator
- **GIVEN** a Unique operator with dedupe field
- **WHEN** data flows through the operator
- **THEN** the System SHALL remove duplicate items based on that field
- **AND** keep the first occurrence

---

### FR-3: Fix Broken Links & Pages

#### FR-3.1: Footer Link Cleanup
- **WHEN** the footer renders
- **THEN** all links SHALL either:
  - Navigate to existing pages, OR
  - Be removed from the footer

#### FR-3.2: Social Links
- **WHEN** the footer renders social icons
- **THEN** they SHALL link to actual project resources (GitHub repo)
- **OR** be removed if no real links exist

#### FR-3.3: Resources Section
- **WHEN** the footer shows Resources section
- **THEN** the System SHALL only show links to pages that exist:
  - Browse Pipes (/pipes)
  - Create Pipe (/editor)

---

### FR-4: Execution Feedback

#### FR-4.1: Node Status During Execution
- **WHEN** a pipe execution starts
- **THEN** each node SHALL display a visual "running" state (blue/pulsing)

- **WHEN** a node completes successfully
- **THEN** it SHALL display a "success" state (green checkmark)

- **WHEN** a node fails
- **THEN** it SHALL display an "error" state (red X)
- **AND** the error message SHALL be visible

#### FR-4.2: Execution Progress
- **WHEN** a pipe is executing
- **THEN** the System SHALL show which node is currently running

#### FR-4.3: Intermediate Results
- **WHEN** a node completes execution
- **THEN** the node SHALL display a preview of its output (item count)

---

### FR-5: Canvas Polish

#### FR-5.1: Edge Arrows
- **WHEN** edges are rendered on the canvas
- **THEN** each edge SHALL have an arrow pointing to the target node
- **AND** arrows SHALL be visible in all contexts (editor, pipe detail, browse)

#### FR-5.2: Node Interactions
- **WHEN** a user hovers over a node
- **THEN** the node SHALL show subtle visual feedback

- **WHEN** a user selects a node
- **THEN** the node SHALL show clear selection state

#### FR-5.3: Empty Canvas State
- **WHEN** the canvas has no nodes
- **THEN** the System SHALL display helpful guidance
- **AND** a clear call-to-action to add operators

#### FR-5.4: Operator Configuration
- **WHEN** a user interacts with inline config controls
- **THEN** clicks SHALL work correctly (not be intercepted by ReactFlow)
- **AND** dropdowns SHALL populate with upstream schema fields

---

### FR-6: Professional Polish

#### FR-6.1: Loading States
- **WHEN** any async operation is in progress
- **THEN** the System SHALL display appropriate loading indicator

#### FR-6.2: Error States
- **WHEN** an operation fails
- **THEN** the System SHALL display user-friendly error message
- **AND** provide actionable guidance when possible

#### FR-6.3: Empty States
- **WHEN** a list has no items (My Pipes, Browse results)
- **THEN** the System SHALL display helpful empty state
- **AND** provide call-to-action

#### FR-6.4: Toast Notifications
- **WHEN** an action completes
- **THEN** only ONE toast notification SHALL appear
- **AND** toasts SHALL be dismissible

---

## Non-Functional Requirements

### NFR-1: Performance
- Page load time SHALL be under 3 seconds
- Pipe execution feedback SHALL appear within 100ms of state change

### NFR-2: Accessibility
- All interactive elements SHALL be keyboard accessible
- Color contrast SHALL meet WCAG AA standards

### NFR-3: Browser Support
- Application SHALL work in Chrome, Firefox, Safari, Edge (latest versions)

### NFR-4: Mobile Responsiveness
- Application SHALL be usable on tablet-sized screens (768px+)
- Editor canvas SHALL support touch interactions

---

## Out of Scope (Future)

- Dark mode
- Scheduled/automated runs
- Real-time collaboration
- AI-powered features
- Mobile phone support (< 768px)

