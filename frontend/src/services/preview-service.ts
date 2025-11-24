import api from './api';
import type { ExtractedSchema } from '../types/schema.types';
import type { OperatorType, OperatorConfig } from '../types/operator.types';

/**
 * Request payload for preview endpoint
 */
export interface PreviewRequest {
  operatorType: OperatorType;
  config: OperatorConfig;
}

/**
 * Response from preview endpoint
 */
export interface PreviewResponse {
  schema: ExtractedSchema;
  sampleData: unknown;
  itemCount?: number;
}

/**
 * Error response from preview endpoint
 */
export interface PreviewError {
  error: string;
  details?: string;
}

/**
 * Source operator types that can be previewed
 */
export const PREVIEWABLE_OPERATOR_TYPES: OperatorType[] = [
  'fetch',
  'fetch-json',
  'fetch-csv',
  'fetch-rss',
  'fetch-page',
];

/**
 * Check if an operator type is previewable
 */
export const isPreviewableOperator = (operatorType: string): boolean => {
  return PREVIEWABLE_OPERATOR_TYPES.includes(operatorType as OperatorType);
};

/**
 * Preview service for fetching sample data and extracting schemas
 * from source operators.
 * 
 * Requirements: 1.1 - WHEN a Source operator has a valid URL configured
 * THEN the System SHALL provide a "Preview" button that fetches sample
 * data and extracts the schema.
 */
export const previewService = {
  /**
   * Preview a source operator to get sample data and schema.
   * 
   * @param operatorType - The type of operator to preview
   * @param config - The operator configuration
   * @returns Preview response with schema and sample data
   * @throws Error with user-friendly message on failure
   */
  preview: async (
    operatorType: OperatorType,
    config: OperatorConfig
  ): Promise<PreviewResponse> => {
    const response = await api.post<PreviewResponse>('/preview', {
      operatorType,
      config,
    });
    return response.data;
  },
};
