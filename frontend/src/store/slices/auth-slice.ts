import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, LoginRequest, RegisterRequest } from '../../types/auth.types';
import { authService } from '../../services/auth-service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  migratedPipesCount: number | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('pipe_forge_access_token'),
  refreshToken: localStorage.getItem('pipe_forge_refresh_token'),
  isAuthenticated: !!localStorage.getItem('pipe_forge_access_token'),
  isLoading: false,
  error: null,
  migratedPipesCount: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: { name?: string; bio?: string; avatar_url?: string }, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update profile');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (state.auth.refreshToken) {
        await authService.logout(state.auth.refreshToken);
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Logout failed');
    }
  }
);

export const migrateDrafts = createAsyncThunk(
  'auth/migrateDrafts',
  async (_, { rejectWithValue }) => {
    try {
      // Get drafts from localStorage
      const draftsString = localStorage.getItem('pipe_forge_drafts');
      if (!draftsString) {
        return { migratedCount: 0 };
      }

      const drafts = JSON.parse(draftsString);
      if (!Array.isArray(drafts) || drafts.length === 0) {
        return { migratedCount: 0 };
      }

      // Call backend to migrate drafts
      const response = await authService.migrateDrafts(drafts);
      
      // Clear drafts from localStorage after successful migration
      localStorage.removeItem('pipe_forge_drafts');
      
      return response.data;
    } catch (error: any) {
      console.error('Draft migration error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to migrate drafts');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      
      // Clear localStorage
      localStorage.removeItem('pipe_forge_access_token');
      localStorage.removeItem('pipe_forge_refresh_token');
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      
      localStorage.setItem('pipe_forge_access_token', action.payload.accessToken);
      localStorage.setItem('pipe_forge_refresh_token', action.payload.refreshToken);
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMigrationCount: (state) => {
      state.migratedPipesCount = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        
        localStorage.setItem('pipe_forge_access_token', action.payload.accessToken);
        localStorage.setItem('pipe_forge_refresh_token', action.payload.refreshToken);
        
        // Clear local pipes after successful migration
        if (action.payload.migratedPipes && action.payload.migratedPipes > 0) {
          state.migratedPipesCount = action.payload.migratedPipes;
          localStorage.removeItem('localPipes');
          localStorage.removeItem('anon-execution-count');
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        
        localStorage.setItem('pipe_forge_access_token', action.payload.accessToken);
        localStorage.setItem('pipe_forge_refresh_token', action.payload.refreshToken);
        
        // Clear local pipes after successful migration
        if (action.payload.migratedPipes && action.payload.migratedPipes > 0) {
          state.migratedPipesCount = action.payload.migratedPipes;
          localStorage.removeItem('localPipes');
          localStorage.removeItem('anon-execution-count');
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch profile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.isLoading = false;
      });

    // Update profile
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        localStorage.removeItem('pipe_forge_access_token');
        localStorage.removeItem('pipe_forge_refresh_token');
      });

    // Migrate drafts
    builder
      .addCase(migrateDrafts.fulfilled, (state, action) => {
        if (action.payload.migratedCount > 0) {
          state.migratedPipesCount = action.payload.migratedCount;
        }
      })
      .addCase(migrateDrafts.rejected, (_state, action) => {
        console.error('Draft migration failed:', action.payload);
      });
  },
});

export const { logout, setTokens, clearError, clearMigrationCount } = authSlice.actions;
export default authSlice.reducer;
