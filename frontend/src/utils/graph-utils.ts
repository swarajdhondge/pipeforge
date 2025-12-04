/**
 * Graph utilities for pipe canvas operations
 * 
 * Provides functions for:
 * - Finding connected subgraphs (disconnected operator groups)
 * - Getting the subgraph containing a specific node
 * - Finding start/end nodes in the graph
 * - Filtering definitions to specific subgraphs
 */

export interface GraphNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface PipeDefinition {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Subgraph {
  nodeIds: Set<string>;
  nodes: GraphNode[];
  edges: GraphEdge[];
  startNodes: string[];
  endNodes: string[];
}

/**
 * Find all connected subgraphs (components) in the graph
 * Uses Union-Find algorithm for efficient component detection
 * 
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @returns Array of subgraphs, each containing its nodes and edges
 */
export function findConnectedSubgraphs(nodes: GraphNode[], edges: GraphEdge[]): Subgraph[] {
  if (nodes.length === 0) {
    return [];
  }

  // Union-Find data structure
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  // Initialize each node as its own parent
  nodes.forEach(node => {
    parent.set(node.id, node.id);
    rank.set(node.id, 0);
  });

  // Find with path compression
  function find(x: string): string {
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)!));
    }
    return parent.get(x)!;
  }

  // Union by rank
  function union(x: string, y: string): void {
    const rootX = find(x);
    const rootY = find(y);

    if (rootX !== rootY) {
      const rankX = rank.get(rootX)!;
      const rankY = rank.get(rootY)!;

      if (rankX < rankY) {
        parent.set(rootX, rootY);
      } else if (rankX > rankY) {
        parent.set(rootY, rootX);
      } else {
        parent.set(rootY, rootX);
        rank.set(rootX, rankX + 1);
      }
    }
  }

  // Union all connected nodes via edges
  edges.forEach(edge => {
    if (parent.has(edge.source) && parent.has(edge.target)) {
      union(edge.source, edge.target);
    }
  });

  // Group nodes by their root
  const components = new Map<string, string[]>();
  nodes.forEach(node => {
    const root = find(node.id);
    if (!components.has(root)) {
      components.set(root, []);
    }
    components.get(root)!.push(node.id);
  });

  // Build subgraphs
  const subgraphs: Subgraph[] = [];
  components.forEach(nodeIds => {
    const nodeIdSet = new Set(nodeIds);
    const subgraphNodes = nodes.filter(n => nodeIdSet.has(n.id));
    const subgraphEdges = edges.filter(e => nodeIdSet.has(e.source) && nodeIdSet.has(e.target));

    // Find start nodes (no incoming edges)
    const hasIncoming = new Set(subgraphEdges.map(e => e.target));
    const startNodes = nodeIds.filter(id => !hasIncoming.has(id));

    // Find end nodes (no outgoing edges)
    const hasOutgoing = new Set(subgraphEdges.map(e => e.source));
    const endNodes = nodeIds.filter(id => !hasOutgoing.has(id));

    subgraphs.push({
      nodeIds: nodeIdSet,
      nodes: subgraphNodes,
      edges: subgraphEdges,
      startNodes,
      endNodes,
    });
  });

  return subgraphs;
}


/**
 * Get the subgraph containing a specific node
 * 
 * @param nodeId - The node ID to find the subgraph for
 * @param nodes - Array of all graph nodes
 * @param edges - Array of all graph edges
 * @returns The subgraph containing the node, or null if node not found
 */
export function getSubgraphForNode(
  nodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[]
): Subgraph | null {
  const subgraphs = findConnectedSubgraphs(nodes, edges);
  return subgraphs.find(sg => sg.nodeIds.has(nodeId)) || null;
}

/**
 * Get all start nodes (nodes with no incoming edges)
 * 
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @returns Array of node IDs that have no incoming edges
 */
export function getStartNodes(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const hasIncoming = new Set(edges.map(e => e.target));
  return nodes.filter(n => !hasIncoming.has(n.id)).map(n => n.id);
}

/**
 * Get all end nodes (nodes with no outgoing edges)
 * 
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @returns Array of node IDs that have no outgoing edges
 */
export function getEndNodes(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const hasOutgoing = new Set(edges.map(e => e.source));
  return nodes.filter(n => !hasOutgoing.has(n.id)).map(n => n.id);
}

/**
 * Filter a pipe definition to only include nodes in a specific subgraph
 * 
 * @param definition - The full pipe definition
 * @param nodeIds - Set of node IDs to include
 * @returns A new definition containing only the specified nodes and their edges
 */
export function filterDefinitionToSubgraph(
  definition: PipeDefinition,
  nodeIds: Set<string>
): PipeDefinition {
  return {
    nodes: definition.nodes.filter(n => nodeIds.has(n.id)),
    edges: definition.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target)),
  };
}

/**
 * Check if the graph has multiple disconnected subgraphs
 * 
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @returns True if there are multiple disconnected components
 */
export function hasMultipleSubgraphs(nodes: GraphNode[], edges: GraphEdge[]): boolean {
  const subgraphs = findConnectedSubgraphs(nodes, edges);
  return subgraphs.length > 1;
}

/**
 * Get execution order for a subgraph using topological sort
 * 
 * @param subgraph - The subgraph to sort
 * @returns Array of node IDs in execution order, or null if cycle detected
 */
export function getExecutionOrder(subgraph: Subgraph): string[] | null {
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  // Initialize
  subgraph.nodeIds.forEach(nodeId => {
    inDegree.set(nodeId, 0);
    adjacencyList.set(nodeId, []);
  });

  // Build adjacency list and calculate in-degrees
  subgraph.edges.forEach(edge => {
    adjacencyList.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // Kahn's algorithm
  const queue: string[] = [];
  const result: string[] = [];

  // Start with nodes that have no incoming edges
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    adjacencyList.get(node)!.forEach(neighbor => {
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  // Check for cycles
  if (result.length !== subgraph.nodeIds.size) {
    return null; // Cycle detected
  }

  return result;
}
