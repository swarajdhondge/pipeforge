# Implementation Plan

- [x] 1. Register SelectableEdge in EditorCanvas








  - [x] 1.1 Import SelectableEdge and EdgeContextMenu components

    - Add imports at top of `frontend/src/pages/editor/components/EditorCanvas.tsx`
    - Import SelectableEdge from `../../../components/editor/SelectableEdge`
    - Import EdgeContextMenu from `../../../components/editor/EdgeContextMenu`
    - _Requirements: 8.1, 8.5_


  - [x] 1.2 Define edgeTypes and pass to ReactFlow

    - Create `const edgeTypes = { selectable: SelectableEdge }`
    - Add `edgeTypes={edgeTypes}` prop to ReactFlow component
    - Add `defaultEdgeOptions={{ type: 'selectable' }}` prop
    - _Requirements: 8.1, 8.5_


  - [x] 1.3 Update onConnect to use selectable edge type



    - Change edge type from 'smoothstep' to 'selectable' in newEdge creation
    - Remove inline markerEnd and style (SelectableEdge handles this)
    - _Requirements: 8.1_

- [x] 2. Add edge selection and context menu handling










  - [x] 2.1 Add state for context menu position

    - Add useState for contextMenu: `{ x: number; y: number; edgeId: string } | null`
    - _Requirements: 8.3_


  - [x] 2.2 Implement onEdgeClick handler

    - Create callback that dispatches setSelectedEdges with clicked edge id
    - Also dispatch setSelectedNode(null) to deselect nodes
    - Pass onEdgeClick to ReactFlow
    - _Requirements: 8.1_


  - [x] 2.3 Implement onEdgeContextMenu handler


    - Create callback that prevents default and sets contextMenu state
    - Pass onEdgeContextMenu to ReactFlow
    - _Requirements: 8.3_




  - [x] 2.4 Implement handleDeleteEdge callback
    - Create callback that dispatches saveToHistory and removeEdge

    - _Requirements: 8.2_


  - [x] 2.5 Render EdgeContextMenu component

    - Add conditional render of EdgeContextMenu when contextMenu state is set
    - Pass x, y, edgeId, onDelete, onClose props
    - _Requirements: 8.3_

- [x] 3. Add keyboard shortcuts for deletion




  - [x] 3.1 Import required hooks and actions

    - Import useKeyboardShortcuts hook
    - Import removeNode, removeSelectedEdges, clearEdgeSelection from canvas-slice
    - _Requirements: 6.1, 12.1, 12.2_


  - [x] 3.2 Get selectedEdges from Redux state

    - Add selectedEdges to useSelector destructuring
    - _Requirements: 12.2_


  - [x] 3.3 Register Delete keyboard shortcut

    - Add shortcut for 'Delete' key that removes selected node or edges
    - Check selectedNode first, then selectedEdges
    - Dispatch saveToHistory before removal
    - _Requirements: 6.1, 12.1, 12.2_



  - [x] 3.4 Register Backspace keyboard shortcut
    - Add shortcut for 'Backspace' key with same logic as Delete

    - _Requirements: 6.1, 12.1, 12.2_


  - [x] 3.5 Register Escape keyboard shortcut
    - Add shortcut for 'Escape' key that deselects all
    - Dispatch setSelectedNode(null) and clearEdgeSelection()

    - _Requirements: 12.3_

  - [x] 3.6 Write property test for keyboard delete respects focus


    - **Property 3: Keyboard delete respects focus**
    - **Validates: Requirements 12.4**

- [x] 4. Checkpoint - Verify edge selection and deletion works





  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Verify inline config event handling





  - [x] 5.1 Test Filter operator toggles and buttons


    - Manually verify Permit/Block toggle works
    - Verify Add Rule button works
    - Verify rule removal works
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 5.2 Test input fields in operators


    - Verify typing in URL input works without dragging
    - Verify dropdown selection works
    - _Requirements: 9.4, 9.5, 9.6_


  - [x] 5.3 Write property test for event propagation

    - **Property 1: Event propagation stops at interactive elements**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 9.6**

- [x] 6. Final Checkpoint - Verify all functionality





  - Ensure all tests pass, ask the user if questions arise.

