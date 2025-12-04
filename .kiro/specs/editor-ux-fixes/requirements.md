# Requirements Document

## Introduction

This feature addresses several UX issues in the pipe editor that impact the user experience:
1. The first-time tooltip/welcome modal is scrollable and verbose - needs to be concise and shown only once
2. The default "Sample Posts API" pipe is missing output and has incorrect edge connections (no arrows)
3. Keyboard shortcuts for undo/redo (Ctrl+Z, Ctrl+Shift+Z) are not working
4. Full pipe execution is failing

## Glossary

- **First-Time Overlay**: The guided tooltip shown to new users when they first visit the editor
- **Welcome Modal**: The modal dialog shown on the home page for first-time visitors
- **Edge**: A connection line between two operator nodes in the canvas
- **Marker**: The arrow indicator at the end of an edge showing data flow direction
- **Undo/Redo**: History navigation actions to revert or restore canvas changes
- **Pipe Execution**: The process of running all connected operators to produce output

## Requirements

### Requirement 1

**User Story:** As a first-time user, I want to see a brief, non-scrollable welcome tooltip so that I can quickly understand how to use the editor without being overwhelmed.

#### Acceptance Criteria

1. WHEN the first-time overlay is displayed THEN the system SHALL render the tooltip with fixed dimensions that fit within the viewport without scrolling
2. WHEN a user dismisses the first-time overlay by clicking "Don't show again" THEN the system SHALL persist this preference in localStorage and never show the overlay again
3. WHEN a user has previously dismissed the overlay THEN the system SHALL NOT display the overlay on subsequent visits
4. WHEN the first-time overlay is displayed THEN the system SHALL show concise text with a maximum of 2-3 sentences per step

### Requirement 2

**User Story:** As a user, I want the default sample pipe to have proper edge connections with visible arrows so that I can understand the data flow direction.

#### Acceptance Criteria

1. WHEN the editor loads with the default sample pipe THEN the system SHALL display edges with arrow markers pointing from source to target
2. WHEN a user creates a new connection between nodes THEN the system SHALL apply the same arrow marker styling as default edges
3. WHEN the default pipe is loaded THEN the system SHALL include the markerEnd property with ArrowClosed type on all edges

### Requirement 3

**User Story:** As a user, I want to use keyboard shortcuts (Ctrl+Z for undo, Ctrl+Shift+Z for redo) so that I can quickly navigate my edit history.

#### Acceptance Criteria

1. WHEN a user presses Ctrl+Z (or Cmd+Z on Mac) THEN the system SHALL trigger the undo action if history is available
2. WHEN a user presses Ctrl+Shift+Z (or Cmd+Shift+Z on Mac) THEN the system SHALL trigger the redo action if future history is available
3. WHEN keyboard shortcuts are triggered THEN the system SHALL prevent the default browser behavior
4. WHEN the user is focused on an input field THEN the system SHALL still allow undo/redo shortcuts to function

### Requirement 4

**User Story:** As a user, I want the full pipe to execute correctly so that I can see the output of my data transformations.

#### Acceptance Criteria

1. WHEN a user clicks the Run button THEN the system SHALL execute all connected operators in topological order
2. WHEN execution completes successfully THEN the system SHALL display the final result in the results panel
3. WHEN execution fails THEN the system SHALL display a clear error message indicating which operator failed and why

### Requirement 5

**User Story:** As a user, I want the welcome modal to only appear once so that I'm not repeatedly interrupted when visiting the site.

#### Acceptance Criteria

1. WHEN a user visits the site for the first time THEN the system SHALL display the welcome modal once
2. WHEN a user closes the welcome modal THEN the system SHALL persist this preference and not show it again
3. WHEN a user clears their browser data THEN the system SHALL show the welcome modal again on next visit
