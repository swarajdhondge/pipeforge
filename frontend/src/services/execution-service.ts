import api from './api';

export interface Execution {
  id: string;
  pipe_id: string;
  user_id: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: any;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ExecuteInput {
  pipe_id: string;
  mode?: 'sync' | 'async';
}

export interface IntermediateResult {
  nodeId: string;
  type: string;
  label: string;
  result: any;
  executionTime: number;
  status: 'success' | 'error';
  error?: string;
}

export interface ExecuteDefinitionResult {
  status: 'completed' | 'failed';
  finalResult?: any;
  intermediateResults?: Record<string, IntermediateResult>;
  executionOrder?: string[];
  totalExecutionTime?: number;
  executionTime?: number;
  error?: string;
  nodeId?: string;
  operatorType?: string;
}

export interface PipeDefinition {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      config: any;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

export const executionService = {
  /**
   * Execute a pipe definition directly (canvas state)
   * This executes the current canvas state without requiring a saved pipe
   * @param definition - The pipe definition to execute
   * @param mode - Execution mode (sync or async)
   * @param userInputs - Optional user input values (keyed by input label)
   */
  executeDefinition: async (
    definition: PipeDefinition,
    mode: 'sync' | 'async' = 'sync',
    userInputs?: Record<string, string | number | undefined>
  ): Promise<ExecuteDefinitionResult> => {
    const response = await api.post('/executions/run', { definition, mode, userInputs });
    return response.data;
  },

  /**
   * Execute from a specific node (Run Selected)
   * Traces upstream and executes only the subgraph leading to the target node
   * @param definition - The pipe definition
   * @param targetNodeId - The node to execute up to
   * @param userInputs - Optional user input values
   */
  executeSelected: async (
    definition: PipeDefinition,
    targetNodeId: string,
    userInputs?: Record<string, string | number | undefined>
  ): Promise<ExecuteDefinitionResult> => {
    const response = await api.post('/executions/run-selected', { definition, targetNodeId, userInputs });
    return response.data;
  },

  /**
   * Execute a saved pipe by ID
   */
  execute: async (input: ExecuteInput): Promise<Execution | { execution_id: string; status: 'pending'; job_id: string }> => {
    const response = await api.post('/executions', input);
    return response.data;
  },

  /**
   * Get execution status/result
   */
  get: async (id: string): Promise<Execution> => {
    const response = await api.get(`/executions/${id}`);
    return response.data;
  },

  /**
   * List user's executions
   */
  list: async (params?: {
    pipe_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Execution[]; total: number; page: number; limit: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.pipe_id) queryParams.append('pipe_id', params.pipe_id);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const response = await api.get(`/executions?${queryParams.toString()}`);
    return response.data;
  },
};
