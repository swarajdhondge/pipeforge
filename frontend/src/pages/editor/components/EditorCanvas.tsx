import { type FC, useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  useOnViewportChange,
  useReactFlow,
  SelectionMode,
  type Node,
  type Edge,
  type Connection,
  type Viewport,
  type OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { RootState } from '../../../store/store';
import { setNodes, setEdges, setSelectedNode, setSelectedNodes, setSelectedEdges, saveToHistory, removeEdge, removeNodes, removeSelectedEdges, clearEdgeSelection, clearNodeSelection, toggleNodeSelection, addEdgeToSelection, clearExecutionResult } from '../../../store/slices/canvas-slice';
import { propagateSchemas, clearUpstreamSchema } from '../../../store/slices/schema-slice';
import { useKeyboardShortcuts } from '../../../hooks/use-keyboard-shortcuts';
import { useBreakpoint } from '../../../hooks/use-media-query';
import { OperatorNode } from '../../../components/editor/OperatorNode';
import { UnknownOperatorNode } from '../../../components/editor/UnknownOperatorNode';
import { SelectableEdge } from '../../../components/editor/SelectableEdge';
import { EdgeContextMenu } from '../../../components/editor/EdgeContextMenu';
import { EditorResultsPanel } from './EditorResultsPanel';
import { validateConnection } from '../../../utils/connection-validator';
import { useToast } from '../../../components/common/Toast';

// Define node types
const nodeTypes = {
  fetch: OperatorNode,
  filter: OperatorNode,
  sort: OperatorNode,
  transform: OperatorNode,
  'fetch-json': OperatorNode,
  'fetch-csv': OperatorNode,
  'fetch-rss': OperatorNode,
  'fetch-page': OperatorNode,
  'text-input': OperatorNode,
  'number-input': OperatorNode,
  'url-input': OperatorNode,
  'date-input': OperatorNode,
  unique: OperatorNode,
  truncate: OperatorNode,
  tail: OperatorNode,
  rename: OperatorNode,
  'string-replace': OperatorNode,
  regex: OperatorNode,
  substring: OperatorNode,
  'url-builder': OperatorNode,
  'pipe-output': OperatorNode,
  'unknown-operator': UnknownOperatorNode,
};

// Define edge types
const edgeTypes = {
  selectable: SelectableEdge,
};

/**
 * EditorCanvas - Main canvas area with ReactFlow
 * 
 * Includes:
 * - ReactFlow canvas (full width)
 * - Canvas tracker (zoom/pan info)
 * - Results panel (execution output)
 * 
 * Note: Toolbar controls (undo/redo, save, run) are now in EditorToolbar
 */
export const EditorCanvas: FC = () => {
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const { fitView } = useReactFlow();
  const { isMobile } = useBreakpoint();
  const { nodes: storeNodes, edges: storeEdges, selectedNodes, selectedEdges, executionResult, isExecuting, interactionMode, pipeLoadedAt } = useSelector(
    (state: RootState) => state.canvas
  );
  
  // Use ReactFlow's state management for local updates
  const [nodes, setNodesLocal, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdgesLocal, onEdgesChange] = useEdgesState(storeEdges);
  
  // Fit view when a new pipe is loaded (pipeLoadedAt timestamp changes)
  useEffect(() => {
    if (storeNodes.length > 0) {
      // Small delay to ensure nodes are rendered
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 150);
    }
  }, [pipeLoadedAt, fitView]);
  
  // State for edge context menu position
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    edgeId: string;
  } | null>(null);
  
  // Track viewport for zoom/pan display
  const [viewport, setViewportState] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  useOnViewportChange({
    onChange: (vp) => setViewportState(vp),
  });
  
  // Helper to handle edge deletion with schema cleanup
  const handleDeleteSelectedEdges = useCallback(() => {
    if (selectedEdges.length === 0) return;
    
    // Get target nodes of selected edges before deletion (Requirement 1.2)
    const targetNodeIds = edges
      .filter(e => selectedEdges.includes(e.id))
      .map(e => e.target);
    
    dispatch(saveToHistory());
    dispatch(removeSelectedEdges());
    
    // Clear upstream schemas for all target nodes and re-propagate
    targetNodeIds.forEach(nodeId => {
      dispatch(clearUpstreamSchema(nodeId));
    });
    const remainingEdges = edges.filter(e => !selectedEdges.includes(e.id));
    dispatch(propagateSchemas({ edges: remainingEdges }));
  }, [selectedEdges, edges, dispatch]);

  // Handler to delete all selected items (nodes and edges)
  const handleDeleteAllSelected = useCallback(() => {
    const hasNodes = selectedNodes.length > 0;
    const hasEdges = selectedEdges.length > 0;
    
    if (!hasNodes && !hasEdges) return;
    
    dispatch(saveToHistory());
    
    // Delete all selected nodes
    if (hasNodes) {
      dispatch(removeNodes(selectedNodes));
    }
    
    // Delete all selected edges
    if (hasEdges) {
      handleDeleteSelectedEdges();
    }
  }, [selectedNodes, selectedEdges, dispatch, handleDeleteSelectedEdges]);

  // Register keyboard shortcuts for deletion
  useKeyboardShortcuts([
    {
      key: 'Delete',
      handler: handleDeleteAllSelected,
      description: 'Delete selected nodes and edges',
    },
    {
      key: 'Backspace',
      handler: handleDeleteAllSelected,
      description: 'Delete selected nodes and edges',
    },
    {
      key: 'Escape',
      handler: () => {
        dispatch(clearNodeSelection());
        dispatch(clearEdgeSelection());
        setContextMenu(null);
      },
      description: 'Deselect all',
    },
  ]);
  
  // Sync Redux state to local state when it changes (e.g., when pipe is loaded)
  useEffect(() => {
    setNodesLocal(storeNodes);
  }, [storeNodes, setNodesLocal]);
  
  useEffect(() => {
    setEdgesLocal(storeEdges);
  }, [storeEdges, setEdgesLocal]);
  
  // Handle node selection (supports Ctrl+click for multi-select)
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+click: toggle node in selection
        dispatch(toggleNodeSelection(node.id));
      } else {
        // Regular click: select only this node, clear edges
        dispatch(setSelectedNode(node.id));
        dispatch(clearEdgeSelection());
      }
    },
    [dispatch]
  );
  
  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    dispatch(clearNodeSelection());
    dispatch(clearEdgeSelection());
    setContextMenu(null);
  }, [dispatch]);
  
  // Handle edge click for selection (supports Ctrl+click for multi-select)
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+click: toggle edge in selection
        if (selectedEdges.includes(edge.id)) {
          dispatch(setSelectedEdges(selectedEdges.filter(id => id !== edge.id)));
        } else {
          dispatch(addEdgeToSelection(edge.id));
        }
      } else {
        // Regular click: select only this edge, clear nodes
        dispatch(setSelectedEdges([edge.id]));
        dispatch(clearNodeSelection());
      }
    },
    [dispatch, selectedEdges]
  );
  
  // Handle selection change from box selection (Task 8)
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodesList, edges: selectedEdgesList }: OnSelectionChangeParams) => {
      // Update Redux with the box-selected items
      if (selectedNodesList.length > 0 || selectedEdgesList.length > 0) {
        dispatch(setSelectedNodes(selectedNodesList.map(n => n.id)));
        dispatch(setSelectedEdges(selectedEdgesList.map(e => e.id)));
      }
    },
    [dispatch]
  );
  
  // Handle edge context menu (right-click)
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
  
  // Handle edge deletion from context menu
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      // Find the edge to get target node ID before deletion (Requirement 1.2)
      const edge = edges.find(e => e.id === edgeId);
      
      dispatch(saveToHistory());
      dispatch(removeEdge(edgeId));
      setContextMenu(null);
      
      // Clear upstream schema for the target node and re-propagate (Requirement 1.2)
      if (edge) {
        dispatch(clearUpstreamSchema(edge.target));
        const remainingEdges = edges.filter(e => e.id !== edgeId);
        dispatch(propagateSchemas({ edges: remainingEdges }));
      }
    },
    [dispatch, edges]
  );
  
  // Handle new connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Find source and target nodes for validation
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);

      if (!sourceNode || !targetNode) return;

      // Validate the connection
      const validation = validateConnection(
        { id: sourceNode.id, type: sourceNode.type },
        { id: targetNode.id, type: targetNode.type },
        edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
      );

      if (!validation.valid) {
        addToast({
          type: 'error',
          title: 'Cannot connect',
          description: validation.error || 'Invalid connection',
        });
        return;
      }

      dispatch(saveToHistory());
      const newEdge = {
        ...connection,
        id: `e${connection.source}-${connection.target}`,
        type: 'selectable',
      };
      setEdgesLocal((eds) => addEdge(newEdge, eds));
      const updatedEdges = [...edges, newEdge as Edge];
      dispatch(setEdges(updatedEdges));
      
      // Propagate schemas after connection is made (Requirement 1.1)
      dispatch(propagateSchemas({ edges: updatedEdges }));
    },
    [nodes, edges, dispatch, setEdgesLocal, addToast]
  );
  
  // Sync local state changes to Redux
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      setTimeout(() => {
        dispatch(setNodes(nodes));
      }, 0);
    },
    [onNodesChange, nodes, dispatch]
  );
  
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      setTimeout(() => {
        dispatch(setEdges(edges));
      }, 0);
    },
    [onEdgesChange, edges, dispatch]
  );
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Canvas with ReactFlow */}
      <div className="flex-1 relative bg-bg-canvas">
        {/* Zoom percentage - styled like controls, positioned adjacent */}
        <div className="absolute bottom-4 right-[70px] bg-bg-surface border border-border-default rounded text-xs text-text-secondary z-10 px-2 py-1.5">
          Zoom: {Math.round(viewport.zoom * 100)}%
        </div>
        
        {/* Empty state when no nodes */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center bg-bg-surface/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg border border-border-default mx-4">
              <div className="text-5xl sm:text-6xl mb-4">🔧</div>
              <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-2">
                Start Building Your Pipe
              </h3>
              <p className="text-sm text-text-secondary max-w-xs">
                {isMobile 
                  ? 'Tap the + button in the bottom left to add operators'
                  : 'Add operators from the sidebar to create your data pipeline'
                }
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-tertiary">
                <span className="px-2 py-1 bg-bg-surface-hover rounded">Fetch</span>
                <span>→</span>
                <span className="px-2 py-1 bg-bg-surface-hover rounded">Transform</span>
                <span>→</span>
                <span className="px-2 py-1 bg-bg-surface-hover rounded">Output</span>
              </div>
            </div>
          </div>
        )}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'selectable' }}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onEdgeClick={onEdgeClick}
          onEdgeContextMenu={onEdgeContextMenu}
          fitView
          className="w-full h-full"
          minZoom={0.1}
          maxZoom={2}
          selectionOnDrag={interactionMode === 'select'}
          panOnDrag={interactionMode === 'pan'}
          selectionMode={SelectionMode.Partial}
          onSelectionChange={onSelectionChange}
        >
          {/* Global SVG defs for edge markers - ensures arrows render correctly */}
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <marker id="arrow-default" viewBox="0 0 12 12" refX="10" refY="6" markerUnits="strokeWidth" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill="#4A90D9" />
              </marker>
              <marker id="arrow-selected" viewBox="0 0 12 12" refX="10" refY="6" markerUnits="strokeWidth" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill="#FF6B35" />
              </marker>
              <marker id="arrow-hover" viewBox="0 0 12 12" refX="10" refY="6" markerUnits="strokeWidth" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill="#8B5CF6" />
              </marker>
            </defs>
          </svg>
          
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1.5}
            className="!bg-bg-canvas"
          />
          
          {/* Zoom controls - bottom-right corner, styled via CSS in index.css */}
          <Controls 
            position="bottom-right"
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          
          {/* Mini-map navigator - top right, click to navigate, hidden on mobile */}
          {!isMobile && (
            <MiniMap
              position="top-right"
              nodeStrokeWidth={1}
              nodeColor="#7C3AED"
              nodeBorderRadius={2}
              zoomable={false}
              pannable
              className="!bg-bg-surface/95 !border !border-border-default !rounded !shadow-sm hidden md:block"
              style={{ width: 120, height: 75 }}
              maskColor="rgba(124, 58, 237, 0.1)"
            />
          )}
        </ReactFlow>
        
        {/* Edge Context Menu */}
        {contextMenu && (
          <EdgeContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            edgeId={contextMenu.edgeId}
            onDelete={handleDeleteEdge}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
      
      {/* Results Panel - execution state from Redux */}
      <EditorResultsPanel
        result={executionResult}
        isExecuting={isExecuting}
        onClearResults={() => dispatch(clearExecutionResult())}
      />
    </div>
  );
};
