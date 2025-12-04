# Implementation Plan

## Phase 1: Create New Editor Structure

- [x] 1. Set up new editor folder structure






  - [x] 1.1 Create pages/editor/ folder with index.tsx


    - Create basic layout shell with header, main, and results areas
    - Import existing Redux state
    - _Requirements: 5.1_

  - [x] 1.2 Create EditorHeader component


    - Fixed 48px height
    - Contains: Title, Status indicator, Undo/Redo, Run, Save buttons
    - _Requirements: 1.2, 2.1, 2.2, 2.3_

  - [x] 1.3 Create EditorCanvas component


    - ReactFlow wrapper with zoom controls only
    - No floating toolbar
    - _Requirements: 2.4_

  - [x] 1.4 Create EditorSidebar component



    - 200px width, collapsible to 48px
    - Operator categories with accordion
    - _Requirements: 1.1_


  - [x] 1.5 Create EditorConfigPanel component


    - 300px width, hidden by default
    - Opens when node is clicked
    - _Requirements: 3.3_


  - [x] 1.6 Create EditorResultsPanel component


    - Hidden by default, shows after execution
    - Collapsible with tab indicator
    - _Requirements: 1.3_


- [x] 2. Checkpoint - Verify new structure works



  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Extract Logic

- [x] 3. Extract editor logic into separate files




  - [x] 3.1 Create canvas-interactions.ts


    - Node click, drag, connect handlers
    - Edge handlers
    - _Requirements: 5.3_



  - [x] 3.2 Create execution-logic.ts


    - Run pipe function
    - Result handling

    - _Requirements: 5.3_

  - [x] 3.3 Create saving-logic.ts



    - Save/load pipe functions
    - Draft management
    - _Requirements: 5.3_


- [x] 4. Checkpoint - Verify logic extraction works

  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Implement Clean Layout

- [x] 5. Implement 3-column layout



  - [x] 5.1 Set up flexbox layout in EditorPage

    - Sidebar (200px) | Canvas (flex-1) | Config (300px)
    - Canvas gets minimum 60% width
    - _Requirements: 1.1, 1.5_


  - [x] 5.2 Write property test for canvas minimum width

    - **Property 2: Canvas Minimum Width**
    - **Validates: Requirements 1.5**


  - [x] 5.3 Implement panel open/close without overlap

    - Config panel slides in from right
    - Results panel slides up from bottom
    - Canvas dimensions stay stable
    - _Requirements: 1.4_


  - [x] 5.4 Write property test for layout stability

    - **Property 1: Layout Stability**
    - **Validates: Requirements 1.4**

- [x] 6. Checkpoint - Verify layout works


  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Implement Compact Nodes

- [x] 7. Create compact operator node design



  - [x] 7.1 Redesign OperatorNode to be compact

    - Max 50px height when collapsed
    - Show only: icon, name, handles
    - _Requirements: 3.1, 3.2_

  - [x] 7.2 Write property test for node height


    - **Property 4: Compact Node Height**
    - **Validates: Requirements 3.2**


  - [x] 7.3 Implement error/result badges


    - Small red badge for errors
    - Small green indicator for results
    - _Requirements: 3.4, 3.5_


  - [x] 7.4 Wire node click to open config panel


    - Click node → open EditorConfigPanel
    - _Requirements: 3.3_

- [x] 8. Checkpoint - Verify compact nodes work



  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Apply Professional Styling

- [x] 9. Apply design tokens and styling



  - [x] 9.1 Create design tokens file


    - Spacing: 8, 16, 24, 32px
    - Font sizes: 12, 14, 16, 20px
    - Colors: neutral palette
    - _Requirements: 4.4, 4.5_

  - [x] 9.2 Apply neutral node styling


    - Same gray background for all nodes
    - 1px light gray borders
    - _Requirements: 4.1, 4.2_


  - [x] 9.3 Write property test for consistent node styling

    - **Property 5: Consistent Node Styling**
    - **Validates: Requirements 4.1**

  - [x] 9.4 Replace emoji icons with SVG icons


    - Create SVG icon set for operators
    - _Requirements: 4.3_

- [x] 10. Checkpoint - Verify styling is consistent


  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Implement Responsive Behavior


- [x] 11. Add responsive breakpoints


  - [x] 11.1 Implement sidebar collapse at 1200px


    - Full (200px) → Icon-only (48px)
    - _Requirements: 6.1_

  - [x] 11.2 Write property test for responsive sidebar


    - **Property 6: Responsive Sidebar**
    - **Validates: Requirements 6.1**

  - [x] 11.3 Implement sidebar hide at 900px

    - Icon-only → Hidden with toggle button
    - _Requirements: 6.2_

  - [x] 11.4 Implement config panel overlay on small screens


    - Overlay instead of push on viewport < 1200px
    - _Requirements: 6.3_

  - [x] 11.5 Add smooth transitions

    - CSS transitions for panel open/close
    - _Requirements: 6.5_

- [x] 12. Checkpoint - Verify responsive behavior


  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Remove Old Code & Cleanup



- [x] 13. Remove duplicate controls and old components



  - [x] 13.1 Remove CanvasToolbar component


    - All controls now in EditorHeader
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 13.2 Write property test for single control instance


    - **Property 3: Single Control Instance**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**

  - [x] 13.3 Remove inline node config

    - Config now in EditorConfigPanel only
    - _Requirements: 3.3_

  - [x] 13.4 Update route to use new editor page

    - /editor → pages/editor/index.tsx
    - _Requirements: 5.1_


- [x] 14. Final Checkpoint - Full integration test




  - Ensure all tests pass, ask the user if questions arise.
