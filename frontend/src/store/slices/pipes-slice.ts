import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface Pipe {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  definition: any;
  is_public: boolean;
  tags: string[];
  like_count: number;
  execution_count: number;
  is_featured: boolean;
  forked_from: string | null;
  created_at: string;
  updated_at: string;
}

interface PipesState {
  items: Pipe[];
  currentPipe: Pipe | null;
  trending: Pipe[];
  featured: Pipe[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PipesState = {
  items: [],
  currentPipe: null,
  trending: [],
  featured: [],
  isLoading: false,
  error: null,
};

const pipesSlice = createSlice({
  name: 'pipes',
  initialState,
  reducers: {
    setPipes: (state, action: PayloadAction<Pipe[]>) => {
      state.items = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setCurrentPipe: (state, action: PayloadAction<Pipe | null>) => {
      state.currentPipe = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setTrending: (state, action: PayloadAction<Pipe[]>) => {
      state.trending = action.payload;
    },
    setFeatured: (state, action: PayloadAction<Pipe[]>) => {
      state.featured = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    updatePipe: (state, action: PayloadAction<Pipe>) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.currentPipe?.id === action.payload.id) {
        state.currentPipe = action.payload;
      }
    },
    removePipe: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
      if (state.currentPipe?.id === action.payload) {
        state.currentPipe = null;
      }
    },
  },
});

export const {
  setPipes,
  setCurrentPipe,
  setTrending,
  setFeatured,
  setLoading,
  setError,
  clearError,
  updatePipe,
  removePipe,
} = pipesSlice.actions;

export default pipesSlice.reducer;
