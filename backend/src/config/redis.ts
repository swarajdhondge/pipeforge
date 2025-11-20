import { createClient } from 'redis';
import { config } from './env';
import logger from '../utils/logger';

const redisClient = createClient({
  url: config.redisUrl,
});

redisClient.on('error', (err) => {
  logger.error('Redis error', { error: err });
});

redisClient.on('connect', () => {
  // Redis connected
});

// Connect to Redis
redisClient.connect().catch((err) => {
  logger.error('Failed to connect to Redis', { error: err });
  process.exit(1);
});

export default redisClient;
