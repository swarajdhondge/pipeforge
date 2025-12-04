# Requirements Document

## Introduction

This spec addresses critical UX issues that make the pipe editor difficult to use for novice users. The current interface has several problems: oversized navigation elements, auto-expanding panels, canvas sizing issues, and a general lack of intuitive guidance. The goal is to create a "just works" experience where someone with zero technical knowledge can successfully create and run their first pipe within 5 minutes.

This is NOT about adding tooltips or documentation - it's about fundamentally simplifying the interface so that the correct action is always obvious.

## Glossary

- **System**: Yahoo Pipes 2025 platform
- **User**: Any user of the platform, particularly novice users with no prior experience
- **Canvas**: The main visual workspace where operators are placed and connected
- **Operator Palette**: The panel containing available operators to drag onto the canvas
- **Inline Config**: Configuration embedded directly within operator nodes
- **Viewport**: The visible area of the user's screen
- **Fit to View**: Automatically adjusting zoom/pan so all content is visible

## Requirements

### Requirement 1: Navigation Bar Optimization

**User Story:** As a user, I want a compact navigation bar that doesn't consume excessive screen space, so that I have maximum room for the pipe editor canvas.

#### Acceptance Criteria

1. WHEN the navigation bar is displayed THEN the System SHALL use a maximum height of 48px (reduced from current oversized state)
2. WHEN displaying navigation icons THEN the System SHALL use 20px icons with 8px padding (not oversized icons)
3. WHEN displaying navigation text THEN the System SHALL use 14px font size for menu items
4. WHEN the navigation bar is displayed on the pipe editor page THEN the System SHALL use a minimal/compact variant
5. WHEN the user scrolls the page THEN the System SHALL NOT require excessive scrolling to reach content below the navbar

### Requirement 2: Canvas Auto-Fit on Load

**User Story:** As a user opening a pipe, I want the canvas to automatically fit all content to my screen, so that I can see everything without manual zooming or panning.

#### Acceptance Criteria

1. WHEN a pipe is opened in the editor THEN the System SHALL automatically fit all nodes to the visible viewport with 10% padding
2. WHEN a new empty pipe is created THEN the System SHALL center the default Pipe Output node in the viewport
3. WHEN the browser window is resized THEN the System SHALL maintain the current view (not auto-refit, to preserve user's manual adjustments)
4. WHEN the user clicks a "Fit to View" button THEN the System SHALL re-center and zoom to fit all nodes
5. WHEN the canvas contains only one or two nodes THEN the System SHALL display them at 100% zoom centered in the viewport (not zoomed out excessively)

### Requirement 3: Operator Palette Collapsed by Default

**User Story:** As a user, I want the operator palette to be collapsed by default, so that I have maximum canvas space and can expand categories only when needed.

#### Acceptance Criteria

1. WHEN the pipe editor loads THEN the System SHALL display the operator palette with ALL categories collapsed by default
2. WHEN a user clicks a category header THEN the System SHALL expand only that category (accordion behavior)
3. WHEN a user expands a category THEN the System SHALL collapse any previously expanded category
4. WHEN the palette is displayed THEN the System SHALL use a compact width (200px max) that doesn't consume excessive canvas space
5. WHEN the user drags an operator from the palette THEN the System SHALL NOT auto-expand other categories

### Requirement 4: Stable Canvas Size

**User Story:** As a user, I want the canvas to maintain a stable size regardless of what panels are open, so that my view doesn't jump around unexpectedly.

#### Acceptance Criteria

1. WHEN the operator palette expands or collapses THEN the System SHALL NOT resize the canvas area
2. WHEN operator nodes expand their inline config THEN the System SHALL NOT cause the canvas to resize or shift
3. WHEN panels open or close THEN the System SHALL use overlay positioning (not pushing content)
4. WHEN the execution panel opens THEN the System SHALL overlay on top of the canvas (not push it)
5. WHEN any UI element changes size THEN the System SHALL maintain the user's current canvas pan/zoom position

### Requirement 5: Fix JSON Fetch Execution

**User Story:** As a user, I want to fetch JSON data and see the output, so that I can verify my pipe is working correctly.

#### Acceptance Criteria

1. WHEN a Fetch JSON operator is connected to Pipe Output and executed THEN the System SHALL display the fetched data in the Pipe Output node
2. WHEN execution completes successfully THEN the System SHALL show a preview of the data (first 5 items or 500 characters)
3. WHEN the Pipe Output receives data THEN the System SHALL display "X items received" or data preview (not empty)
4. WHEN execution produces empty results THEN the System SHALL display "No data returned" with explanation
5. WHEN the user clicks "Run" on a connected pipe THEN the System SHALL execute the full pipeline and show results

### Requirement 6: Simplified First-Time Experience

**User Story:** As a first-time user, I want the interface to guide me through creating my first pipe without requiring prior knowledge, so that I can succeed immediately.

#### Acceptance Criteria

1. WHEN a new user opens an empty canvas THEN the System SHALL display a prominent "Start Here" overlay with 3 simple steps
2. WHEN the empty canvas is displayed THEN the System SHALL show: "1. Drag a source (like Fetch JSON) from the left panel"
3. WHEN a source operator is added THEN the System SHALL highlight the connection point and show: "2. Connect it to Pipe Output"
4. WHEN the connection is made THEN the System SHALL show: "3. Click Run to see your data"
5. WHEN the user completes all 3 steps THEN the System SHALL dismiss the guidance and show a success message
6. WHEN the user clicks "Skip" or "Don't show again" THEN the System SHALL remember this preference

### Requirement 7: Visual Connection Guidance

**User Story:** As a user, I want clear visual cues showing how to connect operators, so that I don't have to guess where to click and drag.

#### Acceptance Criteria

1. WHEN an operator has an unconnected output THEN the System SHALL display a pulsing/glowing indicator on the output handle
2. WHEN the user starts dragging from an output handle THEN the System SHALL highlight all valid input handles on other nodes
3. WHEN hovering over a valid connection target THEN the System SHALL show a green highlight indicating "drop here"
4. WHEN hovering over an invalid connection target THEN the System SHALL show a red indicator with brief explanation
5. WHEN no connection exists to Pipe Output THEN the System SHALL display a persistent warning banner at the top of the canvas

### Requirement 8: Simplified Operator Nodes

**User Story:** As a user, I want operator nodes to show only essential information by default, so that the canvas isn't cluttered with details I don't need yet.

#### Acceptance Criteria

1. WHEN an operator node is displayed THEN the System SHALL show only: icon, name, and connection handles by default
2. WHEN the user clicks on an operator node THEN the System SHALL expand to show inline configuration
3. WHEN the user clicks outside an expanded node THEN the System SHALL collapse it back to compact view
4. WHEN multiple nodes are on canvas THEN the System SHALL allow only ONE node to be expanded at a time
5. WHEN a node has validation errors THEN the System SHALL show a small warning badge (not full error text) in compact mode

### Requirement 9: One-Click Run Button

**User Story:** As a user, I want a single prominent "Run" button that executes my entire pipe, so that I don't have to figure out which node to run from.

#### Acceptance Criteria

1. WHEN the canvas has a valid pipe (source connected to output) THEN the System SHALL display a prominent "Run Pipe" button in the toolbar
2. WHEN the user clicks "Run Pipe" THEN the System SHALL execute from all sources through to Pipe Output
3. WHEN the pipe is running THEN the System SHALL show a loading spinner on the Run button and disable it
4. WHEN execution completes THEN the System SHALL automatically show results in the Pipe Output node
5. WHEN the pipe has no valid path to output THEN the System SHALL disable the Run button with tooltip "Connect operators to Pipe Output first"

### Requirement 10: Inline Results Display

**User Story:** As a user, I want to see execution results directly on the canvas, so that I don't have to look for a separate panel or modal.

#### Acceptance Criteria

1. WHEN execution completes successfully THEN the System SHALL expand the Pipe Output node to show results preview
2. WHEN results are displayed THEN the System SHALL show: item count, first 3-5 items in a readable format
3. WHEN the user wants to see full results THEN the System SHALL provide a "View All" button that opens a modal with full data
4. WHEN results are JSON THEN the System SHALL format them with syntax highlighting and collapsible sections
5. WHEN an operator fails THEN the System SHALL show the error message directly on that operator node (not just in a toast)

### Requirement 11: Responsive Canvas Layout

**User Story:** As a user on any screen size, I want the canvas to adapt to my viewport, so that I can work effectively on laptop, desktop, or tablet.

#### Acceptance Criteria

1. WHEN the editor loads THEN the System SHALL calculate available canvas space based on viewport minus navbar and any fixed panels
2. WHEN the viewport is less than 1200px wide THEN the System SHALL collapse the operator palette to icon-only mode
3. WHEN the viewport is less than 900px wide THEN the System SHALL hide the operator palette behind a toggle button
4. WHEN the user is on a small screen THEN the System SHALL prioritize canvas space over panel visibility
5. WHEN the canvas area is calculated THEN the System SHALL use CSS calc() or flexbox to ensure no overflow/scrolling issues

### Requirement 12: Contextual Help (Not Tooltips)

**User Story:** As a user who is stuck, I want contextual help that appears when I need it, so that I can get unstuck without reading documentation.

#### Acceptance Criteria

1. WHEN the user hovers over an empty URL field for 3+ seconds THEN the System SHALL show an inline hint: "Paste a URL like https://api.example.com/data.json"
2. WHEN the user has an unconnected operator for 10+ seconds THEN the System SHALL show a subtle hint arrow pointing to Pipe Output
3. WHEN the user clicks Run with an invalid pipe THEN the System SHALL highlight the specific problem (not just show an error)
4. WHEN the user right-clicks on the canvas THEN the System SHALL show a context menu with common actions
5. WHEN the user presses "?" key THEN the System SHALL show a quick reference card (not a full help page)

### Requirement 13: Error Prevention Over Error Messages

**User Story:** As a user, I want the system to prevent me from making mistakes rather than just telling me after, so that I don't get frustrated by error messages.

#### Acceptance Criteria

1. WHEN the user tries to connect an output to another output THEN the System SHALL visually indicate this is not possible (gray out, shake animation)
2. WHEN the user tries to create a circular connection THEN the System SHALL prevent the connection and briefly flash the cycle path
3. WHEN the user enters an invalid URL THEN the System SHALL show inline validation as they type (not after submit)
4. WHEN the user tries to run without a connection to output THEN the System SHALL highlight the missing connection instead of showing an error
5. WHEN a required field is empty THEN the System SHALL show a placeholder with example value (not just "Required")

### Requirement 14: Sensible Defaults

**User Story:** As a user, I want operators to have sensible default configurations, so that they work out of the box for common use cases.

#### Acceptance Criteria

1. WHEN a Fetch JSON operator is added THEN the System SHALL pre-fill with a working example URL (jsonplaceholder.typicode.com/posts)
2. WHEN a Filter operator is added THEN the System SHALL default to "Permit" mode with "any" matching
3. WHEN a Sort operator is added THEN the System SHALL default to ascending order
4. WHEN a Truncate operator is added THEN the System SHALL default to 10 items
5. WHEN any operator is added THEN the System SHALL be immediately executable with defaults (no required empty fields)

### Requirement 15: Progressive Disclosure

**User Story:** As a user, I want advanced options hidden until I need them, so that the interface stays simple for basic use cases.

#### Acceptance Criteria

1. WHEN a Fetch operator is displayed THEN the System SHALL show only URL field by default, with "Advanced" toggle for headers/auth
2. WHEN a Filter operator is displayed THEN the System SHALL show one rule by default, with "+ Add Rule" for more
3. WHEN operator categories are displayed THEN the System SHALL show "Common" operators first (Fetch JSON, Filter, Sort)
4. WHEN the user is a first-time user THEN the System SHALL hide advanced operators (Regex, URL Builder) behind "Show All" toggle
5. WHEN the user has created 5+ pipes THEN the System SHALL show all operators by default (they're no longer a novice)

