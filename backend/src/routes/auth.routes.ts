import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { IUserService } from '../services/user.service';
import { IOAuthService } from '../services/oauth.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import {
  validateRegisterInput,
  validateLoginInput,
  validateUpdateProfileInput,
  generateRandomString,
} from '../utils/validators';
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  ValidationError,
  NotFoundError,
  InvalidTokenError,
} from '../errors/auth.errors';
import logger from '../utils/logger';
import pool from '../config/database';
import { config } from '../config/env';

export function createAuthRoutes(
  userService: IUserService,
  oauthService: IOAuthService
): Router {
  const router = Router();

  // POST /auth/register
  router.post('/register', async (req, res: Response) => {
    try {
      // 1. Validate input
      const { email, password, localPipes } = validateRegisterInput(req.body);

      // 2. Register user and migrate pipes
      const authResponse = await userService.register(email, password, localPipes);

      // 3. Return user + tokens
      return res.status(201).json(authResponse);
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        return res.status(409).json({ error: error.message });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      logger.error('Registration error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /auth/login
  router.post('/login', async (req, res: Response) => {
    try {
      // 1. Validate input
      const { email, password, localPipes } = validateLoginInput(req.body);

      // 2. Login user and migrate pipes
      const authResponse = await userService.login(email, password, localPipes);

      // 3. Return user + tokens
      return res.status(200).json(authResponse);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return res.status(401).json({ 
          error: error.message,
          code: error.code // 'USER_NOT_FOUND' or 'INVALID_PASSWORD'
        });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      logger.error('Login error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /auth/google
  router.get('/google', (_req, res: Response) => {
    // 1. Generate state for CSRF protection
    const state = generateRandomString();

    // 2. Store state in session or temporary storage
    // For now, we'll pass it through and verify on callback
    // In production, store in Redis with expiry

    // 3. Redirect to Google OAuth
    const authUrl = oauthService.getGoogleAuthUrl(state);
    res.redirect(authUrl);
  });

  // GET /auth/google/callback
  router.get('/google/callback', async (req, res: Response) => {
    try {
      const { code, state } = req.query;

      if (!code || typeof code !== 'string') {
        return res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
      }

      // 1. Verify state (CSRF protection)
      // TODO: In production, verify state from Redis

      // 2. Exchange code for profile
      const googleProfile = await oauthService.handleGoogleCallback(
        code,
        state as string
      );

      // 3. Login or create user
      const authResponse = await userService.loginWithGoogle(googleProfile);

      // 4. Redirect to frontend with tokens
      const redirectUrl = `${config.frontendUrl}/auth/callback?accessToken=${authResponse.accessToken}&refreshToken=${authResponse.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google OAuth callback error', { error });
      res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
    }
  });

  // POST /auth/refresh
  router.post('/refresh', async (req, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      const tokens = await userService.refreshAccessToken(refreshToken);
      return res.status(200).json(tokens);
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        return res.status(401).json({ error: error.message });
      }
      logger.error('Token refresh error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /auth/logout
  router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await userService.revokeRefreshToken(refreshToken);
      }

      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /auth/me
  router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const user = await userService.getById(userId);
      return res.status(200).json(user);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      logger.error('Get profile error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /auth/me
  router.put('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const data = validateUpdateProfileInput(req.body);
      const user = await userService.updateProfile(userId, data);
      return res.status(200).json(user);
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      logger.error('Update profile error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /auth/check-execution-limit
  router.post('/check-execution-limit', async (req, res: Response) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }

      const result = await pool.query(
        'SELECT execution_count FROM anonymous_executions WHERE session_id = $1',
        [sessionId]
      );

      const executionCount = result.rows[0]?.execution_count || 0;
      const limit = 5;

      if (executionCount >= limit) {
        return res.status(429).json({
          executionCount,
          limit,
          remaining: 0,
          canExecute: false,
        });
      }

      return res.status(200).json({
        executionCount,
        limit,
        remaining: limit - executionCount,
        canExecute: true,
      });
    } catch (error) {
      logger.error('Check execution limit error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /auth/verify-email - Verify email with token
  router.post('/verify-email', async (req, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Verification token required' });
      }

      const user = await userService.verifyEmail(token);
      return res.status(200).json({ message: 'Email verified successfully', user });
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        return res.status(400).json({ error: 'Invalid or expired verification link' });
      }
      logger.error('Verify email error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /auth/resend-verification - Resend verification email
  router.post('/resend-verification', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      
      // Check if already verified
      const isVerified = await userService.isEmailVerified(userId);
      if (isVerified) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      await userService.sendVerificationEmail(userId);
      return res.status(200).json({ message: 'Verification email sent' });
    } catch (error) {
      logger.error('Resend verification error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /auth/forgot-password - Request password reset
  router.post('/forgot-password', async (req, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      await userService.requestPasswordReset(email);
      // Always return success to prevent email enumeration
      return res.status(200).json({ message: 'If an account exists, a reset link has been sent' });
    } catch (error) {
      logger.error('Forgot password error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /auth/reset-password - Reset password with token
  router.post('/reset-password', async (req, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password required' });
      }

      await userService.resetPassword(token, password);
      return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        return res.status(400).json({ error: 'Invalid or expired reset link' });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      logger.error('Reset password error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /auth/profile - Get own profile (includes email)
  router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const result = await pool.query(
        `SELECT id, email, username, display_name, bio, avatar_url, email_verified, created_at 
         FROM users WHERE id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({ user: result.rows[0] });
    } catch (error) {
      logger.error('Get profile error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PATCH /auth/profile - Update own profile
  router.patch('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { display_name, bio, avatar_url } = req.body;
      
      const user = await userService.updateProfile(userId, { display_name, bio, avatar_url });
      return res.json({ user });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      logger.error('Update profile error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /auth/account - Delete own account
  router.delete('/account', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { password, confirmation } = req.body;
      
      // Require confirmation text
      if (confirmation !== 'DELETE') {
        return res.status(400).json({ error: 'Please type DELETE to confirm account deletion' });
      }
      
      // Verify password
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userRow = userResult.rows[0];
      if (userRow.password_hash) {
        if (!password) {
          return res.status(400).json({ error: 'Password required to delete account' });
        }
        const isValid = await bcrypt.compare(password, userRow.password_hash);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid password' });
        }
      }
      
      await userService.deleteAccount(userId);
      return res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      logger.error('Delete account error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
