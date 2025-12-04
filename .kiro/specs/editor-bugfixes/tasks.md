# Implementation Plan: Editor & Pipeline Bugfixes

## Phase 1: Schema Propagation Fixes ✅

- [x] 1. Fix schema propagation on edge connect

  - [x] 1.1 Import `propagateSchemas` action in `EditorCanvas.tsx`
    - Add import from `schema-slice`
    - _Requirements: 1.1_

  - [x] 1.2 Call `propagateSchemas` after `setEdges` in `onConnect` callback
    - Dispatch `propagateSchemas({ edges: updatedEdges })` after connection is made
    - _Requirements: 1.1_

  - [x] 1.3 Test: Connect Fetch JSON to Filter, verify field dropdown populates
    - Preview Fetch JSON first
    - Connect to Filter
    - Verify Filter shows field dropdown with fetched fields

- [x] 2. Fix schema cleanup on edge delete

  - [x] 2.1 Import `clearUpstreamSchema` action in `EditorCanvas.tsx`
    - Add import from `schema-slice`
    - _Requirements: 1.2_

  - [x] 2.2 Get target node ID before deleting edge in `handleDeleteEdge`
    - Store edge.target before removal
    - _Requirements: 1.2_

  - [x] 2.3 Call `clearUpstreamSchema(targetNodeId)` after edge removal
    - Clear the downstream node's upstream schema
    - _Requirements: 1.2_

  - [x] 2.4 Call `propagateSchemas` with remaining edges
    - Recompute all upstream schemas
    - _Requirements: 1.2_

  - [x] 2.5 Test: Delete connection, verify dropdown is cleared
    - Connect Fetch to Filter with schema
    - Delete connection
    - Verify Filter dropdown is empty/shows text input

## Phase 2: Visual Feedback Fixes ✅

- [x] 3. Add proper arrow markers to edges

  - [x] 3.1 Create arrow marker SVG definition in `SelectableEdge.tsx`
    - Add `<marker>` element in `<defs>` with unique ID per edge
    - Configure `viewBox`, `refX`, `refY`, `orient="auto"`
    - _Requirements: 3.1_

  - [x] 3.2 Update marker fill color based on edge state
    - Selected: use SELECTED_COLOR
    - Hovered: use HOVER_COLOR
    - Default: use GRADIENT_END
    - _Requirements: 3.2, 3.3_

  - [x] 3.3 Apply marker to `BaseEdge` via `markerEnd` prop
    - Use URL reference to marker ID
    - _Requirements: 3.1_

  - [x] 3.4 Test: Verify arrows visible on all edge states
    - Create connection, check arrow
    - Hover edge, check arrow color
    - Select edge, check arrow color

- [x] 4. Update node status during execution

  - [x] 4.1 Add `updateNodeStatus` helper function in `EditorToolbar.tsx`
    - Accept nodeId and status ('idle' | 'running' | 'success' | 'error')
    - Dispatch `updateNode` with status
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 4.2 Set all nodes to 'running' before API call
    - Iterate nodes and set status
    - _Requirements: 6.1_

  - [x] 4.3 Update nodes from intermediate results after execution
    - For each node in `result.intermediateResults`, update status and result
    - _Requirements: 6.2, 6.3, 5.1_

  - [x] 4.4 Reset node status to 'idle' on execution failure
    - Clean up on error
    - _Requirements: 6.4_

  - [x] 4.5 Test: Execute pipe, verify node status transitions
    - Watch nodes turn blue (running)
    - Watch nodes turn green (success)
    - Intentionally fail, watch node turn red

- [x] 5. Display intermediate results on nodes

  - [x] 5.1 Verify `OperatorNode` renders `data.result` when present
    - Check existing result preview code
    - _Requirements: 5.1, 5.2_

  - [x] 5.2 Update node data with result from intermediate results
    - In EditorToolbar after execution
    - _Requirements: 5.1_

  - [x] 5.3 Test: Execute, verify each node shows its output
    - Run pipe
    - Check each node has result preview

## Phase 3: Execution Flow Fixes ✅

- [x] 6. Integrate UserInputPromptDialog

  - [x] 6.1 Create `detectUserInputNodes` helper function
    - Filter nodes by user input types
    - Return array of input nodes
    - _Requirements: 7.1_

  - [x] 6.2 Add state for user input dialog visibility
    - `showUserInputDialog`, `pendingInputNodes`
    - _Requirements: 7.2_

  - [x] 6.3 Check for user inputs before execution
    - If inputs exist, show dialog instead of immediate execution
    - _Requirements: 7.2_

  - [x] 6.4 Handle dialog submit with values
    - Collect values and call `executePipe` with them
    - _Requirements: 7.3_

  - [x] 6.5 Handle dialog cancel
    - Don't execute, reset state
    - _Requirements: 7.4_

  - [x] 6.6 Render UserInputPromptDialog conditionally
    - Add to EditorToolbar JSX
    - _Requirements: 7.2_

  - [x] 6.7 Test: Add text input, execute, verify prompt appears
    - Add Text Input operator
    - Connect to URL Builder or similar
    - Click Run
    - Verify dialog appears
    - Enter value, verify execution uses it

- [x] 7. Add "Run Selected" button to nodes

  - [x] 7.1 Add `handleRunSelected` callback in `OperatorNode.tsx`
    - Stop event propagation
    - Dispatch action to run from this node
    - _Requirements: 8.1_

  - [x] 7.2 Create `runSelectedExecution` action/thunk
    - Accept targetNodeId
    - Call backend executeSelected endpoint
    - Update node statuses and results
    - _Requirements: 8.2, 8.3_

  - [x] 7.3 Render Run button in node header for non-source operators
    - Show on hover
    - Style consistently with node header
    - _Requirements: 8.1_

  - [x] 7.4 Test: Click Run on Filter, verify only upstream executes
    - Create Fetch → Filter → Sort pipeline
    - Click Run on Filter
    - Verify only Fetch and Filter execute

## Phase 4: Default Pipeline & Error Messages ✅

- [x] 8. Create realistic default pipeline

  - [x] 8.1 Update `DEFAULT_NODES` in `canvas-slice.ts`
    - Add 4 nodes: Fetch JSON, Filter, Truncate, Pipe Output
    - Position in logical left-to-right flow
    - _Requirements: 4.1, 4.3_

  - [x] 8.2 Configure Fetch JSON with working URL
    - Use `https://jsonplaceholder.typicode.com/posts`
    - _Requirements: 4.4_

  - [x] 8.3 Configure Filter with meaningful rule
    - Filter by `userId === 1`
    - _Requirements: 4.3_

  - [x] 8.4 Configure Truncate with count
    - Keep first 5 items
    - _Requirements: 4.3_

  - [x] 8.5 Update `DEFAULT_EDGES` to connect all nodes
    - fetch → filter → truncate → output
    - _Requirements: 4.1_

  - [x] 8.6 Test: Open new editor, run default pipeline
    - Should produce 5 posts from userId 1
    - _Requirements: 4.2_

- [x] 9. Improve operator error messages

  - [x] 9.1 Update `FilterOperator.execute` error for non-array input
    - Include expected type, received type, helpful suggestion
    - _Requirements: 9.1_

  - [x] 9.2 Update `SortOperator.execute` error for non-array input
    - Include expected type, received type, helpful suggestion
    - _Requirements: 9.2_

  - [x] 9.3 Update `TransformOperator.execute` to handle null gracefully
    - Pass through null/undefined, don't throw (already implemented)
    - _Requirements: 9.3_

  - [x] 9.4 Test: Connect incompatible operators, verify clear error
    - Connect Fetch Page to Filter
    - Execute
    - Verify error says "Filter requires array input"

## Phase 5: Toast Deduplication ✅

- [x] 10. Remove duplicate toasts

  - [x] 10.1 Remove success toast from `FetchJSONInlineConfig` preview
    - Preview is for schema extraction, shouldn't show success
    - _Requirements: 2.1_

  - [x] 10.2 Remove success toast from other Fetch*InlineConfig previews
    - FetchCSV, FetchRSS, FetchPage
    - _Requirements: 2.1_

  - [x] 10.3 Review EditorToolbar execution toasts
    - Ensure single toast on success
    - Ensure single toast on error
    - _Requirements: 2.2_

  - [x] 10.4 Test: Execute various actions, verify single toasts
    - Preview source: no toast
    - Execute success: one success toast
    - Execute fail: one error toast

## Phase 6: API Error Handling ✅

- [x] 11. Improve frontend error handling

  - [x] 11.1 Update `use-schema.ts` error parsing
    - Extract user-friendly messages from API responses
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 11.2 Update `execution-logic.ts` error handling
    - Preserve intermediate results on partial failure (already implemented)
    - Display meaningful error from failed node
    - _Requirements: 10.4_

  - [x] 11.3 Test: Cause various errors, verify messages
    - Network error: check message
    - Timeout: check message
    - Invalid JSON: check message

## Phase 7: Integration Testing ✅

- [x] 12. Full pipeline testing

  - [x] 12.1 Test complete flow: create → configure → execute → view results
    - New editor
    - Add operators
    - Configure inline
    - Execute
    - Verify results on nodes and panel
    - _Requirements: all_

  - [x] 12.2 Test schema propagation end-to-end
    - Preview source
    - Connect downstream
    - Verify dropdowns populate
    - Disconnect
    - Verify dropdowns clear
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 12.3 Test user input flow
    - Add user input operators
    - Connect to URL Builder
    - Execute
    - Verify prompt appears
    - Enter values
    - Verify execution uses them
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 12.4 Test error scenarios
    - Invalid URL
    - Incompatible operators
    - Missing required config
    - Network failure
    - Verify all show helpful messages
    - _Requirements: 9.1, 9.2, 9.4, 10.1, 10.2, 10.3_

## Checkpoint ✅

- [x] 13. Final verification

  - [x] 13.1 Run all backend tests
    - `cd backend && npm test`
    - All 521 tests passed

  - [x] 13.2 Run all frontend tests
    - `cd frontend && npm test`
    - All 149 tests passed

  - [x] 13.3 Manual smoke test on /editor page
    - Create pipe
    - Add operators
    - Configure
    - Execute
    - Verify results

  - [x] 13.4 Manual smoke test on /editor/:id page
    - Load existing pipe
    - Verify schema loads
    - Execute
    - Verify results

---

## ✅ ALL PHASES COMPLETED - December 4, 2025
