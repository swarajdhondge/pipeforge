# Requirements Document

## Introduction

This spec transforms our current basic pipe editor into a true Yahoo Pipes-style visual data mashup tool. The goal is to replicate the core Yahoo Pipes experience with modern technology: dynamic schema propagation, inline operator configuration, categorized modules, user input parameters, and proper tree-based execution.

Yahoo Pipes was revolutionary because it let non-programmers visually connect data sources, transform them, and output clean feeds. We're resurrecting that experience with 2025 tech while staying true to the original's simplicity and power.

## Glossary

- **Schema**: The structure of data (field names and types) flowing through a pipe
- **Schema Propagation**: Passing discovered field information from upstream operators to downstream operators
- **Inline Config**: Configuration UI embedded directly in the operator node (not a side panel)
- **Source Operator**: An operator that fetches external data (no input connection)
- **User Input Operator**: An operator that accepts user-provided parameters at runtime
- **Transformation Operator**: An operator that modifies data flowing through it
- **Upstream**: Operators that come before (provide input to) the current operator
- **Downstream**: Operators that come after (receive output from) the current operator
- **Preview**: A test fetch to discover data schema before full execution
- **Run Selected**: Execute the pipe from a specific operator back through all its upstream sources

## Requirements

### Requirement 1: Dynamic Schema Propagation

**User Story:** As a pipe builder, I want downstream operators to automatically know what fields are available from upstream data, so that I can select fields from dropdowns instead of typing them manually.

#### Acceptance Criteria

1. WHEN a Source operator (Fetch JSON, Fetch CSV, Fetch RSS) has a valid URL configured THEN the System SHALL provide a "Preview" button that fetches sample data and extracts the schema
2. WHEN a Preview is executed successfully THEN the System SHALL extract all field paths (including nested fields using dot notation) and store them as the operator's output schema
3. WHEN an operator is connected downstream of another operator THEN the System SHALL make the upstream operator's output schema available to the downstream operator
4. WHEN configuring a Filter, Sort, or Transform operator THEN the System SHALL display field selection as dropdowns populated with available upstream fields
5. WHEN no upstream schema is available THEN the System SHALL allow manual text input for field names as a fallback
6. WHEN the upstream operator's schema changes THEN the System SHALL update downstream operators' field dropdowns automatically

### Requirement 2: Inline Operator Configuration

**User Story:** As a pipe builder, I want to configure operators directly on the canvas node (like Yahoo Pipes), so that I can see and edit settings without a separate side panel.

#### Acceptance Criteria

1. WHEN an operator node is displayed on the canvas THEN the System SHALL render its configuration UI inline within the node body
2. WHEN a Fetch operator is displayed THEN the System SHALL show URL input field and Preview button inline
3. WHEN a Filter operator is displayed THEN the System SHALL show Permit/Block toggle, match mode (any/all), and rules list inline
4. WHEN a Sort operator is displayed THEN the System SHALL show field dropdown and direction toggle inline
5. WHEN the user edits inline configuration THEN the System SHALL save changes immediately without requiring a separate save action
6. WHEN the side panel configuration component exists THEN the System SHALL remove it from the codebase

### Requirement 3: Source Operators

**User Story:** As a pipe builder, I want multiple source types (JSON, CSV, RSS, HTML), so that I can fetch data from various formats and services.

#### Acceptance Criteria

1. WHEN a user adds a Fetch JSON operator THEN the System SHALL fetch the URL and parse the response as JSON
2. WHEN a user adds a Fetch CSV operator THEN the System SHALL fetch the URL and parse CSV data into JSON array format
3. WHEN a user adds a Fetch RSS operator THEN the System SHALL fetch the URL and parse RSS/Atom feeds into a normalized JSON structure with title, link, description, pubDate fields
4. WHEN a user adds a Fetch Page operator THEN the System SHALL fetch HTML content and provide CSS selector extraction capabilities
5. WHEN any Fetch operator encounters an error THEN the System SHALL display a clear error message on the operator node
6. WHEN a Fetch operator is added to the canvas THEN the System SHALL NOT allow incoming connections (sources have no input handle)

### Requirement 4: User Input Operators

**User Story:** As a pipe builder, I want to create parameterized pipes with user inputs, so that the same pipe can work for different search terms, URLs, or values without editing the structure.

#### Acceptance Criteria

1. WHEN a user adds a Text Input operator THEN the System SHALL provide a text field that can be wired to other operators
2. WHEN a user adds a Number Input operator THEN the System SHALL provide a numeric field with optional min/max constraints
3. WHEN a user adds a URL Input operator THEN the System SHALL provide a URL field with validation
4. WHEN a user adds a Date Input operator THEN the System SHALL provide a date picker field
5. WHEN a User Input operator is wired to another operator's configuration THEN the System SHALL use the input value during execution
6. WHEN a pipe with User Inputs is executed THEN the System SHALL prompt the user to provide values for all inputs before running

### Requirement 5: Enhanced Filter Operator

**User Story:** As a pipe builder, I want Yahoo Pipes-style filtering with Permit/Block modes and multiple rules, so that I can include or exclude items based on complex conditions.

#### Acceptance Criteria

1. WHEN configuring a Filter operator THEN the System SHALL provide a Permit/Block toggle (Permit = include matching, Block = exclude matching)
2. WHEN configuring a Filter operator THEN the System SHALL provide an "any/all" toggle for rule matching (any = OR logic, all = AND logic)
3. WHEN adding a filter rule THEN the System SHALL show a field dropdown populated from upstream schema
4. WHEN adding a filter rule THEN the System SHALL provide operators: equals, not equals, contains, does not contain, greater than, less than, matches regex
5. WHEN multiple rules are configured with "all" mode THEN the System SHALL only pass items matching ALL rules
6. WHEN multiple rules are configured with "any" mode THEN the System SHALL pass items matching ANY rule

### Requirement 6: Enhanced Sort Operator

**User Story:** As a pipe builder, I want to sort by fields discovered from upstream data, so that I don't have to guess or type field names.

#### Acceptance Criteria

1. WHEN configuring a Sort operator THEN the System SHALL show a field dropdown populated from upstream schema
2. WHEN configuring a Sort operator THEN the System SHALL provide ascending/descending direction toggle
3. WHEN sorting by a date field THEN the System SHALL parse and compare dates correctly
4. WHEN sorting by a numeric field THEN the System SHALL compare values numerically (not as strings)
5. WHEN the selected sort field doesn't exist in an item THEN the System SHALL place that item at the end of the sorted list

### Requirement 7: Additional Transformation Operators

**User Story:** As a pipe builder, I want more transformation options (Unique, Truncate, Tail, Rename), so that I can reshape data like Yahoo Pipes allowed.

#### Acceptance Criteria

1. WHEN a user adds a Unique operator THEN the System SHALL deduplicate items based on a selected field
2. WHEN a user adds a Truncate operator THEN the System SHALL keep only the first N items (configurable count)
3. WHEN a user adds a Tail operator THEN the System SHALL keep only the last N items or skip the first N items
4. WHEN a user adds a Rename operator THEN the System SHALL allow renaming fields (source field → target field name)
5. WHEN a Rename operation specifies a non-existent source field THEN the System SHALL skip that rename without error

### Requirement 8: URL Builder Operator

**User Story:** As a pipe builder, I want to construct dynamic URLs from base URL and query parameters, so that I can combine user inputs into API request URLs.

#### Acceptance Criteria

1. WHEN a user adds a URL Builder operator THEN the System SHALL provide base URL input and parameter key/value pairs
2. WHEN parameter values are wired from User Input operators THEN the System SHALL substitute those values during execution
3. WHEN the URL Builder executes THEN the System SHALL properly encode query parameters
4. WHEN the URL Builder output is wired to a Fetch operator THEN the System SHALL use the constructed URL for fetching

### Requirement 9: String Operators

**User Story:** As a pipe builder, I want string manipulation operators (Replace, Regex, Substring), so that I can clean and transform text fields.

#### Acceptance Criteria

1. WHEN a user adds a String Replace operator THEN the System SHALL replace occurrences of a search string with a replacement string in a specified field
2. WHEN a user adds a Regex operator THEN the System SHALL apply a regex pattern to extract or replace content in a specified field
3. WHEN a user adds a Substring operator THEN the System SHALL extract a portion of a string field by start/end indices
4. WHEN a regex pattern is invalid THEN the System SHALL display an error on the operator node
5. WHEN the target field doesn't exist THEN the System SHALL skip the operation without error

### Requirement 10: Tree-Based Execution Engine

**User Story:** As a pipe builder, I want to execute from any operator and have it trace back through all upstream sources, so that I can test parts of complex pipes.

#### Acceptance Criteria

1. WHEN a user clicks "Run Selected" on an operator THEN the System SHALL identify all upstream operators by traversing connections backward
2. WHEN executing from a selected operator THEN the System SHALL execute all upstream sources first, then process through the chain to the selected operator
3. WHEN an operator has no upstream connection and is not a Source THEN the System SHALL display an error indicating missing input
4. WHEN execution completes THEN the System SHALL display the result data on the selected operator node
5. WHEN execution fails at any operator THEN the System SHALL display the error on that specific operator and stop execution

### Requirement 11: Operator Palette Organization

**User Story:** As a pipe builder, I want operators organized by category (Sources, User Inputs, Operators, String, URL), so that I can find what I need quickly.

#### Acceptance Criteria

1. WHEN the operator palette is displayed THEN the System SHALL group operators into collapsible categories: Sources, User Inputs, Operators, String, URL
2. WHEN a category is collapsed THEN the System SHALL show only the category header
3. WHEN a category is expanded THEN the System SHALL show all operators in that category
4. WHEN dragging an operator from the palette THEN the System SHALL create the appropriate operator type on the canvas
5. WHEN hovering over an operator in the palette THEN the System SHALL show a tooltip describing what the operator does

### Requirement 12: Production Security

**User Story:** As a platform operator, I want the production build to not expose source code in browser dev tools, so that our implementation details remain protected.

#### Acceptance Criteria

1. WHEN building for production THEN the System SHALL disable source maps
2. WHEN building for production THEN the System SHALL minify all JavaScript code
3. WHEN building for production THEN the System SHALL remove console.log statements
4. WHEN inspecting the production bundle in browser dev tools THEN the System SHALL NOT show original TypeScript/React source code
5. WHEN the side panel configuration code is no longer used THEN the System SHALL remove it from the codebase entirely

### Requirement 13: Pipe Output Node

**User Story:** As a pipe builder, I want a dedicated Pipe Output node that marks the final output of my pipe, so that execution knows where to stop and what to return.

#### Acceptance Criteria

1. WHEN a new pipe is created THEN the System SHALL automatically add a Pipe Output node to the canvas
2. WHEN executing a full pipe THEN the System SHALL execute from sources through to the Pipe Output node
3. WHEN the Pipe Output node receives data THEN the System SHALL display a preview of the output data
4. WHEN a pipe has no connection to Pipe Output THEN the System SHALL warn the user that the pipe has no output
5. WHEN the Pipe Output node is deleted THEN the System SHALL allow re-adding it from the palette

### Requirement 14: Connection Validation

**User Story:** As a pipe builder, I want the system to prevent invalid connections, so that I don't create pipes that can't execute.

#### Acceptance Criteria

1. WHEN attempting to connect to a Source operator's input THEN the System SHALL reject the connection (sources have no input)
2. WHEN attempting to create a second input connection to an operator THEN the System SHALL reject the connection (single input only)
3. WHEN attempting to create a circular connection THEN the System SHALL reject the connection and display a warning
4. WHEN a valid connection is made THEN the System SHALL trigger schema propagation to the downstream operator
5. WHEN a connection is deleted THEN the System SHALL clear the downstream operator's cached upstream schema

### Requirement 15: Operator Configuration Validation

**User Story:** As a pipe builder, I want immediate feedback when my operator configuration is invalid, so that I can fix issues before execution.

#### Acceptance Criteria

1. WHEN a required field is empty THEN the System SHALL display a visual indicator (red border, warning icon) on that field
2. WHEN a URL field contains an invalid URL format THEN the System SHALL display an inline error message
3. WHEN a regex pattern is invalid THEN the System SHALL display an error message explaining the issue
4. WHEN a numeric field contains non-numeric input THEN the System SHALL reject the input and show an error
5. WHEN an operator has validation errors THEN the System SHALL display a warning badge on the operator node header
6. WHEN attempting to execute a pipe with validation errors THEN the System SHALL block execution and highlight all invalid operators

### Requirement 16: Execution Error Handling

**User Story:** As a pipe builder, I want clear error messages when execution fails, so that I can understand and fix the problem.

#### Acceptance Criteria

1. WHEN a Fetch operator fails due to network error THEN the System SHALL display "Network error: Unable to reach [domain]" on the operator node
2. WHEN a Fetch operator receives non-JSON response THEN the System SHALL display "Invalid response: Expected JSON but received [content-type]"
3. WHEN a Fetch operator times out THEN the System SHALL display "Request timeout: The request took longer than 30 seconds"
4. WHEN a Filter operator encounters a missing field THEN the System SHALL skip that item and continue (not fail the entire execution)
5. WHEN a Transform operator encounters a type mismatch THEN the System SHALL display "Type error: Cannot apply [operation] to [type]"
6. WHEN any operator fails THEN the System SHALL stop execution, mark that operator as failed (red), and preserve successful upstream results
7. WHEN execution fails THEN the System SHALL provide a "Retry" button on the failed operator

### Requirement 17: Security Guardrails

**User Story:** As a platform operator, I want security checks at every step, so that malicious or dangerous operations are blocked.

#### Acceptance Criteria

1. WHEN a Fetch operator URL points to localhost or private IP ranges THEN the System SHALL reject the URL with "Security error: Private networks are not allowed"
2. WHEN a Fetch operator URL is not in the domain whitelist THEN the System SHALL reject with "Domain not allowed: [domain] is not in the approved list"
3. WHEN a Regex operator pattern could cause catastrophic backtracking THEN the System SHALL reject with "Invalid regex: Pattern may cause performance issues"
4. WHEN a Fetch Page operator attempts to execute JavaScript THEN the System SHALL strip all script tags and not execute any JS
5. WHEN a pipe execution exceeds 5 minutes THEN the System SHALL terminate execution with "Execution timeout: Pipe took too long to complete"
6. WHEN a single operator output exceeds 1MB THEN the System SHALL truncate and warn "Output truncated: Data exceeded 1MB limit"
7. WHEN a user attempts to create more than 50 operators in a single pipe THEN the System SHALL block with "Limit reached: Maximum 50 operators per pipe"
8. WHEN secrets are used in Fetch operators THEN the System SHALL never log or display the decrypted secret value

### Requirement 18: Backend API Validation

**User Story:** As a developer, I want all API endpoints to validate inputs strictly, so that invalid data never reaches the database or execution engine.

#### Acceptance Criteria

1. WHEN a pipe definition is saved THEN the Backend SHALL validate all operator types are registered and known
2. WHEN a pipe definition is saved THEN the Backend SHALL validate all connections reference existing node IDs
3. WHEN a pipe definition is saved THEN the Backend SHALL validate no circular dependencies exist
4. WHEN a pipe definition contains unknown operator types THEN the Backend SHALL reject with 400 Bad Request
5. WHEN an execution request references a non-existent pipe THEN the Backend SHALL return 404 Not Found
6. WHEN an execution request is made by a user who doesn't own the pipe (and pipe is private) THEN the Backend SHALL return 403 Forbidden
7. WHEN any API request contains malformed JSON THEN the Backend SHALL return 400 Bad Request with clear error message

### Requirement 19: Frontend-Backend Synchronization

**User Story:** As a pipe builder, I want the UI to stay in sync with the backend state, so that I never see stale data or lose my work.

#### Acceptance Criteria

1. WHEN a pipe is saved successfully THEN the Frontend SHALL update the local state to match the server response
2. WHEN a save operation fails THEN the Frontend SHALL display an error toast and preserve the local changes for retry
3. WHEN the user's session expires during editing THEN the Frontend SHALL prompt to re-authenticate without losing canvas state
4. WHEN loading a pipe from the server THEN the Frontend SHALL validate the definition structure before rendering
5. WHEN the server returns an operator type the frontend doesn't recognize THEN the Frontend SHALL display a placeholder node with "Unknown operator" message
6. WHEN execution status updates THEN the Frontend SHALL poll or receive WebSocket updates to show real-time progress
7. WHEN multiple browser tabs edit the same pipe THEN the Frontend SHALL warn about potential conflicts on save

### Requirement 20: UI/UX Consistency

**User Story:** As a pipe builder, I want a consistent and intuitive interface, so that I can work efficiently without confusion.

#### Acceptance Criteria

1. WHEN any operation is in progress THEN the System SHALL display a loading indicator (spinner, skeleton, or progress bar)
2. WHEN an operation succeeds THEN the System SHALL display a success toast notification
3. WHEN an operation fails THEN the System SHALL display an error toast with actionable message
4. WHEN hovering over any interactive element THEN the System SHALL display a tooltip explaining its function
5. WHEN an operator node is in error state THEN the System SHALL use consistent red styling (border, icon, background tint)
6. WHEN an operator node is executing THEN the System SHALL use consistent blue/pulsing animation
7. WHEN an operator node completed successfully THEN the System SHALL use consistent green checkmark indicator
8. WHEN the canvas is empty THEN the System SHALL display helpful onboarding text: "Drag operators from the palette to get started"
9. WHEN a destructive action is requested (delete pipe, delete operator) THEN the System SHALL show a confirmation dialog

### Requirement 21: Operator Type Safety

**User Story:** As a developer, I want strict type definitions for all operators, so that TypeScript catches errors at compile time.

#### Acceptance Criteria

1. WHEN defining a new operator THEN the Developer SHALL implement the IOperator interface with type, execute, and validate methods
2. WHEN an operator config is accessed THEN the System SHALL use typed interfaces (FetchConfig, FilterConfig, SortConfig, etc.)
3. WHEN schema is propagated THEN the System SHALL use a typed SchemaField interface with name, type, and nested fields
4. WHEN execution context is passed THEN the System SHALL use typed ExecutionContext interface
5. WHEN operator registry is accessed THEN the System SHALL return properly typed IOperator instances
6. WHEN frontend components render operator config THEN the Components SHALL use typed props matching backend operator configs

### Requirement 22: Graceful Degradation

**User Story:** As a pipe builder, I want the system to handle edge cases gracefully, so that one bad piece of data doesn't break my entire pipe.

#### Acceptance Criteria

1. WHEN a Fetch returns empty array THEN the System SHALL pass empty array to downstream operators (not fail)
2. WHEN a Filter matches zero items THEN the System SHALL pass empty array downstream (not fail)
3. WHEN a Sort field is missing from some items THEN the System SHALL sort available items and append items without the field at the end
4. WHEN a Transform source field doesn't exist THEN the System SHALL skip that mapping and continue with others
5. WHEN a CSV has inconsistent columns THEN the System SHALL use the header row as schema and fill missing values with null
6. WHEN an RSS feed has missing optional fields THEN the System SHALL use empty string or null for those fields
7. WHEN upstream schema is unavailable THEN the System SHALL allow manual field entry as fallback
