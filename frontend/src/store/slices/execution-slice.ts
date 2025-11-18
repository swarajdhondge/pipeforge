import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface Execution {
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

interface ExecutionState {
  current: Execution | null;
  history: Execution[];
  isExecuting: boolean;
  error: string | null;
}

const initialState: ExecutionState = {
  current: null,
  history: [],
  isExecuting: false,
  error: null,
};

const executionSlice = createSlice({
  name: 'execution',
  initialState,
  reducers: {
    startExecution: (state) => {
      state.isExecuting = true;
      state.error = null;
    },
    setCurrentExecution: (state, action: PayloadAction<Execution>) => {
      state.current = action.payload;
      state.isExecuting = action.payload.status === 'running' || action.payload.status === 'pending';
      state.error = action.payload.error;
    },
    completeExecution: (state, action: PayloadAction<Execution>) => {
      state.current = action.payload;
      state.isExecuting = false;
      state.error = action.payload.error;
      // Add to history
      state.history.unshift(action.payload);
      // Keep only last 10 executions
      if (state.history.length > 10) {
        state.history = state.history.slice(0, 10);
      }
    },
    failExecution: (state, action: PayloadAction<string>) => {
      state.isExecuting = false;
      state.error = action.payload;
    },
    clearExecution: (state) => {
      state.current = null;
      state.isExecuting = false;
      state.error = null;
    },
    setExecutionHistory: (state, action: PayloadAction<Execution[]>) => {
      state.history = action.payload;
    },
  },
});

export const {
  startExecution,
  setCurrentExecution,
  completeExecution,
  failExecution,
  clearExecution,
  setExecutionHistory,
} = executionSlice.actions;

export default executionSlice.reducer;
