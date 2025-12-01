import { Pool } from 'pg';
import { Execution, CreateExecutionInput } from '../types/execution.types';
import { PipeService } from './pipe.service';
import { SecretsService } from './secrets.service';
import { PipeExecutor } from './pipe-executor';
import { operatorRegistry, registerAllOperators } from '../operators';
import { PipeDefinition, FetchConfig } from '../types/operator.types';
import logger from '../utils/logger';
import { queueExecution } from './execution-queue';

// Register all operators at module load time
// This includes:
// - Legacy fetch operator (backward compatibility)
// - Source operators: fetch-json, fetch-csv, fetch-rss, fetch-page
// - User input operators: text-input, number-input, url-input, date-input
// - Transformation operators: filter, sort, transform, unique, truncate, tail, rename
// - String operators: string-replace, regex, substring
// - URL operators: url-builder
// - Special operators: pipe-output
registerAllOperators();

/**
 * ExecutionService - Manages pipe executions
 * 
 * Features:
 * - Create execution records
 * - Sync execution (< 30s timeout)
 * - Get execution status
 * - List user executions
 * 
 * Requirements: 10, 12
 */
export class ExecutionService {
  private pipeService: PipeService;
  private secretsService: SecretsService;
  private pipeExecutor: PipeExecutor;

  constructor(private db: Pool) {
    this.pipeService = new PipeService(db);
    this.secretsService = new SecretsService(db);
    this.pipeExecutor = new PipeExecutor(operatorRegistry);
  }

  /**
   * Execute a pipe (sync or async)
   * @param input - Execution input
   * @returns Execution result or job ID
   */
  async execute(input: CreateExecutionInput): Promise<Execution | { execution_id: string; status: 'pending'; job_id: string }> {
    if (input.mode === 'async') {
      return this.executeAsync(input);
    }
    return this.executeSyncWithTimeout(input);
  }

  /**
   * Execute a pipe asynchronously
   * @param input - Execution input
   * @returns Execution ID and job ID
   */
  async executeAsync(input: CreateExecutionInput): Promise<{ execution_id: string; status: 'pending'; job_id: string }> {
    // Get pipe to check access
    const pipe = await this.pipeService.get(input.pipe_id, input.user_id || undefined);
    if (!pipe) {
      throw new Error('Pipe not found');
    }

    // Check if pipe is private and user is anonymous
    if (!pipe.is_public && !input.user_id) {
      throw new Error('Unauthorized: Cannot execute private pipe');
    }

    // Create execution record
    const execution = await this.create({
      pipe_id: input.pipe_id,
      user_id: input.user_id,
      status: 'pending',
    });

    // Queue execution
    const jobId = await queueExecution(input.pipe_id, input.user_id);

    return {
      execution_id: execution.id,
      status: 'pending',
      job_id: jobId,
    };
  }

  /**
   * Execute a pipe synchronously
   * @param input - Execution input
   * @returns Execution result
   */
  async executeSyncWithTimeout(input: CreateExecutionInput): Promise<Execution> {
    // Get pipe (pass userId which may be null for anonymous users)
    const pipe = await this.pipeService.get(input.pipe_id, input.user_id || undefined);
    if (!pipe) {
      throw new Error('Pipe not found');
    }

    // Check if pipe is private and user is anonymous
    if (!pipe.is_public && !input.user_id) {
      throw new Error('Unauthorized: Cannot execute private pipe');
    }

    // Create execution record
    const execution = await this.create({
      pipe_id: input.pipe_id,
      user_id: input.user_id,
      status: 'running',
    });

    try {
      // Validate secrets before execution
      await this.validateSecrets(pipe.definition, input.user_id);

      // Execute with 30s timeout, passing execution context
      const result = await this.executeWithTimeout(
        () => this.pipeExecutor.execute(pipe.definition, {
          secretsService: this.secretsService,
          userId: input.user_id,
        }),
        30000
      );

      // Update execution record
      await this.update(execution.id, {
        status: 'completed',
        result,
        completed_at: new Date(),
      });

      // Increment execution count
      await this.pipeService.incrementExecutionCount(input.pipe_id);

      return this.get(execution.id);
    } catch (error: any) {
      // Update execution record with error
      await this.update(execution.id, {
        status: 'failed',
        error: error.message,
        completed_at: new Date(),
      });

      logger.error('Sync execution failed', { executionId: execution.id, error: error.message, userId: input.user_id });

      throw error;
    }
  }

  /**
   * Create execution record
   * @param data - Execution data
   * @returns Created execution
   */
  async create(data: {
    pipe_id: string;
    user_id: string | null;
    status: 'pending' | 'running' | 'completed' | 'failed';
  }): Promise<Execution> {
    const result = await this.db.query<Execution>(
      `INSERT INTO executions (pipe_id, user_id, status, started_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [data.pipe_id, data.user_id, data.status]
    );

    return this.transformExecution(result.rows[0]);
  }

  /**
   * Update execution record
   * @param executionId - Execution ID
   * @param data - Update data
   */
  async update(
    executionId: string,
    data: {
      status?: 'pending' | 'running' | 'completed' | 'failed';
      result?: any;
      error?: string;
      completed_at?: Date;
    }
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      updates.push('status = $' + paramIndex++);
      values.push(data.status);
    }

    if (data.result !== undefined) {
      updates.push('result = $' + paramIndex++);
      values.push(JSON.stringify(data.result));
    }

    if (data.error !== undefined) {
      updates.push('error = $' + paramIndex++);
      values.push(data.error);
    }

    if (data.completed_at !== undefined) {
      updates.push('completed_at = $' + paramIndex++);
      values.push(data.completed_at);
    }

    values.push(executionId);

    await this.db.query(
      'UPDATE executions SET ' + updates.join(', ') + ' WHERE id = $' + paramIndex,
      values
    );
  }

  /**
   * Get execution by ID
   * @param executionId - Execution ID
   * @returns Execution or null
   */
  async get(executionId: string): Promise<Execution> {
    const result = await this.db.query<Execution>(
      'SELECT * FROM executions WHERE id = $1',
      [executionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Execution not found');
    }

    return this.transformExecution(result.rows[0]);
  }

  /**
   * List user executions
   * @param options - Filter options
   * @returns Paginated executions
   */
  async list(options: {
    userId?: string;
    pipeId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Execution[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (options.userId) {
      conditions.push('user_id = $' + paramIndex++);
      values.push(options.userId);
    }

    if (options.pipeId) {
      conditions.push('pipe_id = $' + paramIndex++);
      values.push(options.pipeId);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Get total count
    const countResult = await this.db.query(
      'SELECT COUNT(*) FROM executions ' + whereClause,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get executions
    const result = await this.db.query<Execution>(
      'SELECT * FROM executions ' + whereClause + ' ORDER BY created_at DESC LIMIT $' + paramIndex++ + ' OFFSET $' + paramIndex,
      [...values, limit, offset]
    );

    return {
      items: result.rows.map((exec) => this.transformExecution(exec)),
      total,
      page,
      limit,
    };
  }

  /**
   * Execute with timeout
   * @param fn - Function to execute
   * @param timeoutMs - Timeout in milliseconds
   * @returns Result
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout after ' + timeoutMs + 'ms')), timeoutMs)
      ),
    ]);
  }

  /**
   * Transform execution row (parse JSON fields)
   * @param execution - Raw execution row
   * @returns Transformed execution
   */
  private transformExecution(execution: any): Execution {
    return {
      ...execution,
      result: execution.result && typeof execution.result === 'string'
        ? JSON.parse(execution.result)
        : execution.result,
    };
  }

  /**
   * Validate all secret references before execution
   * @param definition - Pipe definition
   * @param userId - User ID (null for anonymous)
   */
  private async validateSecrets(definition: PipeDefinition, userId: string | null): Promise<void> {
    // Extract all secret references from fetch operators
    const secretRefs = this.extractSecretRefs(definition);

    // If no secrets, return early (backward compatibility)
    if (secretRefs.length === 0) {
      return;
    }

    // If secrets but no userId, fail
    if (!userId) {
      throw new Error('Authentication required to use secrets');
    }

    // Validate each secret exists and belongs to user
    for (const secretRef of secretRefs) {
      const isValid = await this.secretsService.validate(secretRef.secretId, userId);
      if (!isValid) {
        // Get secret name for better error message
        const secret = await this.secretsService.get(secretRef.secretId, userId);
        const secretName = secret?.name || secretRef.secretId;
        throw new Error('Secret not found: ' + secretName);
      }
    }
  }

  /**
   * Extract secret references from pipe definition
   * @param definition - Pipe definition
   * @returns Array of secret references
   */
  private extractSecretRefs(definition: PipeDefinition): Array<{ secretId: string }> {
    return definition.nodes
      .filter(node => node.type === 'fetch')
      .map(node => node.data.config as FetchConfig)
      .filter(config => config.secretRef !== undefined)
      .map(config => ({ secretId: config.secretRef!.secretId }));
  }
}
