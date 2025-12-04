# Design Document

## Overview

This design document addresses the specific broken functionality in the editor, focusing on minimal changes to existing code. The goal is to fix what's broken without introducing new features or restructuring working code.

**Files to Modify (not create):**
- `frontend/src/pages/editor/components/EditorCanvas.tsx` - Register edgeTypes, add keyboard handlers
- `frontend/src/components/editor/SelectableEdge.tsx` - Minor fixes if needed

**No new files needed** - all components already exist.

## Architecture

The editor follows a standard ReactFlow architecture:

```
EditorPage (pages/editor/index.tsx)
├── NavigationBar
├── EditorToolbar (undo/redo, save, run)
└── Main Content
    ├── OperatorsSidebar (operator palette)
    └── EditorCanvas (ReactFlow canvas)
        ├── nodeTypes: { fetch-json: OperatorNode, ... }
        ├── edgeTypes: { selectable: SelectableEdge } <- MISSING
        └── EditorResultsPanel
```

**Current Issue:** EditorCanvas.tsx defines `nodeTypes` but not `edgeTypes`, so SelectableEdge is never used.

## Components and Interfaces

### EditorCanvas Changes

```typescript
// frontend/src/pages/editor/components/EditorCanvas.tsx

// ADD: Import SelectableEdge and EdgeContextMenu
import { SelectableEdge } from '../../../components/editor/SelectableEdge';
import { EdgeContextMenu } from '../../../components/editor/EdgeContextMenu';

// ADD: Define edge types (currently missing)
const edgeTypes = {
  selectable: SelectableEdge,
};

// ADD: State for edge context menu
const [contextMenu, setContextMenu] = useState<{
  x: number;
  y: number;
  edgeId: string;
} | null>(null);

// ADD: Pass edgeTypes to ReactFlow
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}  // <- ADD THIS
  defaultEdgeOptions={{
    type: 'selectable',  // <- ADD THIS
  }}
  // ... rest of props
/>

// ADD: Render EdgeContextMenu when contextMenu state is set
{contextMenu && (
  <EdgeContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    edgeId={contextMenu.edgeId}
    onDelete={handleDeleteEdge}
    onClose={() => setContextMenu(null)}
  />
)}
```

### Keyboard Shortcuts for Delete

```typescript
// In EditorCanvas.tsx or EditorToolbar.tsx

// ADD: Register delete keyboard shortcut
useKeyboardShortcuts([
  {
    key: 'Delete',
    handler: () => {
      if (selectedNode) {
        dispatch(saveToHistory());
        dispatch(removeNode(selectedNode));
      }
      if (selectedEdges.length > 0) {
        dispatch(saveToHistory());
        dispatch(removeSelectedEdges());
      }
    },
    description: 'Delete selected',
  },
  {
    key: 'Backspace',
    handler: () => {
      if (selectedNode) {
        dispatch(saveToHistory());
        dispatch(removeNode(selectedNode));
      }
      if (selectedEdges.length > 0) {
        dispatch(saveToHistory());
        dispatch(removeSelectedEdges());
      }
    },
    description: 'Delete selected',
  },
  {
    key: 'Escape',
    handler: () => {
      dispatch(setSelectedNode(null));
      dispatch(clearEdgeSelection());
    },
    description: 'Deselect all',
  },
]);
```

### Edge Selection Handling

```typescript
// In EditorCanvas.tsx

// ADD: Handle edge click for selection
const onEdgeClick = useCallback(
  (_event: React.MouseEvent, edge: Edge) => {
    dispatch(setSelectedEdges([edge.id]));
    dispatch(setSelectedNode(null)); // Deselect nodes when edge is selected
  },
  [dispatch]
);

// ADD: Handle edge context menu
const onEdgeContextMenu = useCallback(
  (event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      edgeId: edge.id,
    });
  },
  []
);

// ADD: Handle edge deletion from context menu
const handleDeleteEdge = useCallback(
  (edgeId: string) => {
    dispatch(saveToHistory());
    dispatch(removeEdge(edgeId));
  },
  [dispatch]
);

// ADD: Pass handlers to ReactFlow
<ReactFlow
  // ... existing props
  onEdgeClick={onEdgeClick}
  onEdgeContextMenu={onEdgeContextMenu}
/>
```

### Edge Styling for Selection

The SelectableEdge component already handles hover and selection styling. We need to ensure edges are created with the correct type:

```typescript
// In onConnect callback, update edge creation:
const newEdge = {
  ...connection,
  id: `e${connection.source}-${connection.target}`,
  type: 'selectable',  // <- Use selectable type instead of smoothstep
  // Remove markerEnd and style - SelectableEdge handles this
};
```

## Data Models

No new data models needed. The existing canvas-slice.ts already has:
- `selectedEdges: string[]`
- `removeEdge(edgeId: string)`
- `removeSelectedEdges()`
- `setSelectedEdges(edgeIds: string[])`
- `clearEdgeSelection()`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Event propagation stops at interactive elements
*For any* interactive element (input, select, button, checkbox) inside an OperatorNode, clicking on it SHALL NOT trigger node drag or selection change.
**Validates: Requirements 1.1, 1.2, 1.3, 1.5, 9.6**

### Property 2: Edge deletion removes edge from state
*For any* edge in the canvas, when deleted (via keyboard or context menu), the edge SHALL be removed from Redux state and no longer rendered.
**Validates: Requirements 8.2, 8.4, 12.2**

### Property 3: Keyboard delete respects focus
*For any* keyboard delete event, if focus is in an input or textarea, the delete SHALL NOT remove nodes or edges.
**Validates: Requirements 12.4**

### Property 4: First-time overlay persistence
*For any* user who dismisses the first-time overlay, subsequent visits SHALL NOT show the overlay.
**Validates: Requirements 5.2, 5.3**

### Property 5: Execution order follows topology
*For any* pipe with connected operators, execution SHALL proceed in topological order (sources first, then downstream).
**Validates: Requirements 11.1, 11.5**

## Error Handling

- **Invalid edge type**: If an edge has an unrecognized type, fall back to default smoothstep rendering
- **Missing node for deletion**: If selectedNode doesn't exist in nodes array, ignore the delete action
- **Context menu outside viewport**: Clamp context menu position to stay within viewport bounds

## Testing Strategy

### Unit Tests (Existing - Verify Still Pass)
- `canvas-slice.test.ts` - Verify edge removal actions work correctly
- `connection-validator.test.ts` - Verify connection validation logic

### Integration Tests (Manual Verification)
1. Click on edge → edge should highlight and be selected
2. Press Delete with edge selected → edge should be removed
3. Right-click on edge → context menu should appear
4. Click "Delete Connection" in context menu → edge should be removed
5. Press Delete with node selected → node and its edges should be removed
6. Click on input inside node → input should focus, node should not drag
7. Click on toggle inside node → toggle should change, node should not drag

### Property-Based Testing
Using Vitest with fast-check for property tests:

```typescript
// Test: Event propagation stops at interactive elements
// Generate random click events on interactive elements
// Verify no drag events are fired

// Test: Edge deletion removes edge from state
// Generate random edge selections and deletions
// Verify state consistency after each operation

// Test: Keyboard delete respects focus
// Generate random focus states and delete keypresses
// Verify delete only works when not in input/textarea
```

