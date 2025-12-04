# Requirements Document

## Introduction

The current Pipe Editor UI is cluttered and overwhelming. This spec addresses visual clutter, code organization, and creates a clean, professional interface where users can focus on building pipes.

## Glossary

- **System**: Yahoo Pipes 2025 platform
- **User**: Any user of the platform
- **Canvas**: The main visual workspace where operators are placed
- **Operator Node**: A visual block representing a data operation

## Requirements

### Requirement 1: Clean Layout Structure

**User Story:** As a user, I want a clean, organized layout so that I can focus on building pipes.

#### Acceptance Criteria

1. WHEN the editor loads THEN the System SHALL display a 3-column layout: Sidebar (200px) | Canvas (flex) | Config Panel (300px, hidden by default)
2. WHEN the editor loads THEN the System SHALL show a fixed header (48px) with: Title, Status, Run, Save
3. WHEN the editor loads THEN the System SHALL hide the results panel until execution
4. WHEN panels open/close THEN the System SHALL NOT cause overlapping or content shifting
5. WHEN the canvas is displayed THEN the System SHALL give it minimum 60% of viewport width

### Requirement 2: Single Set of Controls

**User Story:** As a user, I want controls in one place so that I don't see duplicates.

#### Acceptance Criteria

1. WHEN the editor loads THEN the System SHALL show Run button only in the header (remove floating toolbar)
2. WHEN the editor loads THEN the System SHALL show Save button only in the header
3. WHEN the editor loads THEN the System SHALL show Undo/Redo only in the header
4. WHEN the canvas is displayed THEN the System SHALL show only zoom controls (bottom-right corner)
5. WHEN controls are consolidated THEN the System SHALL maintain all existing functionality

### Requirement 3: Compact Operator Nodes

**User Story:** As a user, I want compact nodes so that I can see more of my pipe.

#### Acceptance Criteria

1. WHEN an operator node is displayed THEN the System SHALL show: icon, name, connection handles only
2. WHEN an operator node is collapsed THEN the System SHALL use maximum 50px height
3. WHEN the user clicks a node THEN the System SHALL open config in the right panel (not inline)
4. WHEN a node has errors THEN the System SHALL show a small red badge only
5. WHEN a node has results THEN the System SHALL show a small green indicator only

### Requirement 4: Professional Visual Design

**User Story:** As a user, I want a professional, calm interface.

#### Acceptance Criteria

1. WHEN displaying nodes THEN the System SHALL use neutral gray backgrounds (not colored per type)
2. WHEN displaying borders THEN the System SHALL use 1px light gray (not thick colored borders)
3. WHEN displaying icons THEN the System SHALL use consistent SVG icons (not emoji)
4. WHEN displaying spacing THEN the System SHALL use 8px grid (8, 16, 24, 32px gaps)
5. WHEN displaying text THEN the System SHALL use type scale (12, 14, 16, 20px only)

### Requirement 5: Code Separation

**User Story:** As a developer, I want organized code so that I can maintain it easily.

#### Acceptance Criteria

1. WHEN organizing the editor THEN the System SHALL create folder: pages/editor/
2. WHEN organizing components THEN the System SHALL split into: EditorHeader, EditorCanvas, EditorSidebar, EditorConfigPanel, EditorResultsPanel
3. WHEN organizing logic THEN the System SHALL extract into logic folder: canvas-interactions, execution-logic, saving-logic
4. WHEN a component is created THEN the System SHALL keep it under 150 lines
5. WHEN components communicate THEN the System SHALL use Redux or props (max 2 levels deep)

### Requirement 6: Responsive Behavior

**User Story:** As a user on any screen, I want the layout to adapt without breaking.

#### Acceptance Criteria

1. WHEN viewport < 1200px THEN the System SHALL collapse sidebar to icon-only (48px)
2. WHEN viewport < 900px THEN the System SHALL hide sidebar behind toggle
3. WHEN config panel opens on small screen THEN the System SHALL overlay (not push content)
4. WHEN panels collapse THEN the System SHALL give all space to canvas
5. WHEN window resizes THEN the System SHALL transition smoothly (no jumps)
