import Queue from 'bull';
import { config } from '../config/env';
import pool from '../config/database';
import logger from '../utils/logger';

/**
 * Execution Queue - Bull queue for async pipe execution
 * 
 * Features:
 * - Queue pipe executions
 * - Process jobs with retry logic (3 attempts)
 * - 5-minute timeout
 * - Update execution status in database
 * 
 * Requirements: 11
 */

// Create Bull queue
export const executionQueue = new Queue('pipe-execution', config.redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    timeout: 300000, // 5 minutes
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
  },
});

// Lazy-load ExecutionService to avoid circular dependency
let executionService: any = null;
function getExecutionService() {
  if (!executionService) {
    const { ExecutionService } = require('./execution.service');
    executionService = new ExecutionService(pool);
  }
  return executionService;
}

/**
 * Add execution job to queue
 * @param pipeId - Pipe ID
 * @param userId - User ID
 * @returns Job ID
 */
export async function queueExecution(pipeId: string, userId: string | null): Promise<string> {
  const job = await executionQueue.add({
    pipeId,
    userId,
    timestamp: Date.now(),
  });

  return job.id.toString();
}

/**
 * Process execution jobs
 */
executionQueue.process(async (job) => {
  const { pipeId, userId } = job.data;

  // Get execution service (lazy-loaded)
  const service = getExecutionService();

  // Create execution record
  const execution = await service.create({
    pipe_id: pipeId,
    user_id: userId,
    status: 'running',
  });

  try {
    // Execute pipe
    const result = await service.executeSyncWithTimeout({
      pipe_id: pipeId,
      user_id: userId,
    });

    return result;
  } catch (error: any) {
    logger.error('Execution job failed', {
      jobId: job.id,
      executionId: execution.id,
      error: error.message,
    });

    throw error; // Re-throw for Bull retry logic
  }
});

// Queue event handlers
executionQueue.on('completed', () => {
  // Job completed
});

executionQueue.on('failed', (job, error) => {
  logger.error('Job failed', {
    jobId: job?.id,
    pipeId: job?.data.pipeId,
    error: error.message,
    attempts: job?.attemptsMade,
  });
});

executionQueue.on('stalled', (job) => {
  logger.warn('Job stalled', {
    jobId: job.id,
    pipeId: job.data.pipeId,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await executionQueue.close();
});

process.on('SIGINT', async () => {
  await executionQueue.close();
});

export default executionQueue;
