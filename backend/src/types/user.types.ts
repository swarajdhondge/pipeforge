export interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  auth_provider: 'email' | 'google';
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserRow extends User {
  password_hash?: string; // nullable for OAuth users
  google_id?: string;
  verification_token?: string;
  verification_token_expires?: Date;
  reset_token?: string;
  reset_token_expires?: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  localPipes?: any[]; // Pipes from localStorage to migrate
}

export interface LoginRequest {
  email: string;
  password: string;
  localPipes?: any[]; // Pipes from localStorage to migrate
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  avatar_url?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  migratedPipes?: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}
