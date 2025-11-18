import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { SecretMetadata, CreateSecretInput, UpdateSecretInput } from '../../types/secrets.types.js';
import * as secretsService from '../../services/secrets-service.js';

interface SecretsState {
  secrets: SecretMetadata[];
  isLoading: boolean;
  error: string | null;
  selectedSecret: SecretMetadata | null;
}

const initialState: SecretsState = {
  secrets: [],
  isLoading: false,
  error: null,
  selectedSecret: null,
};

// Async thunks
export const fetchSecrets = createAsyncThunk(
  'secrets/fetchSecrets',
  async (_, { rejectWithValue }) => {
    try {
      const secrets = await secretsService.listSecrets();
      return secrets;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch secrets');
    }
  }
);

export const createSecret = createAsyncThunk(
  'secrets/createSecret',
  async (input: CreateSecretInput, { rejectWithValue }) => {
    try {
      const secret = await secretsService.createSecret(input);
      return secret;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create secret');
    }
  }
);

export const fetchSecret = createAsyncThunk(
  'secrets/fetchSecret',
  async (secretId: string, { rejectWithValue }) => {
    try {
      const secret = await secretsService.getSecret(secretId);
      return secret;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch secret');
    }
  }
);

export const updateSecret = createAsyncThunk(
  'secrets/updateSecret',
  async ({ secretId, input }: { secretId: string; input: UpdateSecretInput }, { rejectWithValue }) => {
    try {
      const secret = await secretsService.updateSecret(secretId, input);
      return secret;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update secret');
    }
  }
);

export const deleteSecret = createAsyncThunk(
  'secrets/deleteSecret',
  async (secretId: string, { rejectWithValue }) => {
    try {
      await secretsService.deleteSecret(secretId);
      return secretId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete secret');
    }
  }
);

const secretsSlice = createSlice({
  name: 'secrets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedSecret: (state) => {
      state.selectedSecret = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch secrets
    builder
      .addCase(fetchSecrets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSecrets.fulfilled, (state, action) => {
        state.secrets = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchSecrets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create secret
    builder
      .addCase(createSecret.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSecret.fulfilled, (state, action) => {
        state.secrets.push(action.payload);
        state.isLoading = false;
      })
      .addCase(createSecret.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch secret
    builder
      .addCase(fetchSecret.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSecret.fulfilled, (state, action) => {
        state.selectedSecret = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchSecret.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update secret
    builder
      .addCase(updateSecret.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSecret.fulfilled, (state, action) => {
        const index = state.secrets.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.secrets[index] = action.payload;
        }
        if (state.selectedSecret?.id === action.payload.id) {
          state.selectedSecret = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateSecret.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete secret
    builder
      .addCase(deleteSecret.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSecret.fulfilled, (state, action) => {
        state.secrets = state.secrets.filter(s => s.id !== action.payload);
        if (state.selectedSecret?.id === action.payload) {
          state.selectedSecret = null;
        }
        state.isLoading = false;
      })
      .addCase(deleteSecret.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedSecret } = secretsSlice.actions;
export default secretsSlice.reducer;
