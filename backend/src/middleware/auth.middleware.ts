import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JWTPayload } from '../types/user.types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // 2. Verify token with JWT_SECRET
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;

    // 3. Check token type (must be 'access')
    if (payload.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    // 4. Attach user payload to req.user
    req.user = payload;

    // 5. Call next()
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export function optionalAuthenticateToken(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // 2. If no token, continue without user (anonymous)
    if (!token) {
      req.user = undefined;
      next();
      return;
    }

    // 3. Try to verify token
    try {
      const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;

      // 4. Check token type (must be 'access')
      if (payload.type === 'access') {
        req.user = payload;
      } else {
        // Invalid token type, treat as anonymous
        console.log('Invalid token type, treating as anonymous');
        req.user = undefined;
      }
    } catch (error) {
      // Token verification failed, treat as anonymous
      if (error instanceof jwt.TokenExpiredError) {
        console.log('Token expired, treating as anonymous');
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.log('Invalid token, treating as anonymous');
      }
      req.user = undefined;
    }

    // 5. Always continue (never return 401)
    next();
  } catch (error) {
    // Unexpected error, log and continue as anonymous
    console.error('Unexpected error in optionalAuthenticateToken:', error);
    req.user = undefined;
    next();
  }
}
