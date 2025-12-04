# Implementation Plan

## Phase 1: Backend Foundation

- [x] 1. Create Schema Extractor Service



  - [x] 1.1 Create SchemaField and ExtractedSchema interfaces in `backend/src/types/schema.types.ts`


    - Define SchemaField with name, path, type, children, sample
    - Define ExtractedSchema with fields, rootType, itemCount
    - _Requirements: 1.2, 21.3_
  - [x] 1.2 Implement SchemaExtractor class in `backend/src/services/schema-extractor.ts`


    - Implement `extract(data: any)` for JSON schema extraction
    - Implement `extractFromCSV(csvText: string)` for CSV parsing
    - Implement `extractFromRSS(xmlText: string)` for RSS/Atom parsing
    - Implement `flattenSchema()` to get dot-notation paths
    - _Requirements: 1.2, 3.2, 3.3_
  - [x] 1.3 Write property tests for schema extraction


    - **Property 1: Schema Extraction Completeness**
    - **Validates: Requirements 1.2**

- [x] 2. Enhance Operator Type System





  - [x] 2.1 Update `backend/src/types/operator.types.ts` with new types


    - Add OperatorCategory type
    - Add all new OperatorType values
    - Add new config interfaces (FetchCSVConfig, FetchRSSConfig, etc.)
    - Add EnhancedFilterConfig with mode and matchMode
    - _Requirements: 21.1, 21.2_

  - [x] 2.2 Enhance BaseOperator with category and getOutputSchema

    - Add abstract category property
    - Add abstract description property
    - Add getOutputSchema method signature
    - _Requirements: 21.1_


## Phase 2: Source Operators

- [x] 3. Implement Source Operators





  - [x] 3.1 Create FetchJSONOperator in `backend/src/operators/sources/fetch-json-operator.ts`


    - Extend BaseOperator with type='fetch-json', category='sources'
    - Reuse existing fetch logic from FetchOperator
    - Implement getOutputSchema using SchemaExtractor
    - _Requirements: 3.1_

  - [x] 3.2 Create FetchCSVOperator in `backend/src/operators/sources/fetch-csv-operator.ts`

    - Parse CSV to JSON array using csv-parse library
    - Handle delimiter and hasHeader config options
    - Fill missing values with null for inconsistent columns
    - _Requirements: 3.2, 22.5_

  - [x] 3.3 Write property test for CSV round-trip parsing

    - **Property 3: CSV Round-Trip Parsing**
    - **Validates: Requirements 3.2**
  - [x] 3.4 Create FetchRSSOperator in `backend/src/operators/sources/fetch-rss-operator.ts`


    - Parse RSS/Atom using rss-parser library
    - Normalize to title, link, description, pubDate fields
    - Use empty string for missing optional fields
    - _Requirements: 3.3, 22.6_

  - [x] 3.5 Write property test for RSS normalization

    - **Property 4: RSS Normalization**
    - **Validates: Requirements 3.3, 22.6**

  - [x] 3.6 Create FetchPageOperator in `backend/src/operators/sources/fetch-page-operator.ts`

    - Use cheerio for HTML parsing (no JS execution)
    - Strip script and noscript tags
    - Extract by CSS selector with attribute option
    - _Requirements: 3.4, 17.4_
  - [x] 3.7 Register legacy 'fetch' as alias to 'fetch-json' in operator registry


    - Update `backend/src/operators/index.ts`
    - _Requirements: backward compatibility_

- [x] 4. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: User Input Operators

- [x] 5. Implement User Input Operators





  - [x] 5.1 Create TextInputOperator in `backend/src/operators/user-inputs/text-input-operator.ts`


    - Simple pass-through of configured value
    - Validate required field if set
    - _Requirements: 4.1_
  - [x] 5.2 Create NumberInputOperator in `backend/src/operators/user-inputs/number-input-operator.ts`


    - Validate min/max constraints
    - Parse string input to number
    - _Requirements: 4.2_
  - [x] 5.3 Write property test for number input validation


    - **Property: Number Input Constraint Validation**
    - **Validates: Requirements 4.2**
  - [x] 5.4 Create URLInputOperator in `backend/src/operators/user-inputs/url-input-operator.ts`


    - Validate URL format
    - Apply security checks (no localhost/private IPs)
    - _Requirements: 4.3_
  - [x] 5.5 Create DateInputOperator in `backend/src/operators/user-inputs/date-input-operator.ts`


    - Parse and validate date strings
    - Support minDate/maxDate constraints
    - _Requirements: 4.4_

## Phase 4: Transformation Operators

- [x] 6. Implement New Transformation Operators





  - [x] 6.1 Create UniqueOperator in `backend/src/operators/transforms/unique-operator.ts`


    - Deduplicate by specified field
    - Keep first occurrence of duplicates
    - _Requirements: 7.1_
  - [x] 6.2 Write property test for unique deduplication


    - **Property 10: Unique Deduplication**
    - **Validates: Requirements 7.1**
  - [x] 6.3 Create TruncateOperator in `backend/src/operators/transforms/truncate-operator.ts`


    - Keep first N items from array
    - Handle count > array length gracefully
    - _Requirements: 7.2_
  - [x] 6.4 Write property test for truncate count


    - **Property 11: Truncate Count Correctness**
    - **Validates: Requirements 7.2**
  - [x] 6.5 Create TailOperator in `backend/src/operators/transforms/tail-operator.ts`


    - Keep last N items or skip first N
    - Handle count > array length gracefully
    - _Requirements: 7.3_
  - [x] 6.6 Write property test for tail count


    - **Property 12: Tail Count Correctness**
    - **Validates: Requirements 7.3**
  - [x] 6.7 Create RenameOperator in `backend/src/operators/transforms/rename-operator.ts`


    - Rename fields based on mappings
    - Skip non-existent source fields without error
    - _Requirements: 7.4, 7.5_

- [x] 7. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.


## Phase 5: String and URL Operators

- [x] 8. Implement String Operators





  - [x] 8.1 Create StringReplaceOperator in `backend/src/operators/string/string-replace-operator.ts`


    - Replace all occurrences of search string
    - Skip if target field doesn't exist
    - _Requirements: 9.1, 9.5_

  - [x] 8.2 Write property test for string replace

    - **Property 14: String Replace Completeness**
    - **Validates: Requirements 9.1**
  - [x] 8.3 Create regex validator utility in `backend/src/utils/regex-validator.ts`


    - Detect dangerous patterns (nested quantifiers, etc.)
    - Enforce max pattern length (500 chars)
    - _Requirements: 17.3_

  - [x] 8.4 Write property test for regex DoS prevention

    - **Property 24: Regex DoS Prevention**
    - **Validates: Requirements 17.3**
  - [x] 8.5 Create RegexOperator in `backend/src/operators/string/regex-operator.ts`


    - Support extract and replace modes
    - Validate pattern before execution
    - Display clear error for invalid patterns
    - _Requirements: 9.2, 9.4_

  - [x] 8.6 Create SubstringOperator in `backend/src/operators/string/substring-operator.ts`

    - Extract by start/end indices
    - Handle out-of-bounds gracefully
    - _Requirements: 9.3_

  - [x] 8.7 Write property test for substring bounds

    - **Property 15: Substring Bounds**
    - **Validates: Requirements 9.3**

- [x] 9. Implement URL Operators


  - [x] 9.1 Create URLBuilderOperator in `backend/src/operators/url/url-builder-operator.ts`


    - Build URL from base and params
    - Properly encode query parameters
    - Support wiring from user input operators
    - _Requirements: 8.1, 8.2, 8.3_


  - [x] 9.2 Write property test for URL encoding

    - **Property 13: URL Encoding Correctness**
    - **Validates: Requirements 8.3**

## Phase 6: Enhanced Filter and Sort

- [x] 10. Enhance Filter Operator






  - [x] 10.1 Update FilterOperator with Permit/Block mode

    - Add mode config: 'permit' | 'block'
    - Permit includes matching, Block excludes matching
    - Default to 'permit' for backward compatibility
    - _Requirements: 5.1_

  - [x] 10.2 Add any/all match mode to FilterOperator

    - Add matchMode config: 'any' | 'all'
    - 'all' = AND logic, 'any' = OR logic
    - Default to 'all' for backward compatibility

    - _Requirements: 5.2, 5.5, 5.6_

  - [x] 10.3 Add new filter operators
    - Add 'not_equals', 'not_contains', 'matches_regex'
    - Validate regex patterns before use
    - _Requirements: 5.4_
  - [x] 10.4 Write property tests for filter modes


    - **Property 5: Filter Mode Correctness (Permit/Block)**
    - **Property 6: Filter Match Mode Correctness (Any/All)**


    - **Validates: Requirements 5.1, 5.5, 5.6**
  - [x] 10.5 Handle missing fields gracefully in filter
    - Skip items with missing fields instead of failing
    - _Requirements: 16.4, 22.4_

- [x] 11. Enhance Sort Operator





  - [x] 11.1 Add date parsing to SortOperator


    - Detect and parse date strings
    - Compare by date value
    - _Requirements: 6.3_

  - [x] 11.2 Write property test for date sorting

    - **Property 8: Date Sort Correctness**
    - **Validates: Requirements 6.3**

  - [x] 11.3 Ensure numeric sorting is numeric (not string)

    - Already implemented, verify behavior
    - _Requirements: 6.4_
  - [x] 11.4 Write property test for numeric sorting


    - **Property 7: Numeric Sort Correctness**
    - **Validates: Requirements 6.4**

  - [x] 11.5 Handle missing sort field

    - Place items without field at end of sorted list
    - _Requirements: 6.5_
  - [x] 11.6 Write property test for missing sort field


    - **Property 9: Missing Sort Field Handling**
    - **Validates: Requirements 6.5**

- [x] 12. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.


## Phase 7: Pipe Output and Execution Engine

- [x] 13. Implement Pipe Output Operator




  - [x] 13.1 Create PipeOutputOperator in `backend/src/operators/pipe-output-operator.ts`


    - Pass-through operator marking end of pipe
    - No configuration needed
    - _Requirements: 13.1, 13.2_

- [x] 14. Enhance Execution Engine





  - [x] 14.1 Add executeSelected method to PipeExecutor


    - Accept targetNodeId parameter
    - Build subgraph from target + upstream nodes
    - Execute only the subgraph
    - _Requirements: 10.1, 10.2_
  - [x] 14.2 Write property test for upstream traversal


    - **Property 16: Upstream Traversal Completeness**
    - **Validates: Requirements 10.1**
  - [x] 14.3 Write property test for execution order


    - **Property 17: Execution Order Correctness**
    - **Validates: Requirements 10.2**
  - [x] 14.4 Add user input value injection


    - Accept userInputs map in execution context
    - Inject values into user input operators
    - _Requirements: 4.5, 4.6_
  - [x] 14.5 Validate non-source operators have input


    - Error if operator has no upstream and is not a source
    - _Requirements: 10.3_
  - [x] 14.6 Preserve intermediate results on failure


    - Return successful upstream results even when downstream fails
    - _Requirements: 16.6_

- [x] 15. Add Preview API Endpoint




  - [x] 15.1 Create preview route in `backend/src/routes/preview.routes.ts`


    - POST /api/v1/preview
    - Accept operatorType and config
    - Return schema and sample data
    - _Requirements: 1.1_
  - [x] 15.2 Add execute-selected route in `backend/src/routes/executions.routes.ts`


    - POST /api/v1/pipes/:pipeId/execute-selected
    - Accept targetNodeId and userInputs
    - Return full execution result with intermediates
    - _Requirements: 10.1, 10.4_

## Phase 8: Backend Validation

- [x] 16. Implement Pipe Definition Validation


  - [x] 16.1 Create pipe validator in `backend/src/utils/pipe-validator.ts`
    - Validate all operator types are registered
    - Validate all connections reference existing nodes
    - Detect circular dependencies
    - _Requirements: 18.1, 18.2, 18.3_
  - [x] 16.2 Write property test for pipe validation


    - **Property 25: Pipe Definition Validation**
    - **Validates: Requirements 18.1, 18.2, 18.3**
  - [x] 16.3 Integrate validation into pipe save endpoint


    - Return 400 for unknown operator types
    - Return 400 for invalid connections
    - Return 400 for cycles
    - _Requirements: 18.4_


  - [x] 16.4 Add operator count limit validation

    - Reject pipes with > 50 operators
    - _Requirements: 17.7_

- [x] 17. Enhance Error Messages





  - [x] 17.1 Update FetchOperator error messages


    - Network error: "Network error: Unable to reach [domain]"
    - Invalid JSON: "Invalid response: Expected JSON but received [content-type]"
    - Timeout: "Request timeout: The request took longer than 30 seconds"
    - _Requirements: 16.1, 16.2, 16.3_
  - [x] 17.2 Write property test for error message format


    - **Property 21: Fetch Error Message Format**
    - **Validates: Requirements 16.1, 16.2, 16.3**
- [x] 18. Checkpoint - Ensure all tests pass








- [x] 18. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.


## Phase 9: Frontend Schema Store

- [x] 19. Create Schema Redux Slice





  - [x] 19.1 Create schema slice in `frontend/src/store/slices/schema-slice.ts`


    - Store nodeSchemas: Record<nodeId, ExtractedSchema>
    - Store upstreamSchemas: Record<nodeId, ExtractedSchema>
    - Store previewLoading and previewErrors
    - _Requirements: 1.3_
  - [x] 19.2 Implement schema propagation action


    - Traverse graph to compute upstream schemas
    - Update when connections change
    - _Requirements: 1.3, 1.6_
  - [x] 19.3 Write property test for schema propagation


    - **Property 2: Schema Propagation Consistency**
    - **Validates: Requirements 1.3, 1.6**
  - [x] 19.4 Create useUpstreamSchema hook


    - Return upstream schema for a given node ID
    - Subscribe to schema slice updates
    - _Requirements: 1.4_

- [x] 20. Implement Preview Service





  - [x] 20.1 Create preview service in `frontend/src/services/preview-service.ts`


    - Call POST /api/v1/preview
    - Handle loading and error states
    - _Requirements: 1.1_
  - [x] 20.2 Create usePreview hook


    - Trigger preview for source operators
    - Update schema slice on success
    - _Requirements: 1.1, 1.2_

## Phase 10: Frontend Inline Configuration

- [x] 21. Create Inline Config Components





  - [x] 21.1 Create FetchJSONInlineConfig component


    - URL input field
    - Preview button with loading state
    - Error display
    - Secret selector (existing functionality)
    - _Requirements: 2.2_

  - [x] 21.2 Create FetchCSVInlineConfig component

    - URL input, delimiter selector, hasHeader toggle
    - Preview button
    - _Requirements: 2.2_

  - [x] 21.3 Create FetchRSSInlineConfig component

    - URL input, maxItems input
    - Preview button
    - _Requirements: 2.2_

  - [x] 21.4 Create FetchPageInlineConfig component

    - URL input, CSS selector input
    - Attribute input, multiple toggle
    - Preview button
    - _Requirements: 2.2_

  - [x] 21.5 Create FilterInlineConfig component

    - Permit/Block toggle
    - Any/All toggle
    - Rules list with field dropdown, operator dropdown, value input
    - Add/remove rule buttons
    - _Requirements: 2.3, 5.1, 5.2, 5.3_

  - [x] 21.6 Create SortInlineConfig component

    - Field dropdown from upstream schema
    - Direction toggle (asc/desc)
    - _Requirements: 2.4, 6.1, 6.2_

  - [x] 21.7 Create UserInputInlineConfig components

    - TextInputInlineConfig, NumberInputInlineConfig
    - URLInputInlineConfig, DateInputInlineConfig
    - Label, default value, constraints
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 21.8 Create TransformInlineConfig components


    - UniqueInlineConfig (field dropdown)
    - TruncateInlineConfig (count input)
    - TailInlineConfig (count input, skip toggle)
    - RenameInlineConfig (mappings list)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 21.9 Create StringInlineConfig components


    - StringReplaceInlineConfig (field, search, replace)
    - RegexInlineConfig (field, pattern, mode, replacement)
    - SubstringInlineConfig (field, start, end)
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 21.10 Create URLBuilderInlineConfig component

    - Base URL input
    - Params list with key/value inputs
    - Wire from input selector
    - _Requirements: 8.1_

  - [x] 21.11 Create PipeOutputInlineConfig component

    - Result preview display
    - No configuration needed
    - _Requirements: 13.3_

- [x] 22. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.


## Phase 11: Enhanced OperatorNode

- [x] 23. Update OperatorNode Component





  - [x] 23.1 Enhance OperatorNode to render inline config


    - Import all inline config components
    - Render based on operator type
    - Pass upstream schema to config components
    - _Requirements: 2.1_

  - [x] 23.2 Add validation error display
    - Show warning badge on header when errors exist
    - Display error messages in node body

    - _Requirements: 15.1, 15.5_
  - [x] 23.3 Add result preview display
    - Show execution result when available

    - Truncate large results with "show more"
    - _Requirements: 10.4, 13.3_
  - [x] 23.4 Add "Run Selected" button to node
    - Button in node header or context menu

    - Trigger executeSelected action
    - _Requirements: 10.1_
  - [x] 23.5 Add retry button for failed operators

    - Show when status is 'error'
    - Re-trigger execution
    - _Requirements: 16.7_
  - [x] 23.6 Conditionally hide input handle for source operators
    - No input handle for fetch-*, *-input operators
    - _Requirements: 3.6_

## Phase 12: Connection Validation

- [x] 24. Implement Connection Validation






  - [x] 24.1 Create connection validator utility

    - Check source operators cannot have input
    - Check single input per operator
    - Check for cycles
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 24.2 Write property test for source connection rejection

    - **Property 18: Source Connection Rejection**
    - **Validates: Requirements 3.6, 14.1**

  - [x] 24.3 Write property test for single input enforcement

    - **Property 19: Single Input Enforcement**
    - **Validates: Requirements 14.2**

  - [x] 24.4 Write property test for cycle detection

    - **Property 20: Cycle Detection**
    - **Validates: Requirements 14.3**
  - [x] 24.5 Integrate validation into ReactFlow onConnect


    - Reject invalid connections
    - Show toast with error message
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 24.6 Trigger schema propagation on valid connection

    - Update downstream operator's upstream schema
    - _Requirements: 14.4_

  - [x] 24.7 Clear schema on connection delete

    - Clear downstream operator's cached schema
    - _Requirements: 14.5_

## Phase 13: Operator Palette Enhancement

- [x] 25. Update Operator Palette



  - [x] 25.1 Reorganize operators into categories


    - Sources, User Inputs, Operators, String, URL
    - Add all new operators to appropriate categories
    - _Requirements: 11.1_

  - [x] 25.2 Add collapsible category sections
    - Default all expanded
    - Remember collapse state

    - _Requirements: 11.2, 11.3_
  - [x] 25.3 Update operator icons and colors
    - Consistent color scheme per category
    - Descriptive icons for each operator

    - _Requirements: 11.4_
  - [x] 25.4 Add tooltips with descriptions

    - Show on hover over operator
    - _Requirements: 11.5_
  - [x] 25.5 Add Pipe Output to palette

    - Allow re-adding if deleted
    - _Requirements: 13.5_

- [x] 26. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.


## Phase 14: User Input Execution Flow

- [x] 27. Implement User Input Prompt

  - [x] 27.1 Create UserInputPromptDialog component
    - Detect user input operators in pipe
    - Render input fields for each
    - Collect values before execution
    - _Requirements: 4.6_
  - [x] 27.2 Integrate prompt into execution flow
    - Show dialog when pipe has user inputs
    - Pass values to execute-selected endpoint
    - _Requirements: 4.5, 4.6_

## Phase 15: Graceful Degradation


- [x] 28. Implement Graceful Degradation



  - [x] 28.1 Handle empty arrays throughout operators


    - Pass empty array downstream, don't fail
    - _Requirements: 22.1, 22.2_

  - [x] 28.2 Write property test for empty array handling

    - **Property 26: Graceful Empty Array Handling**
    - **Validates: Requirements 22.1, 22.2**


  - [x] 28.3 Handle missing fields in transform operators
    - Skip missing fields, continue with others
    - _Requirements: 22.3, 22.4_


  - [x] 28.4 Write property test for missing field handling
    - **Property 27: Graceful Missing Field Handling**
    - **Validates: Requirements 22.3, 22.4**
  - [x] 28.5 Add fallback to manual field entry



    - When upstream schema unavailable, show text input
    - _Requirements: 1.5, 22.7_

## Phase 16: Security Enhancements

- [x] 29. Enhance Security Checks





  - [x] 29.1 Verify private IP rejection in all fetch operators


    - Test localhost, 10.x, 172.16-31.x, 192.168.x
    - _Requirements: 17.1_

  - [x] 29.2 Write property test for private IP rejection

    - **Property 22: Private IP Rejection**
    - **Validates: Requirements 17.1**
  - [x] 29.3 Verify domain whitelist in all fetch operators


    - Apply existing whitelist logic
    - _Requirements: 17.2_

  - [x] 29.4 Write property test for domain whitelist

    - **Property 23: Domain Whitelist Enforcement**
    - **Validates: Requirements 17.2**
  - [x] 29.5 Add execution timeout enforcement


    - 5 minute max for full pipe
    - 30 second max for individual fetch
    - _Requirements: 17.5_

  - [x] 29.6 Add output size limit enforcement

    - 1MB max per operator output
    - Truncate arrays if needed
    - _Requirements: 17.6_


  - [x] 29.7 Verify secrets are never logged or displayed
    - Audit all logging in fetch operators
    - _Requirements: 17.8_


- [x] 30. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

## Phase 17: UI/UX Polish

- [x] 31. Add Loading and Status Indicators




  - [x] 31.1 Add loading spinner to preview button


    - Show while preview is in progress
    - _Requirements: 20.1_

  - [x] 31.2 Add execution status to operator nodes

    - Idle, running (blue pulse), success (green check), error (red)
    - _Requirements: 20.5, 20.6, 20.7_

  - [x] 31.3 Add success/error toasts

    - Show on preview complete, execution complete
    - _Requirements: 20.2, 20.3_

- [x] 32. Add Validation Feedback





  - [x] 32.1 Add real-time validation to inline configs

    - Red border on invalid fields
    - Inline error messages
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  - [x] 32.2 Block execution with validation errors


    - Highlight all invalid operators
    - Show toast with error count
    - _Requirements: 15.6_

- [x] 33. Add Empty State and Onboarding






  - [x] 33.1 Show onboarding text on empty canvas

    - "Drag operators from the palette to get started"
    - _Requirements: 20.8_

  - [x] 33.2 Auto-add Pipe Output on new pipe

    - Add to canvas when creating new pipe
    - _Requirements: 13.1_

  - [x] 33.3 Warn if no connection to Pipe Output

    - Show warning banner
    - _Requirements: 13.4_

- [x] 34. Add Confirmation Dialogs




  - [x] 34.1 Confirm before deleting operator


    - Show dialog with operator name
    - _Requirements: 20.9_

  - [x] 34.2 Confirm before deleting pipe

    - Show dialog with pipe name
    - _Requirements: 20.9_


## Phase 18: Production Build and Cleanup

- [x] 35. Configure Production Build




  - [x] 35.1 Disable source maps in production


    - Update vite.config.ts
    - _Requirements: 12.1_

  - [x] 35.2 Enable minification with console removal

    - Configure terser to drop console.log
    - _Requirements: 12.2, 12.3_

  - [x] 35.3 Verify production bundle doesn't expose source

    - Build and inspect in browser dev tools
    - _Requirements: 12.4_

- [x] 36. Remove Side Panel




  - [x] 36.1 Remove OperatorConfigPanel.tsx


    - Delete the file
    - Remove all imports and usages
    - _Requirements: 2.6, 12.5_


  - [x] 36.2 Update PipeEditorPage to remove side panel



    - Remove panel rendering
    - Adjust layout
    - _Requirements: 2.6_

## Phase 19: Frontend-Backend Sync

- [x] 37. Implement State Synchronization






  - [x] 37.1 Update local state on successful save

    - Match server response
    - _Requirements: 19.1_


  - [x] 37.2 Preserve local changes on save failure

    - Show error toast
    - Allow retry
    - _Requirements: 19.2_
  - [x] 37.3 Handle session expiry during editing


    - Prompt re-auth without losing canvas
    - _Requirements: 19.3_



  - [x] 37.4 Validate pipe definition on load




    - Check structure before rendering

    - _Requirements: 19.4_

  - [x] 37.5 Handle unknown operator types




    - Show placeholder node with "Unknown operator"
    - _Requirements: 19.5_

## Phase 20: Final Integration

- [x] 38. Register All New Operators






  - [x] 38.1 Update operator registry index

    - Import and register all new operators
    - Register 'fetch' alias to 'fetch-json'
    - _Requirements: backward compatibility_

  - [x] 38.2 Update frontend operator type definitions

    - Add all new types to TypeScript
    - _Requirements: 21.2, 21.6_

- [x] 39. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 40. End-to-End Testing



  - [x] 40.1 Test complete flow: create pipe with new operators

    - Add source, transform, output
    - Configure inline
    - Execute and verify result
    - _Requirements: all_

  - [x] 40.2 Test backward compatibility


    - Load existing pipe with 'fetch' type
    - Verify it works with new engine
    - _Requirements: backward compatibility_


  - [x] 40.3 Test schema propagation flow

    - Preview source, connect downstream, verify dropdowns
    - _Requirements: 1.1, 1.2, 1.3, 1.4_



  - [x] 40.4 Test "Run Selected" execution

    - Select middle operator, verify upstream execution
    - _Requirements: 10.1, 10.2, 10.4_




  - [x] 40.5 Test user input flow

    - Add user inputs, execute, verify prompt
    - _Requirements: 4.5, 4.6_
