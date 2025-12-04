/**
 * Flush Redis Cache Script
 * 
 * Clears all cached data from Redis
 */

import { createClient } from 'redis';
import { config } from '../config/env';

async function flushRedis() {
  const client = createClient({
    url: config.redisUrl,
  });

  try {
    await client.connect();
    console.log('🔌 Connected to Redis');
    
    await client.flushAll();
    console.log('✅ Redis cache flushed successfully!');
    
    await client.quit();
  } catch (error) {
    console.error('❌ Error flushing Redis:', error);
    process.exit(1);
  }
}

flushRedis();
