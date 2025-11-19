export interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  auth_provider: 'email' | 'google';
  email_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  localPipes?: any[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  localPipes?: any[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  migratedPipes?: number;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  avatar_url?: string | null;
}

export interface ExecutionLimitResponse {
  executionCount: number;
  limit: number;
  remaining: number;
  canExecute: boolean;
}
