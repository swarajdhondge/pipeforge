/**
 * Clear Redis Cache Script
 * 
 * Clears all cached data from Redis
 */

import redisClient from '../config/redis';
// import logger from '../utils/logger';

async function clearCache() {
  try {
    console.log('🗑️  Clearing Redis cache...');

    await redisClient.flushAll();

    console.log('✅ Redis cache cleared successfully!');

    await redisClient.quit();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
}

clearCache();
