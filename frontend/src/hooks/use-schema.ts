import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { store } from '../store/store';
import type { RootState, AppDispatch } from '../store/store';
import {
  setNodeSchema,
  setPreviewLoading,
  setPreviewError,
  updateNodeSchemaAndPropagate,
} from '../store/slices/schema-slice';
import {
  previewService,
  isPreviewableOperator,
  type PreviewResponse,
} from '../services/preview-service';
import type { OperatorType, OperatorConfig } from '../types/operator.types';
import type { SchemaField } from '../types/schema.types';

/**
 * Recursively flatten schema fields to dot-notation paths.
 */
function flattenSchemaFields(fields: SchemaField[], prefix: string = ''): string[] {
  const paths: string[] = [];
  
  for (const field of fields) {
    const currentPath = prefix ? `${prefix}.${field.name}` : field.name;
    paths.push(currentPath);
    
    if (field.children && field.children.length > 0) {
      paths.push(...flattenSchemaFields(field.children, currentPath));
    }
  }
  
  return paths;
}

/**
 * Combined hook for all schema-related functionality.
 * 
 * Use this hook when you need:
 * - Preview functionality for source operators
 * - Upstream schema for field dropdowns
 * - Node output schema
 * - Loading/error states
 * 
 * @param nodeId - The ID of the node
 * @returns Object with schema state and preview function
 */
export const useSchema = (nodeId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Schema state
  const upstreamSchema = useSelector(
    (state: RootState) => state.schema.upstreamSchemas[nodeId]
  );
  const nodeSchema = useSelector(
    (state: RootState) => state.schema.nodeSchemas[nodeId]
  );
  const isLoading = useSelector(
    (state: RootState) => state.schema.previewLoading[nodeId] ?? false
  );
  const error = useSelector(
    (state: RootState) => state.schema.previewErrors[nodeId]
  );
  
  // Get fresh edges directly from store to avoid stale closure issues
  // This ensures we always have the current edges when preview callback executes
  const getFreshEdges = useCallback(() => {
    return store.getState().canvas.edges;
  }, []);
  
  // Compute field paths from upstream schema
  const fieldPaths = upstreamSchema 
    ? flattenSchemaFields(upstreamSchema.fields) 
    : [];

  /**
   * Execute preview for a source operator.
   * Fetches sample data, extracts schema, and updates Redux state.
   */
  const preview = useCallback(
    async (
      operatorType: OperatorType,
      config: OperatorConfig
    ): Promise<PreviewResponse | undefined> => {
      if (!isPreviewableOperator(operatorType)) {
        dispatch(
          setPreviewError({
            nodeId,
            error: `Operator type '${operatorType}' is not previewable. Only source operators can be previewed.`,
          })
        );
        return undefined;
      }

      dispatch(setPreviewLoading({ nodeId, loading: true }));

      try {
        const response = await previewService.preview(operatorType, config);

        // Get fresh edges at execution time to avoid stale closure
        const currentEdges = getFreshEdges();
        
        dispatch(
          updateNodeSchemaAndPropagate({
            nodeId,
            schema: response.schema,
            edges: currentEdges,
          })
        );

        dispatch(setPreviewLoading({ nodeId, loading: false }));

        return response;
      } catch (err: unknown) {
        let errorMessage = 'Preview failed';
        
        // Extract user-friendly error messages from API responses (Requirement 10.1, 10.2, 10.3)
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const axiosError = err as { 
            response?: { 
              data?: { error?: string; details?: string }; 
              status?: number;
            };
            code?: string;
            message?: string;
          };
          
          const status = axiosError.response?.status;
          const apiError = axiosError.response?.data?.error;
          const details = axiosError.response?.data?.details;
          
          // Network errors
          if (axiosError.code === 'ECONNABORTED') {
            errorMessage = 'Request timeout: The request took longer than 30 seconds';
          } else if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
            errorMessage = 'Network error: Unable to connect to server';
          } else if (status === 408) {
            errorMessage = apiError || 'Request timeout';
          } else if (status === 502) {
            errorMessage = apiError || 'Network error: Unable to reach the target URL';
          } else if (status === 422) {
            errorMessage = apiError || 'Invalid response format from URL';
          } else if (status === 403) {
            errorMessage = apiError || 'Access denied to target URL';
          } else if (apiError) {
            errorMessage = details ? `${apiError}: ${details}` : apiError;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        dispatch(setPreviewError({ nodeId, error: errorMessage }));

        return undefined;
      }
    },
    [dispatch, nodeId, getFreshEdges]
  );

  /**
   * Clear the preview error for this node
   */
  const clearError = useCallback(() => {
    dispatch(setPreviewError({ nodeId, error: '' }));
  }, [dispatch, nodeId]);

  /**
   * Manually set the schema for this node
   */
  const setSchema = useCallback(
    (schema: PreviewResponse['schema']) => {
      dispatch(setNodeSchema({ nodeId, schema }));
    },
    [dispatch, nodeId]
  );

  return {
    // Schema state
    upstreamSchema,
    nodeSchema,
    fieldPaths,
    hasUpstreamSchema: !!upstreamSchema,
    hasSchema: !!nodeSchema,
    
    // Preview state
    isLoading,
    error,
    
    // Actions
    preview,
    clearError,
    setSchema,
    isPreviewable: isPreviewableOperator,
  };
};

/**
 * Lightweight hook to just get upstream field paths for dropdowns.
 * Use this when you only need field paths, not full preview functionality.
 * 
 * @param nodeId - The ID of the node
 * @returns Array of dot-notation field paths
 */
export const useUpstreamFieldPaths = (nodeId: string): string[] => {
  const upstreamSchema = useSelector(
    (state: RootState) => state.schema.upstreamSchemas[nodeId]
  );
  
  if (!upstreamSchema) {
    return [];
  }
  
  return flattenSchemaFields(upstreamSchema.fields);
};

/**
 * Check if an operator type can be previewed.
 */
export const useIsPreviewable = (operatorType: string): boolean => {
  return isPreviewableOperator(operatorType);
};
