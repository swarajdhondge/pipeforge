import { type FC } from 'react';
import type { Node, Edge } from 'reactflow';

interface PipeOutputWarningBannerProps {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Helper function to check if there's a path from any source node to the target node
 * using BFS (Breadth-First Search)
 */
const hasPathToNode = (targetNodeId: string, edges: Edge[]): boolean => {
  // Build adjacency list
  const adjacencyList = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push(edge.target);
  }
  
  // Find all nodes that have no incoming edges (source nodes)
  const allNodeIds = new Set<string>();
  for (const edge of edges) {
    allNodeIds.add(edge.source);
    allNodeIds.add(edge.target);
  }
  
  const nodesWithIncoming = new Set(edges.map(e => e.target));
  const sourceNodes = Array.from(allNodeIds).filter(id => !nodesWithIncoming.has(id));
  
  // BFS from each source node to see if we can reach the target
  for (const sourceId of sourceNodes) {
    const queue = [sourceId];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === targetNodeId) {
        return true; // Found a path
      }
      
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      
      const neighbors = adjacencyList.get(current) || [];
      queue.push(...neighbors);
    }
  }
  
  return false; // No path found from any source
};

/**
 * Warning banner component that shows when there's no path to the Pipe Output node.
 * Requirement 7.5: Show persistent banner when no path to output
 * Requirement 13.4: Warn if no connection to Pipe Output
 */
export const PipeOutputWarningBanner: FC<PipeOutputWarningBannerProps> = ({ nodes, edges }) => {
  // Find the Pipe Output node
  const pipeOutputNode = nodes.find(node => node.type === 'pipe-output');
  
  // If there's no Pipe Output node, don't show warning (handled by empty state)
  if (!pipeOutputNode) {
    return null;
  }
  
  // Only show warning if there are other nodes besides Pipe Output
  // (i.e., user has added operators but hasn't connected them)
  const hasOtherNodes = nodes.length > 1;
  
  if (!hasOtherNodes) {
    return null;
  }
  
  // Check if there's any path from source nodes to Pipe Output
  const hasPath = hasPathToNode(pipeOutputNode.id, edges);
  
  // If there's a path to Pipe Output, don't show warning
  if (hasPath) {
    return null;
  }

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto">
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg shadow-md">
        {/* Warning icon */}
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        {/* Warning message */}
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">
            No connection to Pipe Output
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Connect your operators to the Pipe Output node to complete your pipe
          </p>
        </div>
        
        {/* Visual hint */}
        <div className="flex-shrink-0 text-lg">
          📤
        </div>
      </div>
    </div>
  );
};
