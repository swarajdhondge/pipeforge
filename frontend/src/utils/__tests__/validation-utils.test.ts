import { describe, it, expect } from 'vitest';
import {
  validatePipeDefinition,
  formatValidationErrors,
  type PipeDefinition,
  type ValidationError,
} from '../validation-utils';

describe('validatePipeDefinition', () => {
  describe('Structure validation (Requirement 19.4)', () => {
    it('should reject null definition', () => {
      const result = validatePipeDefinition(null as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('must be an object');
    });

    it('should reject undefined definition', () => {
      const result = validatePipeDefinition(undefined as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('must be an object');
    });

    it('should reject non-object definition', () => {
      const result = validatePipeDefinition('not an object' as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('must be an object');
    });

    it('should reject definition without nodes array', () => {
      const result = validatePipeDefinition({
        edges: [],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('nodes must be an array');
    });

    it('should reject definition without edges array', () => {
      const result = validatePipeDefinition({
        nodes: [],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('edges must be an array');
    });

    it('should reject definition with non-array nodes', () => {
      const result = validatePipeDefinition({
        nodes: 'not an array',
        edges: [],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('nodes must be an array');
    });

    it('should reject definition with non-array edges', () => {
      const result = validatePipeDefinition({
        nodes: [],
        edges: 'not an array',
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('edges must be an array');
    });

    it('should reject empty nodes array', () => {
      const result = validatePipeDefinition({
        nodes: [],
        edges: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('at least one operator');
    });

    it('should reject node without id', () => {
      const result = validatePipeDefinition({
        nodes: [
          {
            type: 'fetch',
            position: { x: 0, y: 0 },
            data: { label: 'Test', config: {} },
          },
        ],
        edges: [],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('valid id'))).toBe(true);
    });

    it('should reject node without type', () => {
      const result = validatePipeDefinition({
        nodes: [
          {
            id: 'node-1',
            position: { x: 0, y: 0 },
            data: { label: 'Test', config: {} },
          },
        ],
        edges: [],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('valid type'))).toBe(true);
    });

    it('should reject node without position', () => {
      const result = validatePipeDefinition({
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            data: { label: 'Test', config: {} },
          },
        ],
        edges: [],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('valid position'))).toBe(true);
    });

    it('should reject node with invalid position coordinates', () => {
      const result = validatePipeDefinition({
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 'not a number', y: 0 },
            data: { label: 'Test', config: {} },
          },
        ],
        edges: [],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('valid position'))).toBe(true);
    });

    it('should reject node without data object', () => {
      const result = validatePipeDefinition({
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('valid data object'))).toBe(true);
    });

    it('should reject edge without id', () => {
      const result = validatePipeDefinition({
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 0, y: 0 },
            data: { label: 'Test', config: {} },
          },
        ],
        edges: [
          {
            source: 'node-1',
            target: 'node-2',
          },
        ],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('valid id'))).toBe(true);
    });

    it('should reject edge without source', () => {
      const result = validatePipeDefinition({
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 0, y: 0 },
            data: { label: 'Test', config: {} },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            target: 'node-1',
          },
        ],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('valid source'))).toBe(true);
    });

    it('should reject edge without target', () => {
      const result = validatePipeDefinition({
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 0, y: 0 },
            data: { label: 'Test', config: {} },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
          },
        ],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('valid target'))).toBe(true);
    });

    it('should reject edge with non-existent source node', () => {
      const result = validatePipeDefinition({
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 0, y: 0 },
            data: { label: 'Test', config: {} },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'non-existent',
            target: 'node-1',
          },
        ],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('does not exist'))).toBe(true);
    });

    it('should reject edge with non-existent target node', () => {
      const result = validatePipeDefinition({
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 0, y: 0 },
            data: { label: 'Test', config: {} },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'non-existent',
          },
        ],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('does not exist'))).toBe(true);
    });
  });

  describe('Valid definitions', () => {
    it('should accept valid single-node definition', () => {
      const definition: PipeDefinition = {
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 0, y: 0 },
            data: { label: 'Fetch', config: { url: 'https://example.com' } },
          },
        ],
        edges: [],
      };
      const result = validatePipeDefinition(definition);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid multi-node definition with edges', () => {
      const definition: PipeDefinition = {
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 0, y: 0 },
            data: { label: 'Fetch', config: { url: 'https://example.com' } },
          },
          {
            id: 'node-2',
            type: 'filter',
            position: { x: 200, y: 0 },
            data: { label: 'Filter', config: { rules: [] } },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
          },
        ],
      };
      const result = validatePipeDefinition(definition);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept definition with unknown operator type', () => {
      const definition: PipeDefinition = {
        nodes: [
          {
            id: 'node-1',
            type: 'unknown-operator',
            position: { x: 0, y: 0 },
            data: { label: 'Unknown', config: {} },
          },
        ],
        edges: [],
      };
      const result = validatePipeDefinition(definition);
      // Structure is valid, unknown operator type is handled by frontend
      expect(result.valid).toBe(true);
    });
  });

  describe('Operator configuration validation', () => {
    it('should reject fetch operator without URL', () => {
      const definition: PipeDefinition = {
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 0, y: 0 },
            data: { label: 'Fetch', config: {} },
          },
        ],
        edges: [],
      };
      const result = validatePipeDefinition(definition);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('URL is required'))).toBe(true);
    });

    it('should reject fetch operator with invalid URL', () => {
      const definition: PipeDefinition = {
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 0, y: 0 },
            data: { label: 'Fetch', config: { url: 'not a url' } },
          },
        ],
        edges: [],
      };
      const result = validatePipeDefinition(definition);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid URL'))).toBe(true);
    });

    it('should reject fetch operator with localhost URL', () => {
      const definition: PipeDefinition = {
        nodes: [
          {
            id: 'node-1',
            type: 'fetch',
            position: { x: 0, y: 0 },
            data: { label: 'Fetch', config: { url: 'http://localhost:3000' } },
          },
        ],
        edges: [],
      };
      const result = validatePipeDefinition(definition);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('localhost'))).toBe(true);
    });

    it('should reject sort operator without field', () => {
      const definition: PipeDefinition = {
        nodes: [
          {
            id: 'node-1',
            type: 'sort',
            position: { x: 0, y: 0 },
            data: { label: 'Sort', config: {} },
          },
        ],
        edges: [],
      };
      const result = validatePipeDefinition(definition);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Sort field is required'))).toBe(true);
    });

    it('should accept filter operator with empty rules (pass-through)', () => {
      const definition: PipeDefinition = {
        nodes: [
          {
            id: 'node-1',
            type: 'filter',
            position: { x: 0, y: 0 },
            data: { label: 'Filter', config: { rules: [] } },
          },
        ],
        edges: [],
      };
      const result = validatePipeDefinition(definition);
      expect(result.valid).toBe(true);
    });
  });
});

describe('formatValidationErrors', () => {
  it('should return empty string for no errors', () => {
    const result = formatValidationErrors([]);
    expect(result).toBe('');
  });

  it('should format single error', () => {
    const errors: ValidationError[] = [
      {
        nodeId: 'node-1',
        field: 'url',
        message: 'URL is required',
        operatorType: 'fetch',
        operatorLabel: 'Fetch Operator',
      },
    ];
    const result = formatValidationErrors(errors);
    expect(result).toContain('Fetch Operator');
    expect(result).toContain('URL is required');
  });

  it('should format multiple errors grouped by operator', () => {
    const errors: ValidationError[] = [
      {
        nodeId: 'node-1',
        field: 'url',
        message: 'URL is required',
        operatorType: 'fetch',
        operatorLabel: 'Fetch Operator',
      },
      {
        nodeId: 'node-2',
        field: 'field',
        message: 'Sort field is required',
        operatorType: 'sort',
        operatorLabel: 'Sort Operator',
      },
    ];
    const result = formatValidationErrors(errors);
    expect(result).toContain('Fetch Operator');
    expect(result).toContain('Sort Operator');
    expect(result).toContain('URL is required');
    expect(result).toContain('Sort field is required');
  });
});
