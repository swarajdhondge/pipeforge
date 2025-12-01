import { Pool } from 'pg';
import { Pipe, CreatePipeInput, UpdatePipeInput } from '../types/pipe.types';
import { PipeDefinition } from '../types/operator.types';
import logger from '../utils/logger';
import redisClient from '../config/redis';

/**
 * PipeService - CRUD operations for pipes
 * 
 * Features:
 * - Create, get, update, delete pipes
 * - Validate pipe definitions
 * - Handle user ownership
 * - Version management
 * 
 * Requirements: 1, 13
 */
export class PipeService {
  constructor(private db: Pool) {}

  /**
   * Create a new pipe
   * @param input - Pipe creation data
   * @returns Created pipe
   */
  async create(input: CreatePipeInput): Promise<Pipe> {

    // Enforce: Drafts must always be private
    if (input.is_draft && input.is_public) {
      throw new Error('Drafts cannot be public. Please save as private or publish the pipe.');
    }

    // Check draft limit if creating a draft
    if (input.is_draft && input.user_id) {
      const draftCount = await this.getDraftCount(input.user_id);
      if (draftCount >= 5) {
        throw new Error('Maximum 5 drafts allowed. Please delete or publish a draft first.');
      }
    }

    // Force drafts to be private
    const isPublic = input.is_draft ? false : (input.is_public || false);

    const result = await this.db.query<Pipe>(
      `INSERT INTO pipes (user_id, name, description, definition, is_public, is_draft, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.user_id,
        input.name,
        input.description || null,
        JSON.stringify(input.definition),
        isPublic,
        input.is_draft || false,
        input.tags || [],
      ]
    );

    const pipe = result.rows[0];

    // Create initial version
    await this.createVersion(pipe.id, pipe.definition);

    return this.transformPipe(pipe);
  }

  /**
   * Get a pipe by ID
   * @param pipeId - Pipe ID
   * @param userId - User ID (optional, for ownership check)
   * @returns Pipe or null (with warning if contains secrets)
   */
  async get(pipeId: string, userId?: string): Promise<Pipe | null> {

    // Try cache first for public pipes
    const cacheKey = `pipe:${pipeId}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const pipe = JSON.parse(cached);
        // Check access for cached pipe
        // Anonymous users (userId is undefined/null) can only access public pipes
        if (!pipe.is_public && (!userId || pipe.user_id !== userId)) {
          throw new Error('Unauthorized access to private pipe');
        }
        return this.addSecretWarning(pipe);
      }
    } catch (error) {
      logger.warn('Cache get failed', { error });
    }

    const result = await this.db.query<any>(
      `SELECT p.*,
              CASE 
                WHEN p.user_id IS NULL THEN 
                  json_build_object('id', NULL, 'displayName', 'Pipe Forge')
                ELSE 
                  json_build_object(
                    'id', u.id,
                    'displayName', COALESCE(u.display_name, u.name, SPLIT_PART(u.email, '@', 1))
                  )
              END as author
       FROM pipes p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [pipeId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const pipe = result.rows[0];

    // Check access: public pipes or owned pipes
    // Anonymous users (userId is undefined/null) can only access public pipes
    // Authenticated users can access public pipes + their own private pipes
    if (!pipe.is_public && (!userId || pipe.user_id !== userId)) {
      throw new Error('Unauthorized access to private pipe');
    }

    const transformedPipe = this.transformPipe(pipe);

    // Cache public pipes for 1 hour
    if (pipe.is_public) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(transformedPipe));
      } catch (error) {
        logger.warn('Cache set failed', { error });
      }
    }

    return this.addSecretWarning(transformedPipe);
  }

  /**
   * Add warning message if pipe contains secret references
   * @param pipe - Pipe object
   * @returns Pipe with warning field if secrets present
   */
  private addSecretWarning(pipe: Pipe): Pipe {
    const secretRefs = this.extractSecretRefs(pipe.definition);
    
    if (secretRefs.length > 0) {
      return {
        ...pipe,
        _warning: 'This pipe contains secret references. If you export or fork this pipe, you will need to reconfigure the secrets with your own credentials.',
      } as any;
    }
    
    return pipe;
  }

  /**
   * Update a pipe
   * @param pipeId - Pipe ID
   * @param userId - User ID (for ownership check)
   * @param input - Update data
   * @returns Updated pipe
   */
  async update(pipeId: string, userId: string, input: UpdatePipeInput): Promise<Pipe> {
    // Check ownership
    const existing = await this.get(pipeId, userId);
    if (!existing) {
      throw new Error('Pipe not found');
    }

    if (existing.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this pipe');
    }

    // Enforce: Drafts must always be private
    if (input.is_draft && input.is_public) {
      throw new Error('Drafts cannot be public. Please save as private or publish the pipe.');
    }

    // If setting as draft, force to private
    if (input.is_draft === true && input.is_public === undefined) {
      input.is_public = false;
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(input.description);
    }

    if (input.definition !== undefined) {
      updates.push(`definition = $${paramIndex++}`);
      values.push(JSON.stringify(input.definition));
    }

    if (input.is_public !== undefined) {
      updates.push(`is_public = $${paramIndex++}`);
      values.push(input.is_public);
    }

    if (input.is_draft !== undefined) {
      updates.push(`is_draft = $${paramIndex++}`);
      values.push(input.is_draft);
    }

    if (input.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(input.tags);
    }

    updates.push(`updated_at = NOW()`);
    values.push(pipeId);

    const result = await this.db.query<Pipe>(
      `UPDATE pipes SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    const pipe = result.rows[0];

    // Create new version if definition changed
    if (input.definition !== undefined) {
      await this.createVersion(pipeId, input.definition);
      await this.cleanupOldVersions(pipeId);
    }

    // Invalidate cache
    await this.invalidateCache(pipeId);

    return this.transformPipe(pipe);
  }

  /**
   * Delete a pipe
   * @param pipeId - Pipe ID
   * @param userId - User ID (for ownership check)
   */
  async delete(pipeId: string, userId: string): Promise<void> {
    // Check ownership
    const existing = await this.get(pipeId, userId);
    if (!existing) {
      throw new Error('Pipe not found');
    }

    if (existing.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this pipe');
    }

    await this.db.query('DELETE FROM pipes WHERE id = $1', [pipeId]);

    // Invalidate cache
    const cacheKey = `pipe:${pipeId}`;
    try {
      await redisClient.del(cacheKey);
    } catch (error) {
      logger.warn('Cache invalidation failed', { error });
    }
  }

  /**
   * Get draft count for a user
   * @param userId - User ID
   * @returns Number of drafts
   */
  async getDraftCount(userId: string): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM pipes WHERE user_id = $1 AND is_draft = true',
      [userId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * List pipes with filters
   * @param options - Filter options
   * @returns Array of pipes
   */
  async list(options: {
    userId?: string;
    isPublic?: boolean;
    search?: string;
    tags?: string[];
    sort?: 'popular' | 'recent' | 'most_used';
    page?: number;
    limit?: number;
  }): Promise<{ items: Pipe[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Handle anonymous vs authenticated users
    if (options.userId) {
      // Authenticated user: show public pipes + their own private pipes
      // Exclude system templates (user_id IS NULL) from regular browse
      conditions.push(`(p.user_id = $${paramIndex} OR (p.is_public = true AND p.user_id IS NOT NULL))`);
      values.push(options.userId);
      const userIdParamIndex = paramIndex; // Store for draft filter
      paramIndex++;
      
      // Exclude drafts unless they belong to the user
      conditions.push(`(p.user_id = $${userIdParamIndex} OR p.is_draft = false)`);
    } else {
      // Anonymous user: only show public pipes and exclude all drafts
      // Exclude system templates (user_id IS NULL) from regular browse
      conditions.push(`p.is_public = true`);
      conditions.push(`p.user_id IS NOT NULL`);
      conditions.push(`p.is_draft = false`);
    }

    // Apply explicit isPublic filter if provided
    if (options.isPublic !== undefined) {
      conditions.push(`p.is_public = $${paramIndex++}`);
      values.push(options.isPublic);
    }

    if (options.search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      values.push(`%${options.search}%`);
      paramIndex++;
    }

    if (options.tags && options.tags.length > 0) {
      conditions.push(`p.tags && $${paramIndex++}`);
      values.push(options.tags);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    let orderBy = 'created_at DESC';
    if (options.sort === 'popular') {
      orderBy = 'like_count DESC';
    } else if (options.sort === 'most_used') {
      orderBy = 'execution_count DESC';
    }

    // Get total count
    const countResult = await this.db.query(
      `SELECT COUNT(*) FROM pipes p ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get pipes with author information
    const result = await this.db.query<any>(
      `SELECT 
        p.*,
        CASE 
          WHEN p.user_id IS NULL THEN 
            json_build_object('id', NULL, 'displayName', 'Pipe Forge')
          ELSE 
            json_build_object(
              'id', u.id,
              'displayName', COALESCE(u.display_name, u.name, SPLIT_PART(u.email, '@', 1))
            )
        END as author
      FROM pipes p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause} 
      ORDER BY p.${orderBy} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      items: result.rows.map((pipe) => this.transformPipe(pipe)),
      total,
      page,
      limit,
    };
  }

  /**
   * Fork a pipe (create a copy)
   * @param pipeId - Pipe ID to fork
   * @param userId - User ID of the forker
   * @returns Forked pipe
   */
  async fork(pipeId: string, userId: string): Promise<Pipe> {
    const original = await this.get(pipeId);
    if (!original) {
      throw new Error('Pipe not found');
    }

    if (!original.is_public && original.user_id !== userId) {
      throw new Error('Cannot fork private pipe');
    }

    // Check for secret references in the original pipe
    const secretRefs = this.extractSecretRefs(original.definition);
    const hasSecrets = secretRefs.length > 0;

    // Remove secret references from forked pipe definition
    const forkedDefinition = hasSecrets 
      ? this.removeSecretRefs(original.definition)
      : original.definition;

    const forked = await this.create({
      user_id: userId,
      name: `${original.name} (fork)`,
      description: original.description || undefined,
      definition: forkedDefinition,
      is_public: false, // Forks are private by default
      tags: original.tags,
    });

    // Update forked_from
    await this.db.query('UPDATE pipes SET forked_from = $1 WHERE id = $2', [pipeId, forked.id]);

    return forked;
  }

  /**
   * Extract secret references from pipe definition
   * @param definition - Pipe definition
   * @returns Array of secret references
   */
  private extractSecretRefs(definition: PipeDefinition): Array<{ secretId: string }> {
    return definition.nodes
      .filter(node => node.type === 'fetch')
      .map(node => node.data.config as any)
      .filter(config => config.secretRef !== undefined)
      .map(config => ({ secretId: config.secretRef.secretId }));
  }

  /**
   * Remove secret references from pipe definition
   * @param definition - Pipe definition
   * @returns Pipe definition without secret references
   */
  private removeSecretRefs(definition: PipeDefinition): PipeDefinition {
    return {
      ...definition,
      nodes: definition.nodes.map(node => {
        if (node.type === 'fetch' && node.data.config && (node.data.config as any).secretRef) {
          // Remove secretRef from fetch operator config
          const { secretRef, ...configWithoutSecret } = node.data.config as any;
          return {
            ...node,
            data: {
              ...node.data,
              config: configWithoutSecret,
            },
          };
        }
        return node;
      }),
    };
  }

  /**
   * Increment execution count
   * @param pipeId - Pipe ID
   */
  async incrementExecutionCount(pipeId: string): Promise<void> {
    await this.db.query('UPDATE pipes SET execution_count = execution_count + 1 WHERE id = $1', [
      pipeId,
    ]);
  }

  /**
   * Like a pipe
   * @param pipeId - Pipe ID
   * @param userId - User ID
   * @returns Updated like count
   */
  async like(pipeId: string, userId: string): Promise<{ like_count: number }> {
    // Check if pipe exists and is public
    const pipe = await this.get(pipeId);
    if (!pipe) {
      throw new Error('Pipe not found');
    }

    if (!pipe.is_public) {
      throw new Error('Cannot like private pipe');
    }

    try {
      // Insert like (will fail if already liked due to unique constraint)
      await this.db.query(
        'INSERT INTO pipe_likes (pipe_id, user_id) VALUES ($1, $2)',
        [pipeId, userId]
      );

      // Increment like count
      await this.db.query(
        'UPDATE pipes SET like_count = like_count + 1 WHERE id = $1',
        [pipeId]
      );

      // Get updated count
      const result = await this.db.query<{ like_count: number }>(
        'SELECT like_count FROM pipes WHERE id = $1',
        [pipeId]
      );

      return { like_count: result.rows[0].like_count };
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation - already liked
        throw new Error('You have already liked this pipe');
      }
      throw error;
    }
  }

  /**
   * Unlike a pipe
   * @param pipeId - Pipe ID
   * @param userId - User ID
   * @returns Updated like count
   */
  async unlike(pipeId: string, userId: string): Promise<{ like_count: number }> {
    // Check if pipe exists
    const pipe = await this.get(pipeId);
    if (!pipe) {
      throw new Error('Pipe not found');
    }

    // Delete like
    const result = await this.db.query(
      'DELETE FROM pipe_likes WHERE pipe_id = $1 AND user_id = $2 RETURNING id',
      [pipeId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('You have not liked this pipe');
    }

    // Decrement like count
    await this.db.query(
      'UPDATE pipes SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
      [pipeId]
    );

    // Get updated count
    const countResult = await this.db.query<{ like_count: number }>(
      'SELECT like_count FROM pipes WHERE id = $1',
      [pipeId]
    );

    return { like_count: countResult.rows[0].like_count };
  }

  /**
   * Create a new version
   * @param pipeId - Pipe ID
   * @param definition - Pipe definition
   */
  private async createVersion(pipeId: string, definition: PipeDefinition): Promise<void> {
    // Get current max version number
    const result = await this.db.query<{ version_number: number }>(
      'SELECT MAX(version_number) as version_number FROM pipe_versions WHERE pipe_id = $1',
      [pipeId]
    );

    const nextVersion = (result.rows[0]?.version_number || 0) + 1;

    await this.db.query(
      'INSERT INTO pipe_versions (pipe_id, version_number, definition) VALUES ($1, $2, $3)',
      [pipeId, nextVersion, JSON.stringify(definition)]
    );

  }

  /**
   * Clean up old versions (keep last 5)
   * @param pipeId - Pipe ID
   */
  private async cleanupOldVersions(pipeId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM pipe_versions 
       WHERE pipe_id = $1 
       AND version_number NOT IN (
         SELECT version_number FROM pipe_versions 
         WHERE pipe_id = $1 
         ORDER BY version_number DESC 
         LIMIT 5
       )`,
      [pipeId]
    );
  }

  /**
   * Get version history (last 5 versions)
   * @param pipeId - Pipe ID
   * @param userId - User ID (for ownership check)
   * @returns Array of versions
   */
  async getVersions(pipeId: string, userId: string): Promise<Array<{ version_number: number; created_at: Date }>> {
    // Check ownership
    const pipe = await this.get(pipeId, userId);
    if (!pipe) {
      throw new Error('Pipe not found');
    }

    if (pipe.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this pipe');
    }

    const result = await this.db.query(
      `SELECT version_number, created_at 
       FROM pipe_versions 
       WHERE pipe_id = $1 
       ORDER BY version_number DESC 
       LIMIT 5`,
      [pipeId]
    );

    return result.rows;
  }

  /**
   * Restore a previous version (creates new version)
   * @param pipeId - Pipe ID
   * @param versionNumber - Version number to restore
   * @param userId - User ID (for ownership check)
   * @returns Updated pipe
   */
  async restoreVersion(pipeId: string, versionNumber: number, userId: string): Promise<Pipe> {
    // Check ownership
    const pipe = await this.get(pipeId, userId);
    if (!pipe) {
      throw new Error('Pipe not found');
    }

    if (pipe.user_id !== userId) {
      throw new Error('Unauthorized: You do not own this pipe');
    }

    // Get the version
    const versionResult = await this.db.query(
      'SELECT definition FROM pipe_versions WHERE pipe_id = $1 AND version_number = $2',
      [pipeId, versionNumber]
    );

    if (versionResult.rows.length === 0) {
      throw new Error('Version not found');
    }

    const definition = typeof versionResult.rows[0].definition === 'string'
      ? JSON.parse(versionResult.rows[0].definition)
      : versionResult.rows[0].definition;

    // Update pipe with restored definition (this creates a new version)
    return this.update(pipeId, userId, { definition });
  }

  /**
   * Get trending pipes with time-decay scoring algorithm
   * 
   * Scoring formula:
   * - Likes in last 24h: weight 5
   * - Likes in last 7 days: weight 2
   * - Executions in last 24h: weight 3
   * - Executions in last 7 days: weight 1
   * - Fork count: weight 2
   * - Recency bonus: pipes created in last 3 days get 20% boost
   * 
   * @param limit - Number of pipes to return
   * @returns Array of trending pipes
   */
  async getTrending(limit: number = 10): Promise<Pipe[]> {
    // Try cache first
    const cacheKey = 'pipes:trending';
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache get failed', { error });
    }

    const result = await this.db.query<any>(
      `WITH activity AS (
        SELECT 
          p.id,
          -- Recent likes (24h) - highest weight
          COUNT(DISTINCT CASE 
            WHEN pl.created_at > NOW() - INTERVAL '24 hours' 
            THEN pl.id END) * 5 as likes_24h,
          -- Weekly likes
          COUNT(DISTINCT CASE 
            WHEN pl.created_at > NOW() - INTERVAL '7 days' 
            AND pl.created_at <= NOW() - INTERVAL '24 hours'
            THEN pl.id END) * 2 as likes_week,
          -- Recent executions (24h)
          COUNT(DISTINCT CASE 
            WHEN e.created_at > NOW() - INTERVAL '24 hours' 
            THEN e.id END) * 3 as exec_24h,
          -- Weekly executions
          COUNT(DISTINCT CASE 
            WHEN e.created_at > NOW() - INTERVAL '7 days' 
            AND e.created_at <= NOW() - INTERVAL '24 hours'
            THEN e.id END) * 1 as exec_week,
          -- Like count bonus (existing likes)
          COALESCE(p.like_count, 0) as like_bonus,
          -- Recency bonus (created in last 3 days)
          CASE WHEN p.created_at > NOW() - INTERVAL '3 days' 
            THEN 1.2 ELSE 1.0 END as recency_multiplier
        FROM pipes p
        LEFT JOIN pipe_likes pl ON p.id = pl.pipe_id 
          AND pl.created_at > NOW() - INTERVAL '7 days'
        LEFT JOIN executions e ON p.id = e.pipe_id 
          AND e.created_at > NOW() - INTERVAL '7 days'
        WHERE p.is_public = true
          AND p.is_draft = false
          AND p.user_id IS NOT NULL  -- Exclude system templates from trending
        GROUP BY p.id
      )
      SELECT 
        p.*, 
        a.likes_24h, a.likes_week, a.exec_24h, a.exec_week,
        ((a.likes_24h + a.likes_week + a.exec_24h + a.exec_week + a.like_bonus) * a.recency_multiplier) as trending_score,
        json_build_object(
          'id', u.id,
          'displayName', COALESCE(u.display_name, u.name, SPLIT_PART(u.email, '@', 1))
        ) as author
      FROM pipes p
      INNER JOIN activity a ON p.id = a.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE (a.likes_24h + a.likes_week + a.exec_24h + a.exec_week + a.like_bonus) > 0
         OR p.created_at > NOW() - INTERVAL '7 days'
      ORDER BY trending_score DESC, p.created_at DESC
      LIMIT $1`,
      [limit]
    );

    const pipes = result.rows.map((pipe) => this.transformPipe(pipe));

    // Cache for 30 minutes (shorter for more real-time trending)
    try {
      await redisClient.setEx(cacheKey, 1800, JSON.stringify(pipes));
    } catch (error) {
      logger.warn('Cache set failed', { error });
    }

    return pipes;
  }

  /**
   * Get featured pipes
   * @param limit - Number of pipes to return
   * @returns Array of featured pipes
   */
  async getFeatured(limit: number = 10): Promise<Pipe[]> {
    const result = await this.db.query<any>(
      `SELECT p.*,
              CASE 
                WHEN p.user_id IS NULL THEN 
                  json_build_object('id', NULL, 'displayName', 'Pipe Forge')
                ELSE 
                  json_build_object(
                    'id', u.id,
                    'displayName', COALESCE(u.display_name, u.name, SPLIT_PART(u.email, '@', 1))
                  )
              END as author
       FROM pipes p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.is_public = true 
         AND p.is_featured = true
         AND p.is_draft = false
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((pipe) => this.transformPipe(pipe));
  }

  /**
   * Invalidate cache for a pipe
   * @param pipeId - Pipe ID
   */
  private async invalidateCache(pipeId: string): Promise<void> {
    try {
      await redisClient.del(`pipe:${pipeId}`);
      // Also invalidate trending cache as it might be affected
      await redisClient.del('pipes:trending');
    } catch (error) {
      logger.warn('Cache invalidation failed', { error });
    }
  }

  /**
   * Transform pipe row (parse JSON fields)
   * @param pipe - Raw pipe row
   * @returns Transformed pipe
   */
  private transformPipe(pipe: any): Pipe {
    return {
      ...pipe,
      definition: typeof pipe.definition === 'string' ? JSON.parse(pipe.definition) : pipe.definition,
    };
  }
}
