# Implementation Plan

## Phase 1: Navigation and Layout Foundation

- [x] 1. Create compact navigation bar variant








  - [x] 1.1 Update NavigationBar component with compact variant prop





    - Add `variant: 'default' | 'editor'` prop
    - Reduce height to 48px for editor variant
    - Reduce icon size to 20px, font size to 14px
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.2 Apply compact variant on PipeEditorPage


    - Pass `variant="editor"` to NavigationBar
    - Verify reduced scrolling needed
    - _Requirements: 1.4, 1.5_

- [x] 2. Fix canvas layout stability





  - [x] 2.1 Refactor editor layout to use overlay panels


    - Change palette from flex item to absolute positioned overlay
    - Change execution panel to overlay instead of pushing content
    - Use CSS `position: absolute` with proper z-index
    - _Requirements: 4.1, 4.3, 4.4_
  - [x] 2.2 Write property test for canvas stability



    - **Property 1: Canvas Stability**
    - **Validates: Requirements 4.1, 4.2, 4.5**
    - Test canvas dimensions unchanged after panel toggles
    - Test viewport position unchanged after node expansion

- [x] 3. Implement canvas auto-fit on load





  - [x] 3.1 Add fitView call on pipe load with padding


    - Call `fitView({ padding: 0.1 })` after nodes are loaded
    - Center single/few nodes at 100% zoom
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 3.2 Add "Fit to View" button to canvas toolbar

    - Add button with icon to CanvasToolbar
    - Trigger fitView on click
    - _Requirements: 2.4_
  - [x] 3.3 Prevent auto-refit on window resize


    - Remove any resize listeners that call fitView
    - _Requirements: 2.3_

## Phase 2: Operator Palette Simplification

- [x] 4. Implement collapsible palette with accordion behavior





  - [x] 4.1 Create CollapsiblePalette component


    - Categories collapsed by default on load
    - Accordion behavior (one category at a time)
    - Compact 200px max width
    - _Requirements: 3.1, 3.2, 3.4_
  - [x] 4.2 Write property test for accordion exclusivity


    - **Property 2: Accordion Category Exclusivity**
    - **Validates: Requirements 3.3**
    - Test only one category expanded at any time
  - [x] 4.3 Organize operators into categories


    - Common: Fetch JSON, Filter, Sort
    - Sources: Fetch CSV, Fetch RSS, Fetch Page
    - User Inputs: Text, Number, URL, Date
    - Transforms: Unique, Truncate, Tail, Rename
    - String: Replace, Regex, Substring (advanced)
    - URL: URL Builder (advanced)
    - _Requirements: 11.1 (from yahoo-pipes-canvas spec)_

  - [x] 4.4 Add responsive palette behavior

    - Icon-only mode below 1200px
    - Hidden behind toggle below 900px
    - _Requirements: 11.2, 11.3_

- [x] 5. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Compact Operator Nodes

- [x] 6. Create CompactOperatorNode component





  - [x] 6.1 Implement compact default view


    - Show only icon, name, and connection handles
    - ~60px height in compact mode
    - Warning badge for validation errors
    - _Requirements: 8.1, 8.5_
  - [x] 6.2 Implement expand on click behavior


    - Expand to show inline config on click
    - Collapse on click outside
    - _Requirements: 8.2, 8.3_
  - [x] 6.3 Write property test for single node expansion


    - **Property 3: Single Node Expansion**
    - **Validates: Requirements 8.4**
    - Test only one node expanded at any time

  - [x] 6.4 Update all operator inline configs to work with compact mode

    - Ensure configs render correctly when expanded
    - _Requirements: 8.1, 8.2_

## Phase 4: Sensible Defaults and Validation

- [x] 7. Implement operator defaults




  - [x] 7.1 Add default configurations for all operators


    - Fetch JSON: Pre-fill with jsonplaceholder.typicode.com/posts
    - Filter: Default to Permit mode, any matching
    - Sort: Default to ascending
    - Truncate: Default to 10 items
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  - [x] 7.2 Write property test for valid defaults


    - **Property 4: Valid Operator Defaults**
    - **Validates: Requirements 14.5**
    - Test all operator types have valid default configs
  - [x] 7.3 Implement progressive disclosure for advanced options


    - Hide headers/auth behind "Advanced" toggle in Fetch
    - Show one rule by default in Filter
    - _Requirements: 15.1, 15.2_

- [x] 8. Implement inline validation






  - [x] 8.1 Add real-time URL validation

    - Validate as user types
    - Show red border for invalid URLs
    - _Requirements: 13.3_

  - [x] 8.2 Add helpful placeholders with examples

    - Show example values in placeholders
    - _Requirements: 13.5_
-

- [x] 9. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Visual Connection Guidance

- [x] 10. Implement connection visual cues





  - [x] 10.1 Add pulsing indicator for unconnected outputs

    - CSS animation on output handles without connections
    - _Requirements: 7.1_

  - [x] 10.2 Highlight valid/invalid drop targets during drag

    - Green highlight for valid targets
    - Red indicator for invalid targets
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 10.3 Add warning banner for missing Pipe Output connection

    - Show persistent banner when no path to output
    - _Requirements: 7.5_
-

- [x] 11. Implement error prevention





  - [x] 11.1 Add visual feedback for invalid connections

    - Shake animation for output-to-output attempts
    - Flash cycle path for circular connections
    - _Requirements: 13.1, 13.2_

  - [x] 11.2 Highlight missing connection on invalid run attempt

    - Instead of error message, highlight the problem
    - _Requirements: 13.4_

## Phase 6: Run Button and Results Display
- [x] 12. Implement prominent Run button




- [ ] 12. Implement prominent Run button


  - [x] 12.1 Add "Run Pipe" button to canvas toolbar

    - Prominent styling, always visible
    - Disabled with tooltip when pipe invalid
    - _Requirements: 9.1, 9.5_

  - [ ] 12.2 Implement loading state during execution
    - Spinner on button, button disabled

    - _Requirements: 9.3_
  - [ ] 12.3 Wire up full pipe execution
    - Execute from all sources through to Pipe Output
    - _Requirements: 9.2, 9.4_
-

- [x] 13. Enhance Pipe Output node with results display





  - [x] 13.1 Show results preview in Pipe Output node

    - Item count and first 3-5 items
    - Auto-expand on execution complete
    - _Requirements: 10.1, 10.2_

  - [x] 13.2 Add "View All" button for full results modal

    - Open modal with full JSON, syntax highlighted

    - _Requirements: 10.3, 10.4_
  - [x] 13.3 Show inline errors on failed operators

    - Error message directly on the failed node
    - _Requirements: 10.5_
-

- [x] 14. Fix JSON Fetch execution flow





  - [x] 14.1 Debug and fix data flow from Fetch to Pipe Output

    - Ensure data passes through correctly
    - Verify output displays fetched data
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 14.2 Handle empty results gracefully
    - Show "No data returned" message
    - _Requirements: 5.4_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: First-Time User Experience
- [x] 16. Implement first-time guidance overlay



- [ ] 16. Implement first-time guidance overlay

  - [x] 16.1 Create FirstTimeOverlay component


    - 3-step guidance: Add source → Connect → Run
    - Highlight relevant UI areas for each step
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 16.2 Implement step progression logic

    - Detect when source is added (step 1 → 2)
    - Detect when connection is made (step 2 → 3)
    - Detect when run completes (step 3 → complete)
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ] 16.3 Add skip/dismiss functionality with persistence
    - "Skip" and "Don't show again" options
    - Save preference to localStorage

   - _Requirements: 6.6_

- [x] 17. Implement contextual help





  - [x] 17.1 Add timed hints for stuck users

    - Hint after 3s hover on empty URL field
    - Hint arrow after 10s with unconnected operator
    - _Requirements: 12.1, 12.2_

  - [x] 17.2 Add canvas context menu

    - Right-click menu with common actions
    - _Requirements: 12.4_

  - [x] 17.3 Add keyboard shortcut reference

    - Show on "?" key press
    - _Requirements: 12.5_
-

- [x] 18. Implement progressive disclosure for advanced users





  - [x] 18.1 Track user experience level

    - Count pipes created, store in localStorage
    - _Requirements: 15.5_

  - [x] 18.2 Show/hide advanced operators based on experience

    - Hide String and URL categories for new users
    - Show all after 5+ pipes created
    - _Requirements: 15.3, 15.4, 15.5_

## Phase 8: Responsive Layout
- [x] 19. Implement responsive canvas layout




- [ ] 19. Implement responsive canvas layout


  - [x] 19.1 Calculate canvas space based on viewport

    - Use flexbox/calc for proper sizing
    - _Requirements: 11.1, 11.5_

  - [x] 19.2 Implement breakpoint behaviors

    - 1200px: Icon-only palette
    - 900px: Hidden palette with toggle
    - _Requirements: 11.2, 11.3, 11.4_

-


- [x] 20. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

