/**
 * Default Pipe Execution Tests
 * 
 * Verifies that the default sample pipe (Fetch JSON -> Pipe Output) executes correctly.
 * 
 * Requirements: 4.1, 4.2, 4.3
 * - 4.1: WHEN a user clicks the Run button THEN the system SHALL execute all connected operators in topological order
 * - 4.2: WHEN execution completes successfully THEN the system SHALL display the final result in the results panel
 * - 4.3: WHEN execution fails THEN the system SHALL display a clear error message
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executePipe, formatExecutionResult, validatePipeForExecution } from '../logic/execution-logic';
import type { Node, Edge } from 'reactflow';
import { MarkerType } from 'reactflow';

// Mock the execution service
vi.mock('../../../services/execution-service', () => ({
  executionService: {
    executeDefinition: vi.fn(),
  },
}));

import { executionService } from '../../../services/execution-service';

/**
 * Default nodes matching canvas-slice.ts DEFAULT_NODES
 */
const DEFAULT_NODES: Node[] = [
  {
    id: 'fetch-1',
    type: 'fetch-json',
    position: { x: 100, y: 150 },
    data: {
      label: 'Fetch JSON',
      config: {
        url: 'https://jsonplaceholder.typicode.com/posts',
      },
    },
  },
  {
    id: 'output-1',
    type: 'pipe-output',
    position: { x: 450, y: 150 },
    data: {
      label: 'Pipe Output',
      config: {},
    },
  },
];

/**
 * Default edges matching canvas-slice.ts DEFAULT_EDGES
 */
const DEFAULT_EDGES: Edge[] = [
  {
    id: 'e-fetch-1-output-1',
    source: 'fetch-1',
    target: 'output-1',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#6b7280',
    },
    style: {
      strokeWidth: 2,
      stroke: '#6b7280',
    },
  },
];

describe('Default Pipe Execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validatePipeForExecution', () => {
    /**
     * Requirement 4.1: Validate pipe before execution
     */
    it('should validate default sample pipe as valid', () => {
      const validation = validatePipeForExecution(DEFAULT_NODES, DEFAULT_EDGES);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject empty pipe', () => {
      const validation = validatePipeForExecution([], []);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Pipe must have at least one operator');
    });

    it('should reject pipe without pipe-output node', () => {
      const nodesWithoutOutput: Node[] = [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 150 },
          data: { label: 'Fetch JSON', config: { url: 'https://example.com' } },
        },
      ];
      
      const validation = validatePipeForExecution(nodesWithoutOutput, []);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Pipe must have a Pipe Output node');
    });
  });

  describe('executePipe', () => {
    /**
     * Requirement 4.1: Execute all connected operators in topological order
     */
    it('should execute default sample pipe successfully', async () => {
      const mockResult = {
        status: 'completed' as const,
        finalResult: [
          { id: 1, title: 'Test Post', body: 'Test body' },
          { id: 2, title: 'Another Post', body: 'Another body' },
        ],
        intermediateResults: {
          'fetch-1': {
            nodeId: 'fetch-1',
            type: 'fetch-json',
            label: 'Fetch JSON',
            result: [
              { id: 1, title: 'Test Post', body: 'Test body' },
              { id: 2, title: 'Another Post', body: 'Another body' },
            ],
            executionTime: 150,
            status: 'success' as const,
          },
          'output-1': {
            nodeId: 'output-1',
            type: 'pipe-output',
            label: 'Pipe Output',
            result: [
              { id: 1, title: 'Test Post', body: 'Test body' },
              { id: 2, title: 'Another Post', body: 'Another body' },
            ],
            executionTime: 1,
            status: 'success' as const,
          },
        },
        executionOrder: ['fetch-1', 'output-1'],
        totalExecutionTime: 151,
      };

      vi.mocked(executionService.executeDefinition).mockResolvedValue(mockResult);

      const result = await executePipe(DEFAULT_NODES, DEFAULT_EDGES);

      expect(result.status).toBe('completed');
      expect(result.finalResult).toBeDefined();
      expect(Array.isArray(result.finalResult)).toBe(true);
      expect(result.executionOrder).toEqual(['fetch-1', 'output-1']);
    });

    it('should convert nodes and edges to correct definition format', async () => {
      const mockResult = {
        status: 'completed' as const,
        finalResult: [],
        intermediateResults: {},
        executionOrder: [],
        totalExecutionTime: 10,
      };

      vi.mocked(executionService.executeDefinition).mockResolvedValue(mockResult);

      await executePipe(DEFAULT_NODES, DEFAULT_EDGES);

      expect(executionService.executeDefinition).toHaveBeenCalledWith(
        expect.objectContaining({
          nodes: expect.arrayContaining([
            expect.objectContaining({
              id: 'fetch-1',
              type: 'fetch-json',
              data: expect.objectContaining({
                label: 'Fetch JSON',
                config: expect.objectContaining({
                  url: 'https://jsonplaceholder.typicode.com/posts',
                }),
              }),
            }),
            expect.objectContaining({
              id: 'output-1',
              type: 'pipe-output',
            }),
          ]),
          edges: expect.arrayContaining([
            expect.objectContaining({
              id: 'e-fetch-1-output-1',
              source: 'fetch-1',
              target: 'output-1',
            }),
          ]),
        }),
        'sync',
        undefined
      );
    });
  });

  describe('formatExecutionResult', () => {
    /**
     * Requirement 4.2: Display final result on success
     */
    it('should format successful execution result', () => {
      const result = {
        status: 'completed' as const,
        finalResult: [{ id: 1, title: 'Test' }],
        intermediateResults: {
          'fetch-1': {
            nodeId: 'fetch-1',
            type: 'fetch-json',
            label: 'Fetch JSON',
            result: [{ id: 1, title: 'Test' }],
            executionTime: 100,
            status: 'success' as const,
          },
        },
        executionOrder: ['fetch-1'],
        totalExecutionTime: 100,
      };

      const formatted = formatExecutionResult(result);

      expect(formatted.status).toBe('success');
      expect(formatted.result).toEqual([{ id: 1, title: 'Test' }]);
      expect(formatted.executionTime).toBe(100);
    });

    /**
     * Requirement 4.3: Display clear error message on failure
     */
    it('should format failed execution result with error details', () => {
      const result = {
        status: 'failed' as const,
        error: 'Network error: Unable to reach jsonplaceholder.typicode.com',
        nodeId: 'fetch-1',
        operatorType: 'fetch-json',
        intermediateResults: {
          'fetch-1': {
            nodeId: 'fetch-1',
            type: 'fetch-json',
            label: 'Fetch JSON',
            result: null,
            executionTime: 30000,
            status: 'error' as const,
            error: 'Network error: Unable to reach jsonplaceholder.typicode.com',
          },
        },
        executionOrder: ['fetch-1'],
        totalExecutionTime: 30000,
      };

      const formatted = formatExecutionResult(result);

      expect(formatted.status).toBe('error');
      expect(formatted.error).toBe('Network error: Unable to reach jsonplaceholder.typicode.com');
      expect(formatted.failedNodeId).toBe('fetch-1');
      expect(formatted.failedOperatorType).toBe('fetch-json');
    });
  });
});
