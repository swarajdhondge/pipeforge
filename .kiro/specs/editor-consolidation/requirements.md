# Requirements Document

## Introduction

This spec consolidates the overlapping editor-related specifications (core-pipe-engine, ui-polish, ui-cleanup, ux-simplification, yahoo-pipes-canvas, editor-ux-fixes) into a single source of truth. It documents what's working, what's broken, and provides clear requirements for the remaining fixes.

The editor is the core of the Yahoo Pipes resurrection - a visual canvas where users drag operators, connect them, and configure data transformations. Multiple specs have addressed different aspects of this experience, leading to some overlap and inconsistency.

## Current State Analysis

### What's Working
- OperatorNode component renders all operator types with inline config
- OperatorsSidebar has all operators organized by category (Sources, User Inputs, Operators, String, URL, Output)
- Connection validation prevents cycles, self-connections, and multiple inputs
- Undo/Redo with keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
- Save/Publish workflow with metadata panel
- Execution via Run button with results panel
- Canvas slice has edge selection/removal actions (removeEdge, removeSelectedEdges)

### What's Broken (Root Causes Identified)
1. **SelectableEdge not registered** - EditorCanvas.tsx has nodeTypes but no edgeTypes, so SelectableEdge component is unused
2. **No keyboard delete handler** - Delete/Backspace not wired to remove selected nodes or edges
3. **Event propagation in CompactOperatorNode** - The onClick handler on node body interferes with inline config interactions
4. **Edge context menu not connected** - EdgeContextMenu component exists but not integrated into canvas

## Glossary

- **OperatorNode**: The ReactFlow custom node component that renders operators on the canvas
- **CompactOperatorNode**: An alternative node component with expand/collapse behavior (currently unused)
- **Inline Config**: Configuration UI embedded directly in the node body (no side panel)
- **ReactFlow**: The library used for the visual canvas (handles node dragging, connections, etc.)
- **Event Propagation**: How mouse/click events bubble up through the DOM hierarchy
- **Schema Propagation**: Passing field information from source operators to downstream operators
- **SelectableEdge**: Custom edge component with hover/selection states (exists but not registered)

## Requirements

### Requirement 1: Event Handling in ReactFlow Nodes

**User Story:** As a user, I want to interact with form controls inside operator nodes, so that I can configure operators without accidentally dragging the node.

#### Acceptance Criteria

1. WHEN a user clicks on an input field inside an operator node THEN the System SHALL focus the input field without initiating node drag
2. WHEN a user clicks on a select dropdown inside an operator node THEN the System SHALL open the dropdown without initiating node drag
3. WHEN a user clicks on a button inside an operator node THEN the System SHALL trigger the button action without initiating node drag
4. WHEN a user clicks on the node header or empty areas THEN the System SHALL allow normal node selection and dragging
5. WHEN a user clicks on a checkbox inside an operator node THEN the System SHALL toggle the checkbox without initiating node drag

### Requirement 2: Consistent Node Component Architecture

**User Story:** As a developer, I want a single, well-documented node component pattern, so that all operators behave consistently.

#### Acceptance Criteria

1. THE System SHALL use OperatorNode as the primary node component for all operator types
2. WHEN rendering inline configuration THEN the System SHALL wrap the config area with event propagation stoppers
3. THE System SHALL apply the ReactFlow event handling pattern (onClick + onMouseDown with stopPropagation) to all interactive elements
4. WHEN CompactOperatorNode is used THEN the System SHALL apply the same event handling pattern to its expanded config area

### Requirement 3: Inline Configuration Display

**User Story:** As a user, I want to see and edit operator configuration directly in the node, so that I don't need a separate side panel.

#### Acceptance Criteria

1. WHEN an operator node is rendered THEN the System SHALL display its configuration UI inline within the node body
2. WHEN a source operator (fetch-json, fetch-csv, fetch-rss, fetch-page) is displayed THEN the System SHALL show URL input and preview button inline
3. WHEN a Filter operator is displayed THEN the System SHALL show Permit/Block toggle, match mode (any/all), and rules list inline
4. WHEN a Sort operator is displayed THEN the System SHALL show field dropdown and direction toggle inline
5. WHEN a User Input operator is displayed THEN the System SHALL show label, default value, and prompt text inline

### Requirement 4: Schema Propagation

**User Story:** As a user, I want field dropdowns to auto-populate from upstream data, so that I don't have to manually type field names.

#### Acceptance Criteria

1. WHEN a source operator's Preview button is clicked THEN the System SHALL fetch sample data and extract field paths
2. WHEN schema is extracted THEN the System SHALL store it in Redux and propagate to downstream operators
3. WHEN a downstream operator has upstream schema available THEN the System SHALL populate field dropdowns with those paths
4. WHEN no upstream schema is available THEN the System SHALL fall back to manual text input for field names

### Requirement 5: First-Time User Experience

**User Story:** As a new user, I want helpful guidance when I first use the editor, so that I understand how to build pipes.

#### Acceptance Criteria

1. WHEN a user opens the editor for the first time THEN the System SHALL display a first-time overlay with getting started tips
2. WHEN the user dismisses the overlay THEN the System SHALL persist this preference in localStorage
3. WHEN the user returns to the editor THEN the System SHALL NOT show the overlay again
4. THE System SHALL provide an empty canvas overlay with a "Get Started" prompt when no operators are present

### Requirement 6: Keyboard Shortcuts

**User Story:** As a power user, I want keyboard shortcuts for common actions, so that I can work more efficiently.

#### Acceptance Criteria

1. WHEN the user presses Delete or Backspace with a node selected THEN the System SHALL delete the selected node
2. WHEN the user presses Ctrl+Z THEN the System SHALL undo the last action
3. WHEN the user presses Ctrl+Shift+Z or Ctrl+Y THEN the System SHALL redo the last undone action
4. WHEN the user presses Ctrl+S THEN the System SHALL save the current pipe
5. WHEN the user presses ? THEN the System SHALL show the keyboard shortcuts modal

### Requirement 7: Visual Feedback and Status

**User Story:** As a user, I want clear visual feedback about operator status, so that I know what's happening during execution.

#### Acceptance Criteria

1. WHEN an operator is executing THEN the System SHALL show a blue pulsing border and spinning indicator
2. WHEN an operator completes successfully THEN the System SHALL show a green border and checkmark indicator
3. WHEN an operator fails THEN the System SHALL show a red border, error message, and retry button
4. WHEN an operator has validation errors THEN the System SHALL show a yellow warning badge in the header
5. WHEN an output handle has no outgoing connection THEN the System SHALL show a pulsing glow effect

### Requirement 8: Edge (Connection) Management

**User Story:** As a user, I want to delete connections between operators, so that I can reconfigure my pipe's data flow.

**Root Cause:** SelectableEdge component exists at `frontend/src/components/editor/SelectableEdge.tsx` but is not registered in EditorCanvas.tsx edgeTypes. EdgeContextMenu exists but is not integrated.

#### Acceptance Criteria

1. WHEN a user clicks on an edge (connection line) THEN the System SHALL select that edge
2. WHEN a user presses Delete or Backspace with an edge selected THEN the System SHALL remove that connection
3. WHEN a user right-clicks on an edge THEN the System SHALL show a context menu with a "Delete" option
4. WHEN an edge is deleted THEN the System SHALL update the downstream operator's schema availability
5. WHEN a user hovers over an edge THEN the System SHALL highlight the edge to indicate it's interactive

### Requirement 9: Operator Configuration Interactivity

**User Story:** As a user, I want to modify all configuration options within operators, so that I can customize data transformations.

**Root Cause:** OperatorNode.tsx has proper event handlers on the inline config wrapper div. The inline config components (FilterInlineConfig, etc.) also have onClick/onMouseDown handlers. The issue may be in specific components or the CompactOperatorNode which has a click handler on the entire node body.

#### Acceptance Criteria

1. WHEN a user clicks on a toggle (AND/OR, Permit/Block, etc.) inside an operator THEN the System SHALL change the toggle state
2. WHEN a user clicks "Add Rule" in a Filter operator THEN the System SHALL add a new rule row
3. WHEN a user clicks the remove button on a rule THEN the System SHALL remove that rule
4. WHEN a user changes a dropdown selection THEN the System SHALL update the operator configuration
5. WHEN a user types in an input field THEN the System SHALL update the operator configuration in real-time
6. WHEN a user interacts with any form control THEN the System SHALL NOT trigger node dragging or selection changes

### Requirement 10: Complete Operator Palette

**User Story:** As a user, I want access to all available operators in the palette, so that I can build any data transformation I need.

#### Acceptance Criteria

1. THE System SHALL display all source operators in the palette: Fetch JSON, Fetch CSV, Fetch RSS, Fetch Page
2. THE System SHALL display all user input operators: Text Input, Number Input, URL Input, Date Input
3. THE System SHALL display all transform operators: Filter, Sort, Unique, Truncate, Tail, Rename, Transform
4. THE System SHALL display all string operators: String Replace, Regex, Substring
5. THE System SHALL display URL Builder operator
6. THE System SHALL display Pipe Output operator
7. WHEN a user drags an operator from the palette THEN the System SHALL add it to the canvas at the drop location

### Requirement 11: Tree-Based Sequential Execution

**User Story:** As a user, I want my pipe to execute operators in the correct order following the connection flow, so that data transforms correctly through the pipeline.

**Note:** The execution-logic.ts converts nodes/edges to definition format and calls executionService.executeDefinition. The backend handles topological ordering. The frontend needs to update node status indicators during execution.

#### Acceptance Criteria

1. WHEN "Run" is clicked THEN the System SHALL execute operators in topological order (sources first, then downstream)
2. WHEN "Run Selected" is clicked on a node THEN the System SHALL trace upstream to find all source nodes and execute from sources to the selected node
3. WHEN an operator depends on multiple upstream operators THEN the System SHALL wait for all upstream operators to complete before executing
4. WHEN an operator fails THEN the System SHALL stop execution of downstream operators and display the error
5. THE System SHALL pass the output of each operator as input to its connected downstream operators
6. WHEN executing THEN the System SHALL update each operator's status indicator in real-time (idle → running → success/error)

### Requirement 12: Keyboard Shortcuts for Node/Edge Deletion

**User Story:** As a user, I want to delete selected nodes and edges using keyboard shortcuts, so that I can quickly modify my pipe.

**Root Cause:** The useKeyboardShortcuts hook exists and is used for undo/redo in EditorToolbar, but Delete/Backspace handlers are not registered for node/edge deletion.

#### Acceptance Criteria

1. WHEN a user presses Delete or Backspace with a node selected THEN the System SHALL remove the selected node and its connections
2. WHEN a user presses Delete or Backspace with an edge selected THEN the System SHALL remove the selected edge
3. WHEN a user presses Escape THEN the System SHALL deselect all nodes and edges
4. THE System SHALL NOT trigger delete when focus is in an input field or textarea

