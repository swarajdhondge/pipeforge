/**
 * Canvas Interactions Logic
 * Requirements: 5.3
 * 
 * Handles node click, drag, connect, and edge interactions
 */

import type { Node, Edge, Connection } from 'reactflow';
import type { AppDispatch } from '../../../store/store';
import { setNodes, setEdges, setSelectedNode, saveToHistory } from '../../../store/slices/canvas-slice';

/**
 * Handle node click - selects the node
 */
export const handleNodeClick = (
  dispatch: AppDispatch,
  node: Node
) => {
  dispatch(setSelectedNode(node.id));
};

/**
 * Handle pane click - deselects any selected node
 */
export const handlePaneClick = (dispatch: AppDispatch) => {
  dispatch(setSelectedNode(null));
};

/**
 * Handle new connection between nodes
 */
export const handleConnect = (
  dispatch: AppDispatch,
  connection: Connection,
  currentEdges: Edge[]
) => {
  const newEdge: Edge = {
    ...connection,
    id: `e${connection.source}-${connection.target}`,
    type: 'smoothstep',
  } as Edge;
  
  const updatedEdges = [...currentEdges, newEdge];
  dispatch(saveToHistory());
  dispatch(setEdges(updatedEdges));
  
  return updatedEdges;
};

/**
 * Handle node position changes
 */
export const handleNodesChange = (
  dispatch: AppDispatch,
  _changes: any,
  currentNodes: Node[]
) => {
  // Apply changes to nodes
  // This is handled by ReactFlow's onNodesChange
  // We just need to sync to Redux after changes
  dispatch(setNodes(currentNodes));
};

/**
 * Handle edge changes (deletion, etc.)
 */
export const handleEdgesChange = (
  dispatch: AppDispatch,
  _changes: any,
  currentEdges: Edge[]
) => {
  // Apply changes to edges
  // This is handled by ReactFlow's onEdgesChange
  // We just need to sync to Redux after changes
  dispatch(setEdges(currentEdges));
};

/**
 * Handle node deletion
 */
export const handleNodeDelete = (
  dispatch: AppDispatch,
  nodeId: string,
  currentNodes: Node[],
  currentEdges: Edge[]
) => {
  dispatch(saveToHistory());
  
  // Remove node
  const updatedNodes = currentNodes.filter(n => n.id !== nodeId);
  dispatch(setNodes(updatedNodes));
  
  // Remove connected edges
  const updatedEdges = currentEdges.filter(
    e => e.source !== nodeId && e.target !== nodeId
  );
  dispatch(setEdges(updatedEdges));
  
  // Deselect if this node was selected
  dispatch(setSelectedNode(null));
};

/**
 * Handle edge deletion
 */
export const handleEdgeDelete = (
  dispatch: AppDispatch,
  edgeId: string,
  currentEdges: Edge[]
) => {
  dispatch(saveToHistory());
  
  const updatedEdges = currentEdges.filter(e => e.id !== edgeId);
  dispatch(setEdges(updatedEdges));
};
