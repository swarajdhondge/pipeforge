# Design Document: Editor UX Fixes

## Overview

This design addresses several UX issues in the pipe editor:
1. First-time overlay needs to be concise and non-scrollable
2. Default edges missing arrow markers
3. Keyboard shortcuts for undo/redo not working
4. Pipe execution issues

## Architecture

The fixes span multiple components:
- `FirstTimeOverlay.tsx` - Simplify content and ensure fixed dimensions
- `canvas-slice.ts` - Add markerEnd to default edges
- `EditorCanvas.tsx` - Add keyboard shortcut handling for undo/redo
- `EditorToolbar.tsx` - Ensure keyboard shortcuts are registered

## Components and Interfaces

### 1. FirstTimeOverlay Changes

```typescript
// Simplified step configuration
const STEPS: Record<1 | 2 | 3, StepConfig> = {
  1: {
    title: 'Add a Source',
    instruction: 'Drag "Fetch JSON" from the left panel',
    highlight: 'palette',
  },
  2: {
    title: 'Connect Nodes',
    instruction: 'Drag from the blue dot to connect operators',
    highlight: 'connection',
  },
  3: {
    title: 'Run Your Pipe',
    instruction: 'Click Run to see results',
    highlight: 'run-button',
  },
};
```

CSS changes:
- Remove scrollable content
- Fixed tooltip dimensions (max-width: 320px, no overflow)
- Reduce padding and margins

### 2. Default Edge Configuration

```typescript
// In canvas-slice.ts
import { MarkerType } from 'reactflow';

const DEFAULT_EDGES: Edge[] = [
  {
    id: 'e-fetch-1-output-1',
    source: 'fetch-1',
    target: 'output-1',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#6b7280',
    },
    style: {
      strokeWidth: 2,
      stroke: '#6b7280',
    },
  },
];
```

### 3. Keyboard Shortcuts Integration

```typescript
// In EditorCanvas.tsx or EditorToolbar.tsx
import { useKeyboardShortcuts } from '../../../hooks/use-keyboard-shortcuts';

const shortcuts = [
  {
    key: 'z',
    ctrl: true,
    handler: () => dispatch(undo()),
    description: 'Undo',
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    handler: () => dispatch(redo()),
    description: 'Redo',
  },
];

useKeyboardShortcuts(shortcuts);
```

## Data Models

No changes to data models required. The fixes are primarily UI/UX improvements.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: First-time overlay localStorage persistence
*For any* user interaction where the "Don't show again" button is clicked, the localStorage key should be set, and subsequent hook calls should return `showOverlay: false`.
**Validates: Requirements 1.2, 1.3**

### Property 2: Default edges have arrow markers
*For any* default edge in the canvas initial state, the edge should have a markerEnd property with type ArrowClosed.
**Validates: Requirements 2.1, 2.3**

### Property 3: New connections have arrow markers
*For any* new connection created via onConnect, the resulting edge should have a markerEnd property with type ArrowClosed.
**Validates: Requirements 2.2**

### Property 4: Keyboard shortcuts trigger undo/redo
*For any* keyboard event with Ctrl+Z (or Cmd+Z on Mac), the undo action should be dispatched. For Ctrl+Shift+Z, the redo action should be dispatched.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 5: Welcome modal localStorage persistence
*For any* user interaction where the welcome modal is closed, the localStorage key should be set, and subsequent hook calls should return `isOpen: false`.
**Validates: Requirements 5.1, 5.2, 5.3**

## Error Handling

- If localStorage is unavailable (private browsing), gracefully fall back to showing overlays/modals
- If keyboard event handling fails, log error but don't crash the application
- If execution fails, display clear error message with operator context

## Testing Strategy

### Unit Tests
- Test that default edges have markerEnd property
- Test that onConnect adds markerEnd to new edges
- Test localStorage persistence for first-time overlay
- Test localStorage persistence for welcome modal

### Property-Based Tests
Using Vitest with fast-check:

1. **Property 1**: First-time overlay persistence
   - Generate random sequences of show/dismiss actions
   - Verify localStorage state matches expected behavior

2. **Property 4**: Keyboard shortcuts
   - Generate keyboard events with various modifier combinations
   - Verify correct action is dispatched for undo/redo combinations

### Integration Tests
- Test full keyboard shortcut flow in editor context
- Test execution flow with sample pipe
