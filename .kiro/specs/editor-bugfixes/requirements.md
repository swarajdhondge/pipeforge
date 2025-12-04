# Requirements Document: Editor & Pipeline Bugfixes

## Introduction

This spec addresses critical bugs and missing functionality in the `/editor` page that prevent pipes from working correctly. Issues include schema propagation failures, double notifications, missing arrow markers, unrealistic default pipelines, output not displaying on nodes, operator interoperability problems, and missing user input collection.

## Glossary

- **Schema Propagation**: Passing discovered field information from upstream operators to downstream operators via Redux
- **Edge**: A connection between two operator nodes on the canvas
- **Intermediate Results**: Output data from each operator in the execution chain
- **User Input Operators**: Operators that accept user-provided values at runtime (text-input, number-input, etc.)
- **Run Selected**: Execute from a specific operator back through all upstream sources
- **Marker End**: SVG arrow marker at the end of edge connections

## Problem Areas

### Area 1: Schema Propagation Not Working

**Current State:** Schema propagation logic exists in `schema-slice.ts` but connections don't trigger updates.

**Impact:** Downstream operators (Filter, Sort) show empty field dropdowns even after source preview.

### Area 2: Double Success Notifications

**Current State:** Both preview and execution show success toasts, sometimes appearing at wrong times.

**Impact:** Confusing UX with multiple notifications for single actions.

### Area 3: Missing Arrow Markers on Edges

**Current State:** Edges render without clear directional arrows in some cases.

**Impact:** Users can't easily see data flow direction.

### Area 4: Unrealistic Default Pipeline

**Current State:** Default pipeline has only Fetch JSON → Pipe Output with a generic URL.

**Impact:** New users don't see a working example of a real pipeline.

### Area 5: Output Not Displayed on Nodes

**Current State:** Execution results only appear in bottom panel, not on individual operator nodes.

**Impact:** Users can't see intermediate data at each step.

### Area 6: Node Status Not Updated During Execution

**Current State:** Nodes stay in 'idle' state during execution instead of showing running/success/error.

**Impact:** No visual feedback about which operators are executing.

### Area 7: User Input Values Not Collected

**Current State:** UserInputPromptDialog exists but isn't integrated into execution flow.

**Impact:** Pipes with user inputs fail because values aren't provided.

### Area 8: Missing "Run Selected" on Nodes

**Current State:** Backend `executeSelected` method exists but no frontend button.

**Impact:** Can't test partial pipes from specific operators.

### Area 9: Operator Interoperability Failures

**Current State:** Operators may fail silently when receiving unexpected input types.

**Impact:** Confusing errors or silent failures when connecting incompatible operators.

### Area 10: Schema Not Cleared on Edge Delete

**Current State:** Deleting an edge doesn't clear downstream schema.

**Impact:** Stale field paths remain in dropdowns after disconnection.

---

## Requirements

### Requirement 1: Schema Propagation on Connection Change

**User Story:** As a pipe builder, I want field dropdowns to update automatically when I connect operators, so that I can see available fields without manual preview.

#### Acceptance Criteria

1. WHEN a new edge is created THEN the System SHALL call `propagateSchemas` with updated edges
2. WHEN an edge is deleted THEN the System SHALL clear the downstream operator's upstream schema
3. WHEN a source operator is previewed THEN the System SHALL propagate schema to all downstream operators
4. WHEN the upstream operator has no schema THEN the System SHALL show fallback text input for field names

### Requirement 2: Single Notification Per Action

**User Story:** As a user, I want to see exactly one notification per action, so that I'm not confused by duplicate messages.

#### Acceptance Criteria

1. WHEN a preview completes successfully THEN the System SHALL show at most one success toast
2. WHEN execution completes THEN the System SHALL show exactly one success or error toast
3. WHEN multiple operations happen in sequence THEN the System SHALL NOT stack duplicate toasts
4. WHEN a toast is already showing for an action THEN the System SHALL NOT show another toast for the same action

### Requirement 3: Visible Arrow Markers on Edges

**User Story:** As a pipe builder, I want to clearly see the direction of data flow, so that I understand how operators are connected.

#### Acceptance Criteria

1. WHEN an edge is rendered THEN the System SHALL display an arrow marker at the target end
2. WHEN an edge is selected THEN the arrow marker SHALL be visible in the selection color
3. WHEN an edge is hovered THEN the arrow marker SHALL be visible in the hover color
4. WHEN edges are animated during execution THEN the arrow direction SHALL remain visible

### Requirement 4: Realistic Default Pipeline

**User Story:** As a new user, I want to see a realistic working example when I open the editor, so that I understand how pipes work.

#### Acceptance Criteria

1. WHEN a new pipe is created THEN the System SHALL show a realistic multi-step pipeline
2. WHEN the default pipeline executes THEN the System SHALL produce meaningful output
3. WHEN viewing the default pipeline THEN the System SHALL include at least: Source → Filter → Pipe Output
4. WHEN the default URL is used THEN the System SHALL use a reliable public JSON API

### Requirement 5: Display Intermediate Results on Nodes

**User Story:** As a pipe builder, I want to see the output of each operator directly on the node, so that I can debug data flow step by step.

#### Acceptance Criteria

1. WHEN execution completes THEN the System SHALL update each node's `data.result` with its output
2. WHEN a node has execution results THEN the System SHALL display a preview in the node body
3. WHEN results are large THEN the System SHALL truncate and show "Show more" option
4. WHEN an operator fails THEN the System SHALL display the error on that specific node

### Requirement 6: Update Node Status During Execution

**User Story:** As a pipe builder, I want to see which operators are currently running, so that I know execution progress.

#### Acceptance Criteria

1. WHEN execution starts THEN the System SHALL set each node's status to 'running' as it executes
2. WHEN an operator completes successfully THEN the System SHALL set its status to 'success'
3. WHEN an operator fails THEN the System SHALL set its status to 'error'
4. WHEN execution finishes THEN all executed nodes SHALL have 'success' or 'error' status

### Requirement 7: Collect User Input Values Before Execution

**User Story:** As a pipe builder using input operators, I want to be prompted for values before execution, so that my parameterized pipes work correctly.

#### Acceptance Criteria

1. WHEN a pipe contains user input operators THEN the System SHALL detect them before execution
2. WHEN user inputs exist THEN the System SHALL show UserInputPromptDialog
3. WHEN the user provides values THEN the System SHALL pass them to the execution endpoint
4. WHEN the user cancels the dialog THEN the System SHALL NOT execute the pipe

### Requirement 8: Add "Run Selected" Button to Nodes

**User Story:** As a pipe builder, I want to run from any operator and see results for just that subgraph, so that I can test parts of complex pipes.

#### Acceptance Criteria

1. WHEN hovering over a non-source operator THEN the System SHALL show a "Run" button
2. WHEN clicking "Run" on an operator THEN the System SHALL execute all upstream operators plus that operator
3. WHEN execution completes THEN the System SHALL display results on all executed nodes
4. WHEN an operator has no upstream connection (and is not a source) THEN the System SHALL show an error

### Requirement 9: Graceful Operator Error Handling

**User Story:** As a pipe builder, I want clear error messages when operators receive wrong input types, so that I can fix my pipe configuration.

#### Acceptance Criteria

1. WHEN Filter receives non-array input THEN the System SHALL display "Filter requires array input, received [type]"
2. WHEN Sort receives non-array input THEN the System SHALL display "Sort requires array input, received [type]"
3. WHEN Transform receives null/undefined THEN the System SHALL pass through gracefully
4. WHEN any operator fails THEN the error message SHALL include the operator name and type
5. WHEN validation fails THEN the System SHALL block execution and highlight invalid operators

### Requirement 10: Proper API Response Handling

**User Story:** As a developer, I want consistent API error handling, so that users see helpful messages.

#### Acceptance Criteria

1. WHEN preview fails due to network error THEN the System SHALL show "Network error: Unable to reach [domain]"
2. WHEN preview fails due to timeout THEN the System SHALL show "Request timeout: Took longer than 30 seconds"
3. WHEN preview fails due to invalid JSON THEN the System SHALL show "Invalid response: Expected JSON but received [content-type]"
4. WHEN execution fails THEN the System SHALL preserve and display all successful intermediate results

---

## Out of Scope

- Real-time collaboration features
- Undo/redo for individual node configurations
- Auto-layout of nodes
- Dark mode
- Mobile responsiveness

## Dependencies

- Backend operators must be registered and functioning
- Redux store must be properly configured
- Preview API endpoint must be working
- Execution API endpoint must be working

