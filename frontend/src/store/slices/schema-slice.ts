import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ExtractedSchema } from '../../types/schema.types';
import type { Edge } from 'reactflow';

/**
 * Schema state for managing dynamic schema propagation.
 * Stores output schemas for each node and computed upstream schemas.
 */
interface SchemaState {
  /** Map of nodeId -> output schema (from preview or execution) */
  nodeSchemas: Record<string, ExtractedSchema>;
  /** Map of nodeId -> upstream schema (computed from connections) */
  upstreamSchemas: Record<string, ExtractedSchema>;
  /** Map of nodeId -> preview loading state */
  previewLoading: Record<string, boolean>;
  /** Map of nodeId -> preview error message */
  previewErrors: Record<string, string>;
}

const initialState: SchemaState = {
  nodeSchemas: {},
  upstreamSchemas: {},
  previewLoading: {},
  previewErrors: {},
};

const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
    /**
     * Set the output schema for a specific node (from preview or execution)
     */
    setNodeSchema: (
      state,
      action: PayloadAction<{ nodeId: string; schema: ExtractedSchema }>
    ) => {
      state.nodeSchemas[action.payload.nodeId] = action.payload.schema;
      // Clear any preview error when schema is successfully set
      delete state.previewErrors[action.payload.nodeId];
    },

    /**
     * Clear the output schema for a specific node
     */
    clearNodeSchema: (state, action: PayloadAction<string>) => {
      delete state.nodeSchemas[action.payload];
      delete state.upstreamSchemas[action.payload];
    },


    /**
     * Set the upstream schema for a specific node (computed from connections)
     */
    setUpstreamSchema: (
      state,
      action: PayloadAction<{ nodeId: string; schema: ExtractedSchema }>
    ) => {
      state.upstreamSchemas[action.payload.nodeId] = action.payload.schema;
    },

    /**
     * Clear the upstream schema for a specific node
     */
    clearUpstreamSchema: (state, action: PayloadAction<string>) => {
      delete state.upstreamSchemas[action.payload];
    },

    /**
     * Set preview loading state for a node
     */
    setPreviewLoading: (
      state,
      action: PayloadAction<{ nodeId: string; loading: boolean }>
    ) => {
      if (action.payload.loading) {
        state.previewLoading[action.payload.nodeId] = true;
        // Clear previous error when starting new preview
        delete state.previewErrors[action.payload.nodeId];
      } else {
        delete state.previewLoading[action.payload.nodeId];
      }
    },

    /**
     * Set preview error for a node
     */
    setPreviewError: (
      state,
      action: PayloadAction<{ nodeId: string; error: string }>
    ) => {
      state.previewErrors[action.payload.nodeId] = action.payload.error;
      // Clear loading state when error occurs
      delete state.previewLoading[action.payload.nodeId];
    },

    /**
     * Clear preview error for a node
     */
    clearPreviewError: (state, action: PayloadAction<string>) => {
      delete state.previewErrors[action.payload];
    },

    /**
     * Propagate schemas through the graph based on connections.
     * For each node, computes its upstream schema from its source node's output schema.
     * This should be called whenever connections change.
     * 
     * The propagation follows the graph structure:
     * - Each node's upstream schema is the output schema of its direct source node
     * - If a node has no incoming connection, it has no upstream schema
     * - If the source node has no output schema yet, the downstream node has no upstream schema
     * 
     * Requirements: 1.3, 1.6
     */
    propagateSchemas: (
      state,
      action: PayloadAction<{ edges: Edge[] }>
    ) => {
      const { edges } = action.payload;
      
      // Build a map of target -> source for quick lookup
      // Since we enforce single input per operator, each target has at most one source
      const targetToSource: Record<string, string> = {};
      for (const edge of edges) {
        targetToSource[edge.target] = edge.source;
      }

      // For each node that has an incoming connection,
      // set its upstream schema to the source node's output schema
      const newUpstreamSchemas: Record<string, ExtractedSchema> = {};
      
      for (const [targetId, sourceId] of Object.entries(targetToSource)) {
        const sourceSchema = state.nodeSchemas[sourceId];
        if (sourceSchema) {
          newUpstreamSchemas[targetId] = sourceSchema;
        }
        // If source has no schema yet, we don't set upstream schema for target
        // This allows the UI to show "no schema available" state
      }

      state.upstreamSchemas = newUpstreamSchemas;
    },

    /**
     * Update schemas when a node's output schema changes.
     * This propagates the change to all downstream nodes.
     * 
     * Requirements: 1.6 - When upstream operator's schema changes, 
     * downstream operators' field dropdowns update automatically
     */
    updateNodeSchemaAndPropagate: (
      state,
      action: PayloadAction<{ nodeId: string; schema: ExtractedSchema; edges: Edge[] }>
    ) => {
      const { nodeId, schema, edges } = action.payload;
      
      // Update the node's output schema
      state.nodeSchemas[nodeId] = schema;
      delete state.previewErrors[nodeId];
      
      // Find all downstream nodes and update their upstream schemas
      // Build adjacency list: source -> targets
      const sourceToTargets: Record<string, string[]> = {};
      for (const edge of edges) {
        if (!sourceToTargets[edge.source]) {
          sourceToTargets[edge.source] = [];
        }
        sourceToTargets[edge.source].push(edge.target);
      }
      
      // BFS to propagate schema changes downstream
      const queue = [nodeId];
      const visited = new Set<string>();
      
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        
        const currentSchema = state.nodeSchemas[currentId];
        const targets = sourceToTargets[currentId] || [];
        
        for (const targetId of targets) {
          if (currentSchema) {
            state.upstreamSchemas[targetId] = currentSchema;
          } else {
            delete state.upstreamSchemas[targetId];
          }
          queue.push(targetId);
        }
      }
    },

    /**
     * Clear all schemas (used when clearing canvas or loading new pipe)
     */
    clearAllSchemas: (state) => {
      state.nodeSchemas = {};
      state.upstreamSchemas = {};
      state.previewLoading = {};
      state.previewErrors = {};
    },

    /**
     * Remove schemas for a deleted node
     */
    removeNodeSchemas: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      delete state.nodeSchemas[nodeId];
      delete state.upstreamSchemas[nodeId];
      delete state.previewLoading[nodeId];
      delete state.previewErrors[nodeId];
    },
  },
});

export const {
  setNodeSchema,
  clearNodeSchema,
  setUpstreamSchema,
  clearUpstreamSchema,
  setPreviewLoading,
  setPreviewError,
  clearPreviewError,
  propagateSchemas,
  updateNodeSchemaAndPropagate,
  clearAllSchemas,
  removeNodeSchemas,
} = schemaSlice.actions;

export default schemaSlice.reducer;
