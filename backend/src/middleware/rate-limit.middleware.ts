import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis';
import { config } from '../config/env';

// In development mode, use much higher limits for testing
const isDev = config.nodeEnv === 'development';
const devMultiplier = isDev ? 100 : 1; // 100x higher limits in dev

// Login rate limiter (5 attempts per minute per IP, 500 in dev)
export const loginRateLimiter = rateLimit({
  windowMs: config.rateLimitLoginWindow,
  max: config.rateLimitLoginAttempts * devMultiplier,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:login:',
  }),
});

// Register rate limiter (3 attempts per minute per IP, 300 in dev)
export const registerRateLimiter = rateLimit({
  windowMs: config.rateLimitRegisterWindow,
  max: config.rateLimitRegisterAttempts * devMultiplier,
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:register:',
  }),
});

// Execution rate limiter (10 requests per minute per user/IP, 1000 in dev)
export const executionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 * devMultiplier,
  message: 'Too many execution requests. Maximum 10 requests per minute.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return (req as any).user?.userId || req.ip || 'unknown';
  },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:execution:',
  }),
});
