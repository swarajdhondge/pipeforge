# Core Pipe Engine - Requirements

## Problem Statement

Users need to:
- **Create data workflows visually** (drag & drop operators, connect them)
- **Fetch data from APIs** (HTTP requests to public endpoints)
- **Transform data** (filter, sort, map/transform JSON)
- **Execute pipes** (run workflows and see results)
- **Save and share pipes** (store permanently, make public/private)
- **Version pipes** (keep history, restore previous versions)

**Key Insight:** Like original Yahoo Pipes - visual programming for data mashups without writing code.

## Target Users

- Developers building data workflows
- Data analysts aggregating data from multiple sources
- Content creators combining feeds
- Anyone who wants to automate data processing without coding

## User Flows

### Anonymous User (Try Before Signup)
- ✅ Browse public pipes
- ✅ View pipe details (see the visual workflow)
- ✅ Fork public pipes (copy to localStorage)
- ✅ Create pipes (stored in localStorage)
- ✅ Execute pipes (up to 5 executions - from user-auth)
- ❌ Cannot save pipes permanently
- ❌ Cannot make pipes public

### Authenticated User
- ✅ Everything anonymous users can do
- ✅ Save pipes permanently to database
- ✅ Make pipes public/private
- ✅ Unlimited executions
- ✅ Version history (last 5 versions)
- ✅ Edit own pipes
- ✅ Delete own pipes
- ✅ View execution history

## Acceptance Criteria

### Requirement 1: Pipe CRUD Operations

**User Story:** As a user, I want to create, save, and manage pipes, so that I can build and organize my data workflows.

#### Acceptance Criteria

1. WHEN a user creates a new pipe THEN the system SHALL initialize an empty canvas with a unique pipe ID
2. WHEN a user saves a pipe THEN the system SHALL store the pipe definition (nodes, edges, metadata) in the database
3. WHEN a user loads a pipe THEN the system SHALL restore the canvas state from the stored definition
4. WHEN a user updates a pipe THEN the system SHALL save a new version and keep the last 5 versions
5. WHEN a user deletes a pipe THEN the system SHALL remove the pipe and all its versions from the database
6. WHEN an authenticated user saves a pipe THEN the system SHALL associate it with their user ID
7. WHEN an anonymous user creates a pipe THEN the system SHALL store it in localStorage with a warning

### Requirement 2: Visual Editor - Canvas

**User Story:** As a user, I want to work with a visual canvas, so that I can see and manipulate my data workflow.

#### Acceptance Criteria

1. WHEN a user opens the editor THEN the system SHALL display a zoomable and pannable canvas
2. WHEN a user zooms in/out THEN the system SHALL scale the canvas while maintaining operator positions
3. WHEN a user pans the canvas THEN the system SHALL move the viewport smoothly
4. WHEN a user performs an action THEN the system SHALL support undo/redo for that action
5. WHEN a user adds an operator THEN the system SHALL place it at the center of the current viewport
6. WHEN the canvas is empty THEN the system SHALL show helpful text guiding the user to add operators

### Requirement 3: Operator Palette

**User Story:** As a user, I want to add operators to my pipe, so that I can build data processing workflows.

#### Acceptance Criteria

1. WHEN a user opens the editor THEN the system SHALL display an operator palette in the left sidebar
2. WHEN a user drags an operator from the palette THEN the system SHALL create a new operator node on the canvas
3. WHEN a user clicks an operator in the palette THEN the system SHALL add it to the center of the canvas
4. WHEN displaying operators THEN the system SHALL group them by category (Data Sources, Filters, Transforms, Output)
5. WHEN an operator is added THEN the system SHALL assign it a unique ID and default configuration

### Requirement 4: Operator Configuration

**User Story:** As a user, I want to configure operators, so that I can customize how they process data.

#### Acceptance Criteria

1. WHEN a user selects an operator THEN the system SHALL display its configuration panel in the right sidebar
2. WHEN a user changes operator settings THEN the system SHALL validate the input and show errors if invalid
3. WHEN a user saves operator configuration THEN the system SHALL update the operator node with the new settings
4. WHEN an operator has invalid configuration THEN the system SHALL visually indicate the error on the node
5. WHEN no operator is selected THEN the system SHALL show pipe-level settings in the right sidebar

### Requirement 5: Connecting Operators

**User Story:** As a user, I want to connect operators, so that data flows from one operator to another.

#### Acceptance Criteria

1. WHEN a user drags from an operator's output handle THEN the system SHALL show a connection line following the cursor
2. WHEN a user connects two operators THEN the system SHALL create an edge between them
3. WHEN a user attempts an invalid connection THEN the system SHALL reject it and show an error message
4. WHEN a user deletes a connection THEN the system SHALL remove the edge from the pipe definition
5. WHEN operators are connected THEN the system SHALL show the data flow direction visually with arrow markers
6. WHEN a user hovers over an edge THEN the system SHALL highlight the edge to indicate it can be selected
7. WHEN a user clicks on an edge THEN the system SHALL select the edge and display a visual selection indicator
8. WHEN an edge is selected AND the user presses Delete or Backspace THEN the system SHALL remove the edge from the canvas
9. WHEN a user attempts to connect an operator to itself THEN the system SHALL reject the connection and show "Cannot connect operator to itself"
10. WHEN a user attempts to create a connection that would form a cycle THEN the system SHALL reject the connection and show "Cycle detected in pipe definition"

### Requirement 6: Fetch Operator

**User Story:** As a user, I want to fetch data from URLs, so that I can bring external data into my pipe.

#### Acceptance Criteria

1. WHEN a user configures a Fetch operator THEN the system SHALL require a valid URL
2. WHEN a Fetch operator executes THEN the system SHALL make an HTTP GET request to the configured URL
3. WHEN the HTTP request succeeds THEN the system SHALL parse the response as JSON
4. WHEN the HTTP request fails THEN the system SHALL return an error with the HTTP status code
5. WHEN the response is not valid JSON THEN the system SHALL return a parsing error
6. WHEN a Fetch operator executes THEN the system SHALL enforce a 30-second timeout
7. WHEN a Fetch operator executes THEN the system SHALL respect rate limits (max 10 requests per minute per user)

### Requirement 7: Filter Operator

**User Story:** As a user, I want to filter data, so that I can keep only the items I need.

#### Acceptance Criteria

1. WHEN a user configures a Filter operator THEN the system SHALL allow defining filter rules (field, operator, value)
2. WHEN a Filter operator receives an array THEN the system SHALL apply the filter rules to each item
3. WHEN an item matches the filter rules THEN the system SHALL include it in the output
4. WHEN an item does not match the filter rules THEN the system SHALL exclude it from the output
5. WHEN a Filter operator receives non-array data THEN the system SHALL return an error
6. WHEN multiple filter rules are defined THEN the system SHALL apply them with AND logic

### Requirement 8: Sort Operator

**User Story:** As a user, I want to sort data, so that I can order items by specific fields.

#### Acceptance Criteria

1. WHEN a user configures a Sort operator THEN the system SHALL allow selecting a field and sort direction (asc/desc)
2. WHEN a Sort operator receives an array THEN the system SHALL sort items by the specified field
3. WHEN sorting ascending THEN the system SHALL order items from lowest to highest
4. WHEN sorting descending THEN the system SHALL order items from highest to lowest
5. WHEN the specified field does not exist on an item THEN the system SHALL place that item at the end
6. WHEN a Sort operator receives non-array data THEN the system SHALL return an error

### Requirement 9: Transform Operator

**User Story:** As a user, I want to transform data, so that I can reshape and modify the data structure.

#### Acceptance Criteria

1. WHEN a user configures a Transform operator THEN the system SHALL allow defining field mappings (source → target)
2. WHEN a Transform operator receives data THEN the system SHALL apply the field mappings to create new objects
3. WHEN a mapping references a nested field THEN the system SHALL support dot notation (e.g., "user.name")
4. WHEN a Transform operator receives an array THEN the system SHALL apply the transformation to each item
5. WHEN a Transform operator receives a single object THEN the system SHALL apply the transformation to that object
6. WHEN a mapped field does not exist THEN the system SHALL set the target field to null

### Requirement 10: Pipe Execution (Synchronous)

**User Story:** As a user, I want to execute pipes quickly, so that I can see results immediately for simple workflows.

#### Acceptance Criteria

1. WHEN a user clicks "Run" on a simple pipe THEN the system SHALL execute it synchronously and return results within 30 seconds
2. WHEN execution completes THEN the system SHALL display the final output in the results panel
3. WHEN execution fails THEN the system SHALL show the error message and highlight the failed operator
4. WHEN execution is in progress THEN the system SHALL show a progress indicator
5. WHEN an operator completes THEN the system SHALL visually indicate its completion status
6. WHEN a pipe has no operators THEN the system SHALL prevent execution and show an error

### Requirement 11: Pipe Execution (Asynchronous)

**User Story:** As a user, I want to execute long-running pipes, so that I can process complex workflows without timeouts.

#### Acceptance Criteria

1. WHEN a user clicks "Run" on a complex pipe THEN the system SHALL queue it for asynchronous execution
2. WHEN a pipe is queued THEN the system SHALL return an execution ID immediately
3. WHEN execution is in progress THEN the system SHALL allow the user to poll for status updates
4. WHEN execution completes THEN the system SHALL store the results and notify the user
5. WHEN execution fails THEN the system SHALL store the error and notify the user
6. WHEN a pipe takes longer than 5 minutes THEN the system SHALL terminate it and return a timeout error

### Requirement 12: Execution Results

**User Story:** As a user, I want to see execution results, so that I can verify my pipe works correctly.

#### Acceptance Criteria

1. WHEN execution completes THEN the system SHALL display the final output in JSON format
2. WHEN a user clicks an operator THEN the system SHALL show that operator's output in the configuration panel
3. WHEN results are large THEN the system SHALL paginate or truncate the display
4. WHEN results contain errors THEN the system SHALL highlight the error message
5. WHEN a user copies results THEN the system SHALL format them as valid JSON

### Requirement 13: Pipe Versioning

**User Story:** As a user, I want to keep version history, so that I can restore previous versions if needed.

#### Acceptance Criteria

1. WHEN a user saves a pipe THEN the system SHALL create a new version with a timestamp
2. WHEN a pipe has more than 5 versions THEN the system SHALL delete the oldest version
3. WHEN a user views version history THEN the system SHALL display the last 5 versions with timestamps
4. WHEN a user restores a previous version THEN the system SHALL load that version's definition onto the canvas
5. WHEN a user restores a version THEN the system SHALL create a new version (not overwrite current)

### Requirement 14: Browse Pipes

**User Story:** As a user, I want to browse public pipes, so that I can discover and learn from others' workflows.

#### Acceptance Criteria

1. WHEN a user visits the browse page THEN the system SHALL display public pipes in a grid layout
2. WHEN displaying pipes THEN the system SHALL show pipe name, description, author, and last updated date
3. WHEN a user searches THEN the system SHALL filter pipes by name or description
4. WHEN a user clicks a pipe THEN the system SHALL navigate to the pipe detail page
5. WHEN pipes are displayed THEN the system SHALL paginate results (20 per page)

### Requirement 15: Pipe Detail Page

**User Story:** As a user, I want to view pipe details, so that I can understand what a pipe does before forking it.

#### Acceptance Criteria

1. WHEN a user views a pipe detail page THEN the system SHALL display the pipe name, description, and author
2. WHEN viewing a public pipe THEN the system SHALL show a read-only preview of the visual workflow
3. WHEN viewing own pipe THEN the system SHALL show "Edit" and "Delete" buttons
4. WHEN viewing another user's pipe THEN the system SHALL show a "Fork" button
5. WHEN a user forks a pipe THEN the system SHALL create a copy owned by the user

### Requirement 16: Pipe Metadata

**User Story:** As a user, I want to set pipe metadata, so that I can organize and describe my pipes.

#### Acceptance Criteria

1. WHEN a user creates a pipe THEN the system SHALL prompt for a name and description
2. WHEN a user saves a pipe THEN the system SHALL require a non-empty name
3. WHEN an authenticated user saves a pipe THEN the system SHALL allow setting public/private visibility
4. WHEN a pipe is public THEN the system SHALL make it visible in the browse page
5. WHEN a pipe is private THEN the system SHALL only show it to the owner

### Requirement 17: Error Handling

**User Story:** As a user, I want clear error messages, so that I can fix issues in my pipes.

#### Acceptance Criteria

1. WHEN an operator fails THEN the system SHALL display the error message on the operator node
2. WHEN execution fails THEN the system SHALL show which operator failed and why
3. WHEN configuration is invalid THEN the system SHALL show validation errors inline
4. WHEN a network request fails THEN the system SHALL show the HTTP status code and message
5. WHEN an unexpected error occurs THEN the system SHALL log it and show a generic error message

### Requirement 18: Auto-save

**User Story:** As a user, I want auto-save, so that I don't lose my work if I forget to save.

#### Acceptance Criteria

1. WHEN a user makes changes THEN the system SHALL auto-save a draft every 30 seconds
2. WHEN a user returns to a pipe THEN the system SHALL load the latest draft
3. WHEN a user manually saves THEN the system SHALL create a new version (not just update draft)
4. WHEN a user has unsaved changes and navigates away THEN the system SHALL warn them
5. WHEN an anonymous user makes changes THEN the system SHALL save drafts to localStorage

### Requirement 19: Pipe Discovery & Social Features

**User Story:** As a user, I want to discover relevant pipes and see what's popular, so that I can learn from others and find useful workflows.

#### Acceptance Criteria

1. WHEN a user creates a pipe THEN the system SHALL allow adding tags (e.g., "weather", "news", "data-analysis")
2. WHEN a user views a public pipe THEN the system SHALL display tags, author, creation date, and usage count
3. WHEN a user likes a pipe THEN the system SHALL increment the like count and record the user's like
4. WHEN a user unlikes a pipe THEN the system SHALL decrement the like count and remove the user's like
5. WHEN a user views the browse page THEN the system SHALL show sorting options (Most Popular, Most Recent, Most Used)
6. WHEN displaying "Most Popular" THEN the system SHALL sort pipes by like count descending
7. WHEN displaying "Most Used" THEN the system SHALL sort pipes by execution count descending
8. WHEN a user filters by tag THEN the system SHALL show only pipes with that tag
9. WHEN a user clicks on an author name THEN the system SHALL navigate to that user's profile page
10. WHEN viewing a user profile THEN the system SHALL display all public pipes by that user
11. WHEN a pipe is executed THEN the system SHALL increment its usage count
12. WHEN a user searches pipes THEN the system SHALL search by name, description, and tags

### Requirement 20: Trending & Featured Pipes

**User Story:** As a user, I want to see trending and featured pipes, so that I can discover high-quality workflows.

#### Acceptance Criteria

1. WHEN a user visits the home page THEN the system SHALL display a "Trending" section with top 5 pipes
2. WHEN calculating trending THEN the system SHALL use a combination of recent likes and executions (last 7 days)
3. WHEN a user visits the browse page THEN the system SHALL show a "Featured" filter option
4. WHEN an admin marks a pipe as featured THEN the system SHALL display it in the featured section
5. WHEN displaying featured pipes THEN the system SHALL show a "Featured" badge on the pipe card

### Requirement 21: Integration with Existing Auth System

**User Story:** As a developer, I want the pipe engine to integrate with the existing auth system, so that users have a seamless experience.

#### Acceptance Criteria

1. WHEN a user creates a pipe THEN the system SHALL use the existing JWT authentication to identify the user
2. WHEN a user saves a pipe THEN the system SHALL associate it with their user ID from the auth system
3. WHEN an anonymous user creates a pipe THEN the system SHALL use the existing anonymous execution limit (5 executions)
4. WHEN an anonymous user signs up THEN the system SHALL migrate their local pipes to their account (like auth system does)
5. WHEN a user logs out THEN the system SHALL clear pipe drafts from memory but keep saved pipes in database
6. WHEN a user accesses the editor THEN the system SHALL use the existing ProtectedRoute component for authenticated features

### Requirement 22: Operator Naming

**User Story:** As a user, I want to give custom names to my operators, so that I can identify them easily in complex pipes.

#### Acceptance Criteria

1. WHEN a user adds an operator to the canvas THEN the system SHALL assign a default label based on type and sequence (e.g., "Fetch 1", "Filter 2")
2. WHEN a user double-clicks on an operator's label THEN the system SHALL enable inline editing of the label
3. WHEN a user edits an operator label THEN the system SHALL validate that the label is non-empty and less than 50 characters
4. WHEN a user saves an operator label THEN the system SHALL update the node display immediately
5. WHEN a user presses Enter during label editing THEN the system SHALL save the label and exit edit mode
6. WHEN a user presses Escape during label editing THEN the system SHALL cancel the edit and restore the previous label
7. WHEN a user clicks outside the label during editing THEN the system SHALL save the label and exit edit mode
8. WHEN a user selects an operator THEN the system SHALL display a "Name" field at the top of the configuration panel
9. WHEN a user edits the name in the configuration panel THEN the system SHALL update the operator label on the canvas in real-time

### Requirement 23: Persist Operator Names to Database

**User Story:** As a user, I want my operator names to be saved with my pipe, so that I see the same names when I reload the pipe.

#### Acceptance Criteria

1. WHEN a user saves a pipe THEN the system SHALL include operator labels in the pipe definition JSON
2. WHEN a user loads a pipe THEN the system SHALL restore operator labels from the saved definition
3. WHEN a user forks a pipe THEN the system SHALL copy all operator labels to the forked pipe
4. WHEN a user restores a pipe version THEN the system SHALL restore operator labels from that version
5. WHEN the pipe definition is exported THEN the system SHALL include operator labels in the export

### Requirement 24: Edge Visual Feedback and Management

**User Story:** As a user, I want clear visual feedback when interacting with edges, so that I understand what actions are available.

#### Acceptance Criteria

1. WHEN a user hovers over an edge THEN the system SHALL increase the edge stroke width and change color to indicate interactivity
2. WHEN an edge is selected THEN the system SHALL display the edge with a distinct highlight color (e.g., blue)
3. WHEN an edge is being dragged to create a new connection THEN the system SHALL show a preview line following the cursor
4. WHEN a connection would create a cycle THEN the system SHALL show the preview line in red color
5. WHEN a user holds Shift and clicks edges THEN the system SHALL add each clicked edge to the selection
6. WHEN multiple edges are selected AND the user presses Delete THEN the system SHALL remove all selected edges
7. WHEN a user clicks on the canvas background THEN the system SHALL clear the edge selection
8. WHEN a user right-clicks on an edge THEN the system SHALL display a context menu with a "Delete Connection" option

### Requirement 25: Canvas Toolbar Controls

**User Story:** As a user, I want toolbar buttons for common edge operations, so that I can quickly perform actions without keyboard shortcuts.

#### Acceptance Criteria

1. WHEN the canvas is displayed THEN the system SHALL show a toolbar with edge-related actions
2. WHEN an edge is selected THEN the system SHALL enable the "Delete Connection" toolbar button
3. WHEN no edge is selected THEN the system SHALL disable the "Delete Connection" toolbar button
4. WHEN a user clicks "Delete Connection" THEN the system SHALL remove the selected edge
5. WHEN a user clicks "Clear All Connections" THEN the system SHALL prompt for confirmation before removing all edges

## What We're NOT Building (MVP)

- ❌ Comments on pipes (add in Phase 3)
- ❌ Ratings/reviews (add in Phase 3)
- ❌ Personalized timeline/feed (add in Phase 3)
- ❌ Notifications (likes, forks, etc. - add in Phase 3)
- ❌ Merge/Join operators (complex, add later)
- ❌ Loop/Iterate operators (complex, add later)
- ❌ Conditional operators (if/else - add later)
- ❌ Custom JavaScript operators (security risk, add later)
- ❌ RSS/XML support (JSON only for MVP)
- ❌ Scheduled execution (add in Phase 6)
- ❌ Pipe templates/marketplace (add later)
- ❌ Collaborative editing (add later)
- ❌ Pipe analytics dashboard (add later)
- ❌ Export to code (add later)

## What We ARE Building (MVP)

✅ **Visual Editor**
- ReactFlow canvas (Yahoo Pipes inspired design)
- Drag & drop operators
- Connect operators
- Zoom/pan/undo/redo
- Modern UI with Yahoo Pipes aesthetic

✅ **Pipe Chaining Controls**
- Edge selection (click to select, Shift+click for multi-select)
- Edge deletion (Delete key, toolbar button, context menu)
- Edge hover highlighting with visual feedback
- Cycle detection with error messages
- Custom operator naming (inline editing + config panel)
- Operator names persisted to database
- Canvas toolbar for edge operations

✅ **4 Core Operators**
- Fetch (HTTP GET, JSON only)
- Filter (array filtering with rules)
- Sort (array sorting by field)
- Transform (field mapping/reshaping)

✅ **Execution Engine**
- Sync execution (< 30s)
- Async execution (queued, up to 5 min)
- Real-time progress updates
- Error handling

✅ **Pipe Management**
- CRUD operations
- Version history (last 5)
- Public/private visibility
- Fork pipes
- Browse public pipes

✅ **Discovery & Social**
- Tags/categories
- Like/unlike pipes
- Usage count tracking
- Trending pipes (last 7 days)
- Featured pipes
- User profiles (view user's pipes)
- Search by name, description, tags
- Sort by popular/recent/most used

✅ **Auto-save**
- Draft every 30 seconds
- Unsaved changes warning

✅ **Integration**
- Uses existing auth system (JWT, anonymous limits)
- Follows implementation-standards.md
- Follows frontend-standards.md
- Integrates with existing navigation

## Why This Feature?

**Ties to Yahoo Pipes Resurrection:**
- This IS Yahoo Pipes - the core visual data mashup tool
- Original had ~50 operators, we start with 4 most essential
- Visual programming without code
- Share and remix workflows

**Why visual editor?**
- Lower barrier to entry than code
- See data flow visually
- Easier to debug
- More engaging UX

**Why JSON only?**
- Simplest to implement
- Most APIs use JSON
- Can add RSS/XML later
- Keeps scope manageable

**Why 4 operators?**
- Fetch: Can't do anything without data
- Filter: Most common operation
- Sort: Very common, simple to implement
- Transform: Essential for reshaping data
- These 4 cover 80% of use cases

**Why versioning?**
- Users make mistakes
- Need to experiment safely
- 5 versions is enough for MVP
- More than 5 is overkill for most users

**Why social features?**
- Discovery is key to platform growth
- Users learn from each other's pipes
- Trending/popular pipes showcase what's possible
- Tags make pipes searchable and discoverable
- Like GitHub - social coding for data workflows

**Why Yahoo Pipes aesthetic?**
- Nostalgia for original users
- Proven UX that worked well
- Visual style was iconic
- Modern touches improve usability without losing identity

## Success Metrics

- User can create a simple pipe (Fetch → Filter → Output) in < 5 minutes
- Pipe execution completes in < 5 seconds for simple workflows
- 90% of pipes use Fetch and Filter operators
- Users fork public pipes (indicates discovery works)
- Zero data loss (auto-save works)
- 50%+ of users browse public pipes before creating their own
- Trending section shows active community engagement
- Users add tags to 80%+ of public pipes

## Dependencies

### Backend
- PostgreSQL (pipes, versions, executions tables)
- Bull queue (async execution)
- Redis (queue backend)
- Axios (HTTP requests in operators)

### Frontend
- ReactFlow (visual editor)
- React DnD (drag & drop - included in ReactFlow)
- Monaco Editor or JSON viewer (results display)
- Redux (state management - already have)

## Risks & Mitigations

**Risk:** ReactFlow learning curve
**Mitigation:** Start with basic example, iterate

**Risk:** Execution timeout issues
**Mitigation:** Both sync and async execution modes

**Risk:** Infinite loops in pipes
**Mitigation:** Max execution time (5 min), max operators (50)

**Risk:** Malicious URLs in Fetch operator
**Mitigation:** Timeout, rate limiting, no localhost/private IPs

**Risk:** Large data sets crash browser
**Mitigation:** Limit result size (1MB max), pagination

**Risk:** Complex operator configuration UX
**Mitigation:** Start simple, iterate based on feedback

## Timeline

### Backend (3-4 days)
- Pipe CRUD API: 1 day
- Operator execution engine: 1 day
- Async execution (Bull queue): 1 day
- Version management: 0.5 day
- Testing: 0.5 day

### Frontend (4-5 days)
- ReactFlow setup: 0.5 day
- Operator palette: 0.5 day
- Canvas interactions: 1 day
- Operator configuration panel: 1 day
- Execution UI: 1 day
- Browse/detail pages: 1 day
- Testing: 0.5 day

**Total: ~8-9 days (1.5-2 weeks)**

## Open Questions

1. **Operator validation:** Should we validate the entire pipe before execution? Or fail at runtime?
   - **Decision:** Validate before execution, show errors on canvas

2. **Data size limits:** What's the max JSON response size?
   - **Decision:** 1MB max per operator output

3. **Execution concurrency:** How many pipes can execute simultaneously per user?
   - **Decision:** 3 concurrent executions per user

4. **Fork behavior:** Should forking copy execution history?
   - **Decision:** No, only copy pipe definition

5. **Public pipe discovery:** Should we have categories/tags?
   - **Decision:** YES - tags are essential for discovery, trending, and personalization

6. **Visual design:** Should we match original Yahoo Pipes or go completely modern?
   - **Decision:** Yahoo Pipes inspired with modern touches (smooth animations, better typography)

7. **Social features scope:** Likes, comments, ratings - which for MVP?
   - **Decision:** Likes and usage count for MVP, comments/ratings in Phase 3
