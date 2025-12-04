# Design Document: UX Simplification

## Overview

This design addresses critical UX issues in the pipe editor that make it difficult for novice users. The core philosophy is "show, don't tell" - instead of adding tooltips and documentation, we simplify the interface so the correct action is always obvious.

Key design principles:
1. **Compact by default** - Minimize chrome, maximize canvas
2. **Progressive disclosure** - Show complexity only when needed
3. **Visual guidance** - Use visual cues instead of text instructions
4. **Error prevention** - Make invalid actions impossible, not just warned
5. **Sensible defaults** - Everything works out of the box

## Architecture

### Component Hierarchy Changes

```
PipeEditorPage
├── CompactNavigationBar (new - 48px height)
├── EditorContainer (flex, full height)
│   ├── CollapsiblePalette (overlay, 200px max)
│   │   ├── CategoryAccordion (collapsed by default)
│   │   └── OperatorItem (compact)
│   ├── CanvasContainer (flex-1, stable size)
│   │   ├── ReactFlowCanvas
│   │   │   ├── CompactOperatorNode (new)
│   │   │   ├── PipeOutputNode (with results preview)
│   │   │   └── ConnectionGuidance (visual cues)
│   │   ├── CanvasToolbar (with Run button)
│   │   ├── FirstTimeOverlay (conditional)
│   │   └── ConnectionWarningBanner (conditional)
│   └── ExecutionPanel (overlay, not push)
```

### State Management Changes

```typescript
// New Redux slice: editor-ui-slice.ts
interface EditorUIState {
  // Palette state
  expandedCategory: string | null;  // Only one at a time
  paletteCollapsed: boolean;
  
  // Node state
  expandedNodeId: string | null;    // Only one at a time
  
  // Guidance state
  showFirstTimeGuide: boolean;
  firstTimeStep: 1 | 2 | 3 | 'complete';
  guideDismissed: boolean;          // Persisted to localStorage
  
  // Execution state
  isRunning: boolean;
  lastExecutionResult: ExecutionResult | null;
}
```

## Components and Interfaces

### 1. CompactNavigationBar

```typescript
interface CompactNavBarProps {
  variant: 'default' | 'editor';  // Editor variant is more compact
}

// Styling constants
const NAV_HEIGHT = 48;           // px (down from ~64px)
const ICON_SIZE = 20;            // px (down from ~24px)
const FONT_SIZE = 14;            // px (down from ~16px)
const PADDING = 8;               // px
```

### 2. CollapsiblePalette

```typescript
interface CollapsiblePaletteProps {
  expandedCategory: string | null;
  onCategoryToggle: (category: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface OperatorCategory {
  id: string;
  name: string;
  icon: ReactNode;
  operators: OperatorDefinition[];
  isAdvanced?: boolean;  // Hidden for first-time users
}

// Categories in order
const CATEGORIES: OperatorCategory[] = [
  { id: 'common', name: 'Common', operators: ['fetch-json', 'filter', 'sort'] },
  { id: 'sources', name: 'Sources', operators: ['fetch-csv', 'fetch-rss', 'fetch-page'] },
  { id: 'user-inputs', name: 'User Inputs', operators: ['text-input', 'number-input', 'url-input', 'date-input'] },
  { id: 'transforms', name: 'Transforms', operators: ['unique', 'truncate', 'tail', 'rename'] },
  { id: 'string', name: 'String', operators: ['string-replace', 'regex', 'substring'], isAdvanced: true },
  { id: 'url', name: 'URL', operators: ['url-builder'], isAdvanced: true },
];
```

### 3. CompactOperatorNode

```typescript
interface CompactOperatorNodeProps {
  id: string;
  type: string;
  data: OperatorData;
  isExpanded: boolean;
  hasErrors: boolean;
  onToggleExpand: () => void;
}

// Compact mode: ~60px height (icon + name + handles)
// Expanded mode: Variable height based on config fields
```

### 4. FirstTimeOverlay

```typescript
interface FirstTimeOverlayProps {
  step: 1 | 2 | 3 | 'complete';
  onSkip: () => void;
  onComplete: () => void;
}

const STEPS = {
  1: {
    title: 'Start Here',
    instruction: 'Drag a source (like Fetch JSON) from the left panel',
    highlight: 'palette',
  },
  2: {
    title: 'Connect It',
    instruction: 'Drag from the output handle to Pipe Output',
    highlight: 'connection',
  },
  3: {
    title: 'Run It',
    instruction: 'Click Run to see your data',
    highlight: 'run-button',
  },
};
```

### 5. ConnectionGuidance

```typescript
interface ConnectionGuidanceProps {
  nodes: Node[];
  edges: Edge[];
  isDragging: boolean;
  dragSource: string | null;
}

// Visual states:
// - Unconnected output: Pulsing blue glow
// - Valid drop target: Green highlight
// - Invalid drop target: Red with shake
// - Missing path to output: Warning banner
```

### 6. PipeOutputNode (Enhanced)

```typescript
interface PipeOutputNodeProps {
  data: {
    result?: ExecutionResult;
    isExecuting: boolean;
    error?: string;
  };
}

interface ResultPreview {
  itemCount: number;
  previewItems: any[];      // First 3-5 items
  truncated: boolean;
}
```

## Data Models

### Operator Defaults

```typescript
const OPERATOR_DEFAULTS: Record<string, OperatorConfig> = {
  'fetch-json': {
    url: 'https://jsonplaceholder.typicode.com/posts',
    // Advanced options hidden by default
  },
  'filter': {
    mode: 'permit',
    match: 'any',
    rules: [{ field: '', operator: 'contains', value: '' }],
  },
  'sort': {
    field: '',
    direction: 'asc',
  },
  'truncate': {
    count: 10,
  },
  'unique': {
    field: '',
  },
  'tail': {
    count: 10,
    mode: 'last',  // 'last' or 'skip'
  },
};
```

### User Preferences (localStorage)

```typescript
interface UserPreferences {
  guideDismissed: boolean;
  pipeCount: number;           // Track experience level
  lastVisit: string;
  preferredPaletteState: 'collapsed' | 'expanded';
}

const STORAGE_KEY = 'pipeforge_user_prefs';
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Canvas Stability
*For any* UI state change (palette toggle, node expansion, panel open/close), the canvas dimensions and viewport position SHALL remain unchanged.

This ensures users never lose their place when interacting with UI elements.

**Validates: Requirements 4.1, 4.2, 4.5**

### Property 2: Accordion Category Exclusivity
*For any* category in the operator palette, expanding it SHALL collapse all other categories, ensuring only one category is expanded at any time.

This keeps the palette compact and focused.

**Validates: Requirements 3.3**

### Property 3: Single Node Expansion
*For any* operator node on the canvas, expanding it SHALL collapse all other expanded nodes, ensuring only one node shows its configuration at any time.

This prevents canvas clutter and focuses user attention.

**Validates: Requirements 8.4**

### Property 4: Valid Operator Defaults
*For any* operator type, adding it to the canvas SHALL result in a configuration that passes validation and can be executed immediately.

This ensures operators work out of the box without requiring configuration.

**Validates: Requirements 14.5**

## Error Handling

### Connection Errors
- **Invalid target**: Visual shake animation + red highlight (no error message needed)
- **Circular connection**: Flash the cycle path in red, prevent connection
- **Missing output connection**: Persistent warning banner, Run button disabled

### Execution Errors
- **Network error**: Show on failed node with retry button
- **Empty result**: Show "No data returned" with suggestion
- **Timeout**: Show timeout message with "Try again" option

### Validation Errors
- **Invalid URL**: Inline red border as user types
- **Empty required field**: Placeholder shows example, not "Required"
- **Invalid regex**: Inline error explaining the issue

## Testing Strategy

### Unit Tests
- CompactNavigationBar renders at correct height
- CollapsiblePalette accordion behavior
- CompactOperatorNode expand/collapse
- FirstTimeOverlay step progression
- ConnectionGuidance visual states
- Operator default configurations

### Property-Based Tests (using fast-check)

1. **Canvas Stability Property Test**
   - Generate random sequences of UI actions (toggle palette, expand nodes, open panels)
   - Assert canvas dimensions unchanged after each action
   - Assert viewport position unchanged after each action

2. **Accordion Exclusivity Property Test**
   - Generate random sequences of category clicks
   - Assert at most one category is expanded after each click

3. **Single Node Expansion Property Test**
   - Generate random sequences of node clicks
   - Assert at most one node is expanded after each click

4. **Valid Defaults Property Test**
   - For each operator type, create with defaults
   - Assert validation passes
   - Assert can be executed (no required fields empty)

### Integration Tests
- Full pipe execution: Fetch JSON → Pipe Output
- First-time user flow: Add source → Connect → Run
- Responsive layout at different viewport sizes

