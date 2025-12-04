import { store } from '../store/store';
import { previewService, isPreviewableOperator } from '../services/preview-service';
import { updateNodeSchemaAndPropagate } from '../store/slices/schema-slice';
import type { Node } from 'reactflow';
import type { OperatorType, OperatorConfig } from '../types/operator.types';

interface NodeData {
  label: string;
  config: OperatorConfig;
}

/**
 * Auto-preview all source operators in the canvas to populate schemas.
 * This should be called after loading a pipe to ensure field dropdowns
 * are populated for downstream operators.
 * 
 * @param nodes - Array of nodes from the canvas
 * @returns Promise that resolves when all previews are complete
 */
export const autoPreviewSourceOperators = async (
  nodes: Node<NodeData>[]
): Promise<{ success: number; failed: number }> => {
  const sourceNodes = nodes.filter(node => 
    node.type && isPreviewableOperator(node.type)
  );

  let success = 0;
  let failed = 0;

  // Preview all source operators in parallel
  const previewPromises = sourceNodes.map(async (node) => {
    const operatorType = node.type as OperatorType;
    const config = node.data?.config as Record<string, unknown>;

    // Skip if no URL configured (nothing to preview)
    if (!config?.url || typeof config.url !== 'string') {
      return;
    }

    try {
      const response = await previewService.preview(operatorType, config);
      
      // Get current edges from store
      const edges = store.getState().canvas.edges;
      
      // Update schema and propagate to downstream nodes
      store.dispatch(
        updateNodeSchemaAndPropagate({
          nodeId: node.id,
          schema: response.schema,
          edges,
        })
      );
      
      success++;
    } catch (error) {
      // Silently fail - user can manually preview if needed
      console.warn(`Auto-preview failed for node ${node.id}:`, error);
      failed++;
    }
  });

  await Promise.all(previewPromises);

  return { success, failed };
};
