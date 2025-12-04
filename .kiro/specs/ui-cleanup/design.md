# Design Document: UI Cleanup & Code Reorganization

## Overview

This design creates a clean, professional pipe editor interface by:
1. Removing visual clutter and duplicate controls
2. Reorganizing code into maintainable modules
3. Establishing consistent visual design patterns
4. Creating a proportionate, non-overlapping layout

## Architecture

### New File Structure

```
frontend/src/
├── pages/
│   └── editor/
│       ├── index.tsx              # Main page (layout only, ~50 lines)
│       ├── components/
│       │   ├── EditorHeader.tsx   # Title, status, run, save (~100 lines)
│       │   ├── EditorCanvas.tsx   # ReactFlow wrapper (~100 lines)
│       │   ├── EditorSidebar.tsx  # Operator palette (~120 lines)
│       │   ├── EditorConfigPanel.tsx  # Node configuration (~120 lines)
│       │   └── EditorResultsPanel.tsx # Execution results (~100 lines)
│       └── logic/
│           ├── canvas-interactions.ts  # Node/edge handlers
│           ├── execution-logic.ts      # Run pipe logic
│           └── saving-logic.ts         # Save/load logic
```

### Component Hierarchy

```
EditorPage (layout container)
├── EditorHeader (fixed, 48px)
│   ├── PipeTitle
│   ├── StatusIndicator
│   └── ActionButtons (Run, Save, Undo, Redo)
├── EditorMain (flex container)
│   ├── EditorSidebar (200px, collapsible)
│   │   └── OperatorCategories
│   ├── EditorCanvas (flex-1)
│   │   ├── ReactFlow
│   │   └── ZoomControls (bottom-right only)
│   └── EditorConfigPanel (300px, hidden by default)
│       └── NodeConfigForm
└── EditorResultsPanel (bottom, hidden by default)
    └── ExecutionResults
```

## Components and Interfaces

### 1. EditorPage (Layout Container)

```typescript
// pages/editor/index.tsx
const EditorPage: FC = () => {
  return (
    <div className="h-screen flex flex-col">
      <EditorHeader />
      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar />
        <EditorCanvas />
        <EditorConfigPanel />
      </div>
      <EditorResultsPanel />
    </div>
  );
};
```

### 2. EditorHeader

```typescript
interface EditorHeaderProps {
  pipeName: string;
  isDirty: boolean;
  isExecuting: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onRun: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

// Fixed height: 48px
// Layout: [Logo | Title | Status] [Undo Redo] [Run] [Save]
```

### 3. EditorSidebar

```typescript
interface EditorSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

// Width: 200px (full) | 48px (collapsed) | 0px (hidden)
// Contains: Operator categories with accordion behavior
```

### 4. EditorCanvas

```typescript
interface EditorCanvasProps {
  // Uses Redux for nodes/edges
}

// Takes remaining space (flex-1)
// Contains: ReactFlow + ZoomControls only
// No floating toolbar
```

### 5. EditorConfigPanel

```typescript
interface EditorConfigPanelProps {
  selectedNodeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Width: 300px
// Hidden by default, opens when node is clicked
// Slides in from right
```

### 6. EditorResultsPanel

```typescript
interface EditorResultsPanelProps {
  result: ExecutionResult | null;
  isOpen: boolean;
  onClose: () => void;
}

// Height: 200px (collapsed tab) | 300px (expanded)
// Hidden by default, shows after execution
```

## Data Models

### Layout State

```typescript
interface EditorLayoutState {
  sidebarCollapsed: boolean;
  configPanelOpen: boolean;
  resultsPanelOpen: boolean;
  selectedNodeId: string | null;
}
```

### Design Tokens

```typescript
const DESIGN_TOKENS = {
  // Spacing (8px grid)
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
  },
  
  // Typography
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
  },
  
  // Sizes
  header: { height: 48 },
  sidebar: { width: 200, collapsedWidth: 48 },
  configPanel: { width: 300 },
  resultsPanel: { height: 300, collapsedHeight: 40 },
  node: { width: 180, height: 50 },
  
  // Colors (neutral palette)
  colors: {
    background: '#f8f9fa',
    surface: '#ffffff',
    border: '#e5e7eb',
    text: '#1f2937',
    textMuted: '#6b7280',
    primary: '#6B4C9A',
    success: '#10b981',
    error: '#ef4444',
  },
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Layout Stability
*For any* panel state change (sidebar toggle, config open/close, results open/close), the canvas dimensions SHALL remain stable and not cause content to jump or overlap.

**Validates: Requirements 1.4**

### Property 2: Canvas Minimum Width
*For any* viewport width and panel configuration, the canvas SHALL maintain at least 60% of the viewport width.

**Validates: Requirements 1.5**

### Property 3: Single Control Instance
*For any* action (Run, Save, Undo, Redo), there SHALL be exactly one control button in the DOM.

**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

### Property 4: Compact Node Height
*For any* operator node in collapsed state, the rendered height SHALL be at most 50px.

**Validates: Requirements 3.2**

### Property 5: Consistent Node Styling
*For any* operator node regardless of type, the background color SHALL be the same neutral gray.

**Validates: Requirements 4.1**

### Property 6: Responsive Sidebar
*For any* viewport width below 1200px, the sidebar width SHALL be 48px (icon-only mode).

**Validates: Requirements 6.1**

## Error Handling

- **Panel overflow**: Use CSS overflow-hidden and scroll within panels
- **Small viewport**: Collapse panels progressively, never overlap
- **Missing config**: Show placeholder in config panel when no node selected

## Testing Strategy

### Unit Tests
- EditorHeader renders with correct height and elements
- EditorSidebar collapses/expands correctly
- EditorConfigPanel opens/closes without affecting canvas
- Node components render at correct height

### Property-Based Tests (using fast-check)

1. **Layout Stability Test**
   - Generate random sequences of panel toggles
   - Assert canvas dimensions unchanged after each toggle

2. **Canvas Width Test**
   - Generate random viewport widths
   - Assert canvas is always >= 60% of viewport

3. **Node Height Test**
   - Generate random operator types
   - Assert all collapsed nodes are <= 50px height

4. **Responsive Breakpoint Test**
   - Generate viewport widths around breakpoints
   - Assert correct sidebar state at each width

### Integration Tests
- Full editor loads without errors
- Node click opens config panel
- Run button executes pipe
- Save button persists changes
