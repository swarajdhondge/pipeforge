import api from './api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  UpdateProfileRequest,
  ExecutionLimitResponse,
} from '../types/auth.types';

// Helper function to make error messages user-friendly
const getUserFriendlyError = (error: any): string => {
  // Network errors
  if (!error.response) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  // Get error message from response
  const message = error.response?.data?.error || error.message;

  // Map technical errors to user-friendly messages
  if (message.includes('already exists') || message.includes('already registered')) {
    return 'This email is already registered. Please sign in or use a different email.';
  }

  if (message.includes('Invalid credentials') || message.includes('Invalid email or password')) {
    return 'Invalid email or password. Please try again.';
  }

  if (message.includes('Token expired')) {
    return 'Your session has expired. Please sign in again.';
  }

  if (message.includes('Invalid token')) {
    return 'Your session is invalid. Please sign in again.';
  }

  // Return the original message if it's already user-friendly
  return message;
};

export const authService = {
  login: async (credentials: LoginRequest) => {
    try {
      // Get local pipes from localStorage
      const localPipes = JSON.parse(localStorage.getItem('localPipes') || '[]');
      
      return await api.post<AuthResponse>('/auth/login', {
        ...credentials,
        localPipes: localPipes.length > 0 ? localPipes : undefined,
      });
    } catch (error: any) {
      // Transform error message to be user-friendly
      const friendlyMessage = getUserFriendlyError(error);
      throw { ...error, response: { ...error.response, data: { error: friendlyMessage } } };
    }
  },

  register: async (data: RegisterRequest) => {
    try {
      // Get local pipes from localStorage
      const localPipes = JSON.parse(localStorage.getItem('localPipes') || '[]');
      
      return await api.post<AuthResponse>('/auth/register', {
        ...data,
        localPipes: localPipes.length > 0 ? localPipes : undefined,
      });
    } catch (error: any) {
      // Transform error message to be user-friendly
      const friendlyMessage = getUserFriendlyError(error);
      throw { ...error, response: { ...error.response, data: { error: friendlyMessage } } };
    }
  },

  loginWithGoogle: async (accessToken: string, refreshToken: string) => {
    // This is called after OAuth redirect
    return { data: { accessToken, refreshToken } };
  },

  refreshToken: async (refreshToken: string) => {
    try {
      return await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        refreshToken,
      });
    } catch (error: any) {
      const friendlyMessage = getUserFriendlyError(error);
      throw { ...error, response: { ...error.response, data: { error: friendlyMessage } } };
    }
  },

  logout: async (refreshToken: string) => {
    try {
      return await api.post('/auth/logout', { refreshToken });
    } catch (error: any) {
      const friendlyMessage = getUserFriendlyError(error);
      throw { ...error, response: { ...error.response, data: { error: friendlyMessage } } };
    }
  },

  getProfile: async () => {
    try {
      return await api.get<User>('/auth/me');
    } catch (error: any) {
      const friendlyMessage = getUserFriendlyError(error);
      throw { ...error, response: { ...error.response, data: { error: friendlyMessage } } };
    }
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    try {
      return await api.put<User>('/auth/me', data);
    } catch (error: any) {
      const friendlyMessage = getUserFriendlyError(error);
      throw { ...error, response: { ...error.response, data: { error: friendlyMessage } } };
    }
  },

  checkExecutionLimit: async (sessionId: string) => {
    return api.post<ExecutionLimitResponse>('/auth/check-execution-limit', {
      sessionId,
    });
  },

  migrateDrafts: async (drafts: any[]) => {
    try {
      return await api.post<{ migratedCount: number; totalDrafts: number; errors?: string[] }>(
        '/pipes/migrate-drafts',
        { drafts }
      );
    } catch (error: any) {
      const friendlyMessage = getUserFriendlyError(error);
      throw { ...error, response: { ...error.response, data: { error: friendlyMessage } } };
    }
  },

  deleteAccount: async (password: string, confirmation: string) => {
    try {
      const response = await api.delete('/auth/account', {
        data: { password, confirmation },
      });
      // Clear local storage on successful deletion
      localStorage.removeItem('pipe_forge_access_token');
      localStorage.removeItem('pipe_forge_refresh_token');
      localStorage.removeItem('pipe_forge_drafts');
      return response;
    } catch (error: any) {
      const friendlyMessage = getUserFriendlyError(error);
      throw { ...error, response: { ...error.response, data: { error: friendlyMessage } } };
    }
  },
};
