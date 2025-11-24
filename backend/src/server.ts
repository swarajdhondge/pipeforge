// Yahoo Pipes 2025 - Backend Server
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config/env';
import pool from './config/database';
import logger from './utils/logger';
import { UserService } from './services/user.service';
import { OAuthService } from './services/oauth.service';
import { SecretsService } from './services/secrets.service';
import { StorageService } from './services/storage.service';
import { createAuthRoutes } from './routes/auth.routes';
import { createSecretsRoutes } from './routes/secrets.routes';
import { createStorageRoutes } from './routes/storage.routes';
import pipesRoutes from './routes/pipes.routes';
import executionsRoutes from './routes/executions.routes';
import previewRoutes from './routes/preview.routes';
import { loginRateLimiter, registerRateLimiter } from './middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import './services/execution-queue'; // Initialize queue worker
import { registerAllOperators } from './operators';

// Register all operators at startup
registerAllOperators();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve disk-stored uploads when using disk provider (or always safe)
app.use('/uploads', express.static(path.resolve(config.storageDiskRoot)));

// Request logging - only log non-health check requests in development
// Set LOG_REQUESTS=true to enable request logging
if (process.env.LOG_REQUESTS === 'true') {
  app.use((req, _res, next) => {
    // Skip health check and frequent polling endpoints
    if (req.path !== '/health' && !req.path.includes('/secrets')) {
      logger.debug('Request', {
        method: req.method,
        path: req.path,
      });
    }
    next();
  });
}

// Initialize services
const userService = new UserService(pool);
const oauthService = new OAuthService();
const secretsService = new SecretsService(pool);
const storageService = new StorageService();

// Routes
const authRoutes = createAuthRoutes(userService, oauthService);
const secretsRoutes = createSecretsRoutes(secretsService);
const storageRoutes = createStorageRoutes(storageService);

// Apply rate limiting to specific routes
app.use('/api/v1/auth/login', loginRateLimiter);
app.use('/api/v1/auth/register', registerRateLimiter);

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/secrets', secretsRoutes);
app.use('/api/v1/storage', storageRoutes);
app.use('/api/v1/pipes', pipesRoutes);
app.use('/api/v1/executions', executionsRoutes);
app.use('/api/v1/preview', previewRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${config.nodeEnv})`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

export default app;
