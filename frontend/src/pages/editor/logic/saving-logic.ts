/**
 * Saving Logic
 * Requirements: 5.3
 * 
 * Handles save/load pipe functions and draft management
 */

import type { Node, Edge } from 'reactflow';
import { pipeService, type Pipe } from '../../../services/pipe-service';

/**
 * Save pipe to backend
 */
export const savePipe = async (
  pipeId: string | null,
  name: string,
  description: string,
  nodes: Node[],
  edges: Edge[],
  isPublic: boolean,
  isDraft: boolean,
  tags: string[] = []
): Promise<Pipe> => {
  // Convert ReactFlow nodes/edges to pipe definition format
  const definition = {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type || 'unknown',
      position: node.position,
      data: {
        label: node.data?.label || '',
        config: node.data?.config || {},
      },
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };

  // Create or update pipe
  if (pipeId) {
    const response = await pipeService.update(pipeId, {
      name,
      description,
      definition,
      is_public: isPublic,
      is_draft: isDraft,
      tags,
    });
    return response.data;
  } else {
    const response = await pipeService.create({
      name,
      description,
      definition,
      is_public: isPublic,
      is_draft: isDraft,
      tags,
    });
    return response.data;
  }
};

/**
 * Load pipe from backend
 */
export const loadPipe = async (pipeId: string): Promise<{
  pipe: Pipe;
  nodes: Node[];
  edges: Edge[];
}> => {
  const response = await pipeService.get(pipeId);
  const pipe = response.data;

  // Convert pipe definition to ReactFlow format
  const nodes: Node[] = pipe.definition.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      label: node.data?.label || '',
      config: node.data?.config || {},
    },
  }));

  const edges: Edge[] = pipe.definition.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'selectable',
  }));

  return { pipe, nodes, edges };
};

/**
 * Save pipe as draft
 */
export const saveDraft = async (
  pipeId: string | null,
  name: string,
  nodes: Node[],
  edges: Edge[]
): Promise<Pipe> => {
  return savePipe(pipeId, name, '', nodes, edges, false, true, []);
};

/**
 * Publish draft
 */
export const publishDraft = async (
  pipeId: string,
  name: string,
  description: string,
  nodes: Node[],
  edges: Edge[],
  isPublic: boolean,
  tags: string[] = []
): Promise<Pipe> => {
  return savePipe(pipeId, name, description, nodes, edges, isPublic, false, tags);
};

/**
 * Delete pipe
 */
export const deletePipe = async (pipeId: string): Promise<void> => {
  await pipeService.delete(pipeId);
};

/**
 * Fork pipe
 */
export const forkPipe = async (pipeId: string): Promise<Pipe> => {
  const response = await pipeService.fork(pipeId);
  return response.data;
};

/**
 * Validate pipe name
 */
export const validatePipeName = (name: string): {
  valid: boolean;
  error?: string;
} => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Pipe name is required' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Pipe name must be less than 100 characters' };
  }

  return { valid: true };
};

/**
 * Check if pipe has unsaved changes
 */
export const hasUnsavedChanges = (
  currentNodes: Node[],
  currentEdges: Edge[],
  savedNodes: Node[],
  savedEdges: Edge[]
): boolean => {
  // Simple comparison - could be more sophisticated
  if (currentNodes.length !== savedNodes.length) return true;
  if (currentEdges.length !== savedEdges.length) return true;

  // Compare node positions and configs
  for (let i = 0; i < currentNodes.length; i++) {
    const current = currentNodes[i];
    const saved = savedNodes.find(n => n.id === current.id);
    
    if (!saved) return true;
    
    if (
      current.position.x !== saved.position.x ||
      current.position.y !== saved.position.y ||
      JSON.stringify(current.data) !== JSON.stringify(saved.data)
    ) {
      return true;
    }
  }

  return false;
};
