import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface DraftPipe {
  id: string;
  name: string;
  definition: {
    nodes: any[];
    edges: any[];
  };
  timestamp: number;
  operatorCount: number;
}

interface AnonymousState {
  sessionId: string;
  executionCount: number;
  executionLimit: number;
  drafts: DraftPipe[];
  showSignupModal: boolean;
}

const MAX_DRAFTS = 5;
const DRAFTS_KEY = 'pipe_forge_drafts';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('pipe_forge_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('pipe_forge_session_id', sessionId);
  }
  return sessionId;
};

// Load execution count from localStorage
const getExecutionCount = (): number => {
  const count = localStorage.getItem('pipe_forge_execution_count');
  return count ? parseInt(count, 10) : 0;
};

// Load drafts from localStorage
const getDrafts = (): DraftPipe[] => {
  try {
    const drafts = localStorage.getItem(DRAFTS_KEY);
    if (!drafts) return [];
    const parsed = JSON.parse(drafts);
    // Sort by timestamp descending (newest first)
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.timestamp - a.timestamp) : [];
  } catch (error) {
    console.error('Error loading drafts from localStorage:', error);
    return [];
  }
};

// Save drafts to localStorage
const saveDrafts = (drafts: DraftPipe[]): void => {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Error saving drafts to localStorage:', error);
  }
};

const initialState: AnonymousState = {
  sessionId: getSessionId(),
  executionCount: getExecutionCount(),
  executionLimit: 5,
  drafts: getDrafts(),
  showSignupModal: false,
};

const anonymousSlice = createSlice({
  name: 'anonymous',
  initialState,
  reducers: {
    incrementExecutionCount: (state) => {
      state.executionCount += 1;
      localStorage.setItem('pipe_forge_execution_count', state.executionCount.toString());
      
      // Show signup modal if limit reached
      if (state.executionCount >= state.executionLimit) {
        state.showSignupModal = true;
      }
    },
    setShowSignupModal: (state, action: PayloadAction<boolean>) => {
      state.showSignupModal = action.payload;
    },
    addDraft: (state, action: PayloadAction<DraftPipe>) => {
      // Add new draft at the beginning
      state.drafts.unshift(action.payload);
      
      // Keep only the most recent MAX_DRAFTS
      if (state.drafts.length > MAX_DRAFTS) {
        state.drafts = state.drafts.slice(0, MAX_DRAFTS);
      }
      
      saveDrafts(state.drafts);
    },
    updateDraft: (state, action: PayloadAction<DraftPipe>) => {
      const index = state.drafts.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        // Update existing draft
        state.drafts[index] = action.payload;
        // Move to front (most recent)
        const [updated] = state.drafts.splice(index, 1);
        state.drafts.unshift(updated);
      } else {
        // Add as new draft
        state.drafts.unshift(action.payload);
        if (state.drafts.length > MAX_DRAFTS) {
          state.drafts = state.drafts.slice(0, MAX_DRAFTS);
        }
      }
      
      saveDrafts(state.drafts);
    },
    removeDraft: (state, action: PayloadAction<string>) => {
      state.drafts = state.drafts.filter(d => d.id !== action.payload);
      saveDrafts(state.drafts);
    },
    clearDrafts: (state) => {
      state.drafts = [];
      localStorage.removeItem(DRAFTS_KEY);
    },
    clearLocalData: (state) => {
      state.drafts = [];
      state.executionCount = 0;
      localStorage.removeItem(DRAFTS_KEY);
      localStorage.removeItem('pipe_forge_execution_count');
    },
  },
});

export const {
  incrementExecutionCount,
  setShowSignupModal,
  addDraft,
  updateDraft,
  removeDraft,
  clearDrafts,
  clearLocalData,
} = anonymousSlice.actions;

export default anonymousSlice.reducer;
