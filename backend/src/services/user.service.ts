import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import crypto from 'crypto';
import { config } from '../config/env';
import logger from '../utils/logger';
import {
  User,
  UserRow,
  AuthResponse,
  JWTPayload,
  GoogleProfile,
  UpdateProfileRequest,
} from '../types/user.types';
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  InvalidTokenError,
  ValidationError,
  NotFoundError,
} from '../errors/auth.errors';

export interface IUserService {
  register(email: string, password: string, localPipes?: any[]): Promise<AuthResponse>;
  login(email: string, password: string, localPipes?: any[]): Promise<AuthResponse>;
  sendVerificationEmail(userId: string): Promise<void>;
  verifyEmail(token: string): Promise<User>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  isEmailVerified(userId: string): Promise<boolean>;
  loginWithGoogle(googleProfile: GoogleProfile, localPipes?: any[]): Promise<AuthResponse>;
  getById(userId: string): Promise<User>;
  updateProfile(userId: string, data: UpdateProfileRequest): Promise<User>;
  verifyPassword(user: UserRow, password: string): Promise<boolean>;
  generateTokens(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  revokeRefreshToken(refreshToken: string): Promise<void>;
  deleteAccount(userId: string): Promise<void>;
}

export class UserService implements IUserService {
  constructor(private db: Pool) {}

  async register(email: string, password: string, localPipes?: any[]): Promise<AuthResponse> {
    // 1. Validate email format
    if (!validator.isEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // 2. Check if email exists
    const existingUser = await this.db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new UserAlreadyExistsError(email);
    }

    // 3. Hash password (bcrypt, 10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Generate unique username from email
    const username = await this.generateUniqueUsername(email);
    const displayName = this.extractDisplayName(email);

    // 5. Insert into database (email_verified defaults to false)
    const result = await this.db.query(
      `INSERT INTO users (email, password_hash, auth_provider, email_verified, username, display_name, name)
       VALUES ($1, $2, 'email', false, $3, $4, $4)
       RETURNING id, email, username, display_name, name, bio, avatar_url, auth_provider, email_verified, created_at, updated_at`,
      [email, passwordHash, username, displayName]
    );

    const user = this.mapUserRowToUser(result.rows[0]);

    // 6. Send verification email
    try {
      await this.sendVerificationEmail(user.id);
    } catch (error) {
      logger.error('Failed to send verification email', { userId: user.id, error });
      // Don't fail registration if email fails
    }

    // 7. Generate access + refresh tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // 8. Migrate local pipes if provided
    let migratedPipes = 0;
    if (localPipes && localPipes.length > 0) {
      migratedPipes = await this.migratePipes(user.id, localPipes);
    }

    // 9. Return user + tokens + migrated count
    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      migratedPipes,
    };
  }

  async login(email: string, password: string, localPipes?: any[]): Promise<AuthResponse> {
    // 1. Find user by email
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new InvalidCredentialsError('USER_NOT_FOUND');
    }

    const userRow: UserRow = result.rows[0];

    // 2. Verify password
    if (!userRow.password_hash) {
      // OAuth user trying to login with password - suggest using Google
      throw new InvalidCredentialsError('INVALID_PASSWORD');
    }

    const isValid = await bcrypt.compare(password, userRow.password_hash);
    if (!isValid) {
      throw new InvalidCredentialsError('INVALID_PASSWORD');
    }

    // 3. Generate access + refresh tokens
    const tokens = await this.generateTokens(userRow.id, userRow.email);

    // 4. Migrate local pipes if provided
    let migratedPipes = 0;
    if (localPipes && localPipes.length > 0) {
      migratedPipes = await this.migratePipes(userRow.id, localPipes);
    }

    // 5. Return user + tokens + migrated count (without password_hash)
    const user = this.mapUserRowToUser(userRow);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      migratedPipes,
    };
  }

  async loginWithGoogle(googleProfile: GoogleProfile, localPipes?: any[]): Promise<AuthResponse> {
    // 1. Check if user exists by google_id
    let result = await this.db.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleProfile.id]
    );

    let userRow: UserRow;

    if (result.rows.length > 0) {
      // User exists
      userRow = result.rows[0];
    } else {
      // 2. If not, check by email (account linking)
      result = await this.db.query(
        'SELECT * FROM users WHERE email = $1',
        [googleProfile.email]
      );

      if (result.rows.length > 0) {
        // Link Google account to existing user
        userRow = result.rows[0];
        await this.db.query(
          `UPDATE users 
           SET google_id = $1, avatar_url = $2, auth_provider = 'google', updated_at = NOW()
           WHERE id = $3`,
          [googleProfile.id, googleProfile.picture, userRow.id]
        );
        userRow.google_id = googleProfile.id;
        userRow.avatar_url = googleProfile.picture;
        userRow.auth_provider = 'google';
      } else {
        // 3. Create new user with username and display_name like email signup
        const username = await this.generateUniqueUsername(googleProfile.email);
        const displayName = googleProfile.name || this.extractDisplayName(googleProfile.email);
        
        result = await this.db.query(
          `INSERT INTO users (email, name, username, display_name, avatar_url, google_id, auth_provider, email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, 'google', true)
           RETURNING id, email, name, username, display_name, bio, avatar_url, auth_provider, email_verified, created_at, updated_at`,
          [googleProfile.email, displayName, username, displayName, googleProfile.picture, googleProfile.id]
        );
        userRow = result.rows[0];
      }
    }

    // 4. Generate tokens
    const tokens = await this.generateTokens(userRow.id, userRow.email);

    // 5. Migrate local pipes if provided
    let migratedPipes = 0;
    if (localPipes && localPipes.length > 0) {
      migratedPipes = await this.migratePipes(userRow.id, localPipes);
    }

    // 6. Return user + tokens + migrated count (without password_hash)
    // Google OAuth users are automatically verified
    const user = this.mapUserRowToUser({
      ...userRow,
      email_verified: true, // Google OAuth = verified
    });

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      migratedPipes,
    };
  }

  async generateTokens(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Generate unique token ID to prevent duplicate tokens
    const tokenId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // 1. Generate access token (1 hour expiry)
    const accessToken = jwt.sign(
      { userId, email, type: 'access' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiry } as jwt.SignOptions
    );

    // 2. Generate refresh token (7 days expiry) with unique jti
    const refreshToken = jwt.sign(
      { userId, email, type: 'refresh', jti: tokenId },
      config.jwtSecret,
      { expiresIn: '7d' } as jwt.SignOptions
    );

    // 3. Store refresh token in database
    await this.db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [userId, refreshToken]
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Verify refresh token
    let payload: JWTPayload;
    try {
      payload = jwt.verify(refreshToken, config.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new InvalidTokenError();
    }

    if (payload.type !== 'refresh') {
      throw new InvalidTokenError();
    }

    // 2. Check if token exists in database
    const result = await this.db.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (result.rows.length === 0) {
      throw new InvalidTokenError();
    }

    // 3. Generate new access token
    const newAccessToken = jwt.sign(
      { userId: payload.userId, email: payload.email, type: 'access' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiry } as jwt.SignOptions
    );

    // 4. Rotate refresh token (generate new one)
    const newRefreshToken = jwt.sign(
      { userId: payload.userId, email: payload.email, type: 'refresh' },
      config.jwtSecret,
      { expiresIn: '7d' } as jwt.SignOptions
    );

    // 5. Delete old refresh token
    await this.db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

    // 6. Store new refresh token
    await this.db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [payload.userId, newRefreshToken]
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }

  async getById(userId: string): Promise<User> {
    const result = await this.db.query(
      `SELECT id, email, name, bio, avatar_url, auth_provider, email_verified, created_at, updated_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User', userId);
    }

    return this.mapUserRowToUser(result.rows[0]);
  }

  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(data.name);
      paramCount++;
    }

    if (data.bio !== undefined) {
      updates.push(`bio = $${paramCount}`);
      values.push(data.bio);
      paramCount++;
    }

    if (data.avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount}`);
      // Allow null to clear the avatar
      values.push(data.avatar_url);
      paramCount++;
    }

    if (updates.length === 0) {
      return this.getById(userId);
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await this.db.query(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, name, bio, avatar_url, auth_provider, email_verified, created_at, updated_at`,
      values
    );

    return this.mapUserRowToUser(result.rows[0]);
  }

  async verifyPassword(user: UserRow, password: string): Promise<boolean> {
    if (!user.password_hash) {
      return false;
    }
    return bcrypt.compare(password, user.password_hash);
  }

  // Normalize DB row to API-safe user object with sensible defaults
  private mapUserRowToUser(userRow: UserRow): User {
    const fallbackName = userRow.name || this.extractDisplayName(userRow.email);

    return {
      id: userRow.id,
      email: userRow.email,
      name: fallbackName,
      bio: userRow.bio,
      avatar_url: userRow.avatar_url,
      auth_provider: userRow.auth_provider,
      email_verified: userRow.email_verified ?? false,
      created_at: userRow.created_at,
      updated_at: userRow.updated_at,
    };
  }

  private async migratePipes(userId: string, localPipes: any[]): Promise<number> {
    let migratedCount = 0;
    
    for (const localPipe of localPipes) {
      try {
        if (!localPipe.definition || !localPipe.definition.nodes || !localPipe.definition.edges) {
          logger.warn('Skipping invalid pipe', { userId, pipe: localPipe });
          continue;
        }
        
        await this.db.query(
          `INSERT INTO pipes (user_id, name, description, definition, is_public, tags)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            localPipe.name || 'Untitled Pipe',
            localPipe.description || '',
            JSON.stringify(localPipe.definition),
            false,
            localPipe.tags || []
          ]
        );
        
        migratedCount++;
      } catch (error) {
        logger.error('Failed to migrate pipe', { userId, error, pipe: localPipe });
      }
    }
    
    return migratedCount;
  }

  // Generate verification token and send email
  async sendVerificationEmail(userId: string): Promise<void> {
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await this.db.query(
      `UPDATE users 
       SET verification_token = $1, verification_token_expires = $2
       WHERE id = $3
       RETURNING email`,
      [token, expires, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User', userId);
    }

    const { emailService } = await import('./email.service');
    await emailService.sendVerificationEmail(result.rows[0].email, token);
  }

  // Verify email with token
  async verifyEmail(token: string): Promise<User> {
    const result = await this.db.query(
      `UPDATE users 
       SET email_verified = true, verification_token = NULL, verification_token_expires = NULL
       WHERE verification_token = $1 AND verification_token_expires > NOW()
       RETURNING id, email, name, bio, avatar_url, auth_provider, email_verified, created_at, updated_at`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new InvalidTokenError();
    }

    // Send welcome email
    const user = this.mapUserRowToUser(result.rows[0]);
    const { emailService } = await import('./email.service');
    await emailService.sendWelcomeEmail(user.email, user.name);

    return user;
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const result = await this.db.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expires = $2
       WHERE email = $3
       RETURNING id`,
      [token, expires, email]
    );

    // Don't reveal if email exists - always return success
    if (result.rows.length > 0) {
      const { emailService } = await import('./email.service');
      await emailService.sendPasswordResetEmail(email, token);
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validate password
    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const result = await this.db.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
       WHERE reset_token = $2 AND reset_token_expires > NOW()
       RETURNING id`,
      [passwordHash, token]
    );

    if (result.rows.length === 0) {
      throw new InvalidTokenError();
    }

    // Revoke all refresh tokens for security
    await this.db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [result.rows[0].id]);
  }

  // Check if email is verified
  async isEmailVerified(userId: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT email_verified FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.email_verified || false;
  }

  // Generate unique username from email
  async generateUniqueUsername(email: string): Promise<string> {
    // Extract base username from email prefix
    const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40);
    
    let username = base || 'user';
    let counter = 1;
    
    // Check if username exists and append number if needed
    while (await this.usernameExists(username)) {
      username = `${base}${counter}`;
      counter++;
    }
    
    return username;
  }

  // Check if username exists
  async usernameExists(username: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    return result.rows.length > 0;
  }

  // Extract display name from email (capitalize first letter)
  extractDisplayName(email: string): string {
    const name = email.split('@')[0].replace(/[._-]/g, ' ');
    return name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ').substring(0, 100);
  }

  // Find user by username
  async findByUsername(username: string): Promise<User | null> {
    const result = await this.db.query(
      `SELECT id, email, username, display_name, name, bio, avatar_url, auth_provider, email_verified, created_at, updated_at 
       FROM users WHERE username = $1`,
      [username]
    );
    return result.rows[0] || null;
  }

  // Delete user account and all associated data
  async deleteAccount(userId: string): Promise<void> {
    // Delete in order to respect foreign key constraints
    await this.db.query('DELETE FROM pipe_likes WHERE user_id = $1', [userId]);
    await this.db.query('DELETE FROM executions WHERE pipe_id IN (SELECT id FROM pipes WHERE user_id = $1)', [userId]);
    await this.db.query('DELETE FROM pipe_versions WHERE pipe_id IN (SELECT id FROM pipes WHERE user_id = $1)', [userId]);
    await this.db.query('DELETE FROM pipes WHERE user_id = $1', [userId]);
    await this.db.query('DELETE FROM secrets WHERE user_id = $1', [userId]);
    await this.db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    await this.db.query('DELETE FROM users WHERE id = $1', [userId]);
    
    logger.info('User account deleted', { userId });
  }
}
