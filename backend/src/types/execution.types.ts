export interface Execution {
  id: string;
  pipe_id: string;
  user_id: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: any;
  error: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
}

export interface CreateExecutionInput {
  pipe_id: string;
  user_id: string | null;
  mode?: 'sync' | 'async';
}
