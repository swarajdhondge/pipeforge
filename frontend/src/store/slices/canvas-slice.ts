import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Node, type Edge } from 'reactflow';

type OperatorNode = Node<{
  label: string;
  config: any;
}>;

interface PipeDefinition {
  nodes: OperatorNode[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
}

interface ExecutionResult {
  status: 'success' | 'error';
  result?: unknown;
  error?: string;
  intermediateResults?: Record<string, any>;
  executionOrder?: string[];
  executionTime?: number;
  executionInfo?: string;
  failedNodeId?: string;
  failedOperatorType?: string;
  validationErrors?: Array<{
    nodeId: string;
    field: string;
    message: string;
    operatorType: string;
    operatorLabel: string;
  }>;
}

interface CanvasState {
  nodes: OperatorNode[];
  edges: Edge[];
  /** @deprecated Use selectedNodes instead. Kept for backward compatibility. */
  selectedNode: string | null;
  /** Array of selected node IDs (supports multi-select with Ctrl+click) */
  selectedNodes: string[];
  selectedEdges: string[];
  expandedNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };
  isDirty: boolean;
  history: {
    past: PipeDefinition[];
    future: PipeDefinition[];
  };
  executionResult: ExecutionResult | null;
  isExecuting: boolean;
  /** Node ID to run selected execution from (null if not triggered) */
  runSelectedNodeId: string | null;
  /** Canvas interaction mode: pan (drag to move) or select (drag to box-select) */
  interactionMode: 'pan' | 'select';
  /** Timestamp when a pipe was loaded - used to trigger fitView */
  pipeLoadedAt: number;
}

// Default nodes for new pipes - Simple working pipeline: Fetch → Truncate → Output
const DEFAULT_NODES: OperatorNode[] = [
  {
    id: 'fetch-1',
    type: 'fetch-json',
    position: { x: 100, y: 150 },
    data: {
      label: 'Fetch JSON',
      config: {
        url: 'https://jsonplaceholder.typicode.com/posts',
      },
    },
  },
  {
    id: 'truncate-1',
    type: 'truncate',
    position: { x: 420, y: 150 },
    data: {
      label: 'Truncate',
      config: {
        count: 5,
      },
    },
  },
  {
    id: 'output-1',
    type: 'pipe-output',
    position: { x: 740, y: 150 },
    data: {
      label: 'Pipe Output',
      config: {},
    },
  },
];

// Default edges
const DEFAULT_EDGES: Edge[] = [
  {
    id: 'e-fetch-1-truncate-1',
    source: 'fetch-1',
    target: 'truncate-1',
    type: 'selectable',
  },
  {
    id: 'e-truncate-1-output-1',
    source: 'truncate-1',
    target: 'output-1',
    type: 'selectable',
  },
];

const initialState: CanvasState = {
  nodes: DEFAULT_NODES,
  edges: DEFAULT_EDGES,
  selectedNode: null,
  selectedNodes: [],
  selectedEdges: [],
  expandedNodeId: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  isDirty: false,
  history: {
    past: [],
    future: [],
  },
  executionResult: null,
  isExecuting: false,
  runSelectedNodeId: null,
  interactionMode: 'pan',
  pipeLoadedAt: Date.now(),
};

const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    setNodes: (state, action: PayloadAction<OperatorNode[]>) => {
      state.nodes = action.payload;
      state.isDirty = true;
    },
    addNode: (state, action: PayloadAction<OperatorNode>) => {
      state.nodes.push(action.payload);
      state.isDirty = true;
    },
    updateNode: (state, action: PayloadAction<{ id: string; data: any }>) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data = { ...node.data, ...action.payload.data };
        state.isDirty = true;
      }
    },
    removeNode: (state, action: PayloadAction<string>) => {
      state.nodes = state.nodes.filter((n) => n.id !== action.payload);
      state.edges = state.edges.filter(
        (e) => e.source !== action.payload && e.target !== action.payload
      );
      if (state.selectedNode === action.payload) {
        state.selectedNode = null;
      }
      state.selectedNodes = state.selectedNodes.filter((id) => id !== action.payload);
      state.isDirty = true;
    },
    /** Remove multiple nodes at once (for multi-select delete) */
    removeNodes: (state, action: PayloadAction<string[]>) => {
      const nodeIds = new Set(action.payload);
      state.nodes = state.nodes.filter((n) => !nodeIds.has(n.id));
      state.edges = state.edges.filter(
        (e) => !nodeIds.has(e.source) && !nodeIds.has(e.target)
      );
      if (state.selectedNode && nodeIds.has(state.selectedNode)) {
        state.selectedNode = null;
      }
      state.selectedNodes = [];
      state.isDirty = true;
    },
    setEdges: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload;
      state.isDirty = true;
    },
    addEdge: (state, action: PayloadAction<Edge>) => {
      state.edges.push(action.payload);
      state.isDirty = true;
    },
    removeEdge: (state, action: PayloadAction<string>) => {
      state.edges = state.edges.filter((e) => e.id !== action.payload);
      state.selectedEdges = state.selectedEdges.filter((id) => id !== action.payload);
      state.isDirty = true;
    },
    setSelectedEdges: (state, action: PayloadAction<string[]>) => {
      state.selectedEdges = action.payload;
    },
    addEdgeToSelection: (state, action: PayloadAction<string>) => {
      if (!state.selectedEdges.includes(action.payload)) {
        state.selectedEdges.push(action.payload);
      }
    },
    clearEdgeSelection: (state) => {
      state.selectedEdges = [];
    },
    clearAllEdges: (state) => {
      state.edges = [];
      state.selectedEdges = [];
      state.isDirty = true;
    },
    removeSelectedEdges: (state) => {
      state.edges = state.edges.filter((e) => !state.selectedEdges.includes(e.id));
      state.selectedEdges = [];
      state.isDirty = true;
    },
    setSelectedNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNode = action.payload;
      // Keep selectedNodes in sync (single selection mode)
      state.selectedNodes = action.payload ? [action.payload] : [];
    },
    /** Set multiple selected nodes (for multi-select) */
    setSelectedNodes: (state, action: PayloadAction<string[]>) => {
      state.selectedNodes = action.payload;
      // Keep selectedNode in sync (first selected node or null)
      state.selectedNode = action.payload.length > 0 ? action.payload[0] : null;
    },
    /** Add a node to selection (Ctrl+click) */
    addNodeToSelection: (state, action: PayloadAction<string>) => {
      if (!state.selectedNodes.includes(action.payload)) {
        state.selectedNodes.push(action.payload);
      }
      // Update selectedNode to the newly added node
      state.selectedNode = action.payload;
    },
    /** Remove a node from selection (Ctrl+click on selected node) */
    removeNodeFromSelection: (state, action: PayloadAction<string>) => {
      state.selectedNodes = state.selectedNodes.filter((id) => id !== action.payload);
      // Update selectedNode
      if (state.selectedNode === action.payload) {
        state.selectedNode = state.selectedNodes.length > 0 ? state.selectedNodes[0] : null;
      }
    },
    /** Toggle node selection (Ctrl+click) */
    toggleNodeSelection: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      if (state.selectedNodes.includes(nodeId)) {
        // Remove from selection
        state.selectedNodes = state.selectedNodes.filter((id) => id !== nodeId);
        if (state.selectedNode === nodeId) {
          state.selectedNode = state.selectedNodes.length > 0 ? state.selectedNodes[0] : null;
        }
      } else {
        // Add to selection
        state.selectedNodes.push(nodeId);
        state.selectedNode = nodeId;
      }
    },
    /** Clear all node selections */
    clearNodeSelection: (state) => {
      state.selectedNode = null;
      state.selectedNodes = [];
    },
    setExpandedNode: (state, action: PayloadAction<string | null>) => {
      state.expandedNodeId = action.payload;
    },
    setViewport: (state, action: PayloadAction<{ x: number; y: number; zoom: number }>) => {
      state.viewport = action.payload;
    },
    loadDefinition: (state, action: PayloadAction<PipeDefinition>) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      state.viewport = action.payload.viewport || { x: 0, y: 0, zoom: 1 };
      state.isDirty = false;
      state.selectedNode = null;
      state.selectedNodes = [];
      state.expandedNodeId = null;
      state.pipeLoadedAt = Date.now(); // Trigger fitView in EditorCanvas
    },
    markClean: (state) => {
      state.isDirty = false;
    },
    saveToHistory: (state) => {
      const current: PipeDefinition = {
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
      };
      state.history.past.push(current);
      state.history.future = [];
      // Keep only last 20 states
      if (state.history.past.length > 20) {
        state.history.past.shift();
      }
    },
    undo: (state) => {
      if (state.history.past.length > 0) {
        const current: PipeDefinition = {
          nodes: state.nodes,
          edges: state.edges,
          viewport: state.viewport,
        };
        state.history.future.unshift(current);
        const previous = state.history.past.pop()!;
        state.nodes = previous.nodes;
        state.edges = previous.edges;
        state.viewport = previous.viewport || { x: 0, y: 0, zoom: 1 };
        state.isDirty = true;
      }
    },
    redo: (state) => {
      if (state.history.future.length > 0) {
        const current: PipeDefinition = {
          nodes: state.nodes,
          edges: state.edges,
          viewport: state.viewport,
        };
        state.history.past.push(current);
        const next = state.history.future.shift()!;
        state.nodes = next.nodes;
        state.edges = next.edges;
        state.viewport = next.viewport || { x: 0, y: 0, zoom: 1 };
        state.isDirty = true;
      }
    },
    clearCanvas: (state) => {
      state.nodes = DEFAULT_NODES;
      state.edges = DEFAULT_EDGES;
      state.selectedNode = null;
      state.selectedNodes = [];
      state.expandedNodeId = null;
      state.isDirty = false;
      state.history = { past: [], future: [] };
      state.executionResult = null;
      state.isExecuting = false;
      state.pipeLoadedAt = Date.now(); // Trigger fitView in EditorCanvas
    },
    setExecutionResult: (state, action: PayloadAction<ExecutionResult | null>) => {
      state.executionResult = action.payload;
    },
    setIsExecuting: (state, action: PayloadAction<boolean>) => {
      state.isExecuting = action.payload;
    },
    clearExecutionResult: (state) => {
      state.executionResult = null;
    },
    /** Trigger run-selected execution from a specific node (Requirement 8.1) */
    triggerRunSelected: (state, action: PayloadAction<string>) => {
      state.runSelectedNodeId = action.payload;
    },
    /** Clear run-selected trigger after execution */
    clearRunSelectedTrigger: (state) => {
      state.runSelectedNodeId = null;
    },
    /** Set canvas interaction mode (pan or select) */
    setInteractionMode: (state, action: PayloadAction<'pan' | 'select'>) => {
      state.interactionMode = action.payload;
    },
  },
});

export const {
  setNodes,
  addNode,
  updateNode,
  removeNode,
  removeNodes,
  setEdges,
  addEdge,
  removeEdge,
  setSelectedNode,
  setSelectedNodes,
  addNodeToSelection,
  removeNodeFromSelection,
  toggleNodeSelection,
  clearNodeSelection,
  setExpandedNode,
  setSelectedEdges,
  addEdgeToSelection,
  clearEdgeSelection,
  clearAllEdges,
  removeSelectedEdges,
  setViewport,
  loadDefinition,
  markClean,
  saveToHistory,
  undo,
  redo,
  clearCanvas,
  setExecutionResult,
  setIsExecuting,
  clearExecutionResult,
  triggerRunSelected,
  clearRunSelectedTrigger,
  setInteractionMode,
} = canvasSlice.actions;

export default canvasSlice.reducer;
