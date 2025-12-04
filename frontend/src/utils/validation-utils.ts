/**
 * Pre-execution validation utilities for pipe definitions
 * 
 * Validates operator configurations before sending to backend
 * to provide immediate feedback to users.
 */

export interface ValidationError {
  nodeId: string;
  field: string;
  message: string;
  operatorType: string;
  operatorLabel: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface OperatorNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    config: any;
  };
}

export interface PipeDefinition {
  nodes: OperatorNode[];
  edges: Array<{ id: string; source: string; target: string }>;
}

/**
 * Validate a complete pipe definition before execution
 * 
 * @param definition - The pipe definition to validate
 * @returns Validation result with any errors found
 */
export function validatePipeDefinition(definition: PipeDefinition): ValidationResult {
  const errors: ValidationError[] = [];

  // Requirement 19.4: Validate pipe definition structure on load
  // Check if definition exists and has required structure
  if (!definition || typeof definition !== 'object') {
    return {
      valid: false,
      errors: [{
        nodeId: '',
        field: 'definition',
        message: 'Invalid pipe definition: definition must be an object',
        operatorType: '',
        operatorLabel: '',
      }],
    };
  }

  // Check if nodes array exists and is valid
  if (!Array.isArray(definition.nodes)) {
    return {
      valid: false,
      errors: [{
        nodeId: '',
        field: 'nodes',
        message: 'Invalid pipe definition: nodes must be an array',
        operatorType: '',
        operatorLabel: '',
      }],
    };
  }

  // Check if edges array exists and is valid
  if (!Array.isArray(definition.edges)) {
    return {
      valid: false,
      errors: [{
        nodeId: '',
        field: 'edges',
        message: 'Invalid pipe definition: edges must be an array',
        operatorType: '',
        operatorLabel: '',
      }],
    };
  }

  // Check if canvas has at least one operator
  if (definition.nodes.length === 0) {
    return {
      valid: false,
      errors: [{
        nodeId: '',
        field: 'canvas',
        message: 'Canvas must have at least one operator',
        operatorType: '',
        operatorLabel: '',
      }],
    };
  }

  // Validate each node has required fields
  for (const node of definition.nodes) {
    if (!node.id || typeof node.id !== 'string') {
      errors.push({
        nodeId: '',
        field: 'nodes',
        message: 'Invalid node: each node must have a valid id',
        operatorType: '',
        operatorLabel: '',
      });
      continue;
    }

    if (!node.type || typeof node.type !== 'string') {
      errors.push({
        nodeId: node.id,
        field: 'type',
        message: 'Invalid node: node must have a valid type',
        operatorType: '',
        operatorLabel: node.data?.label || node.id,
      });
      continue;
    }

    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      errors.push({
        nodeId: node.id,
        field: 'position',
        message: 'Invalid node: node must have valid position coordinates',
        operatorType: node.type,
        operatorLabel: node.data?.label || node.id,
      });
      continue;
    }

    if (!node.data || typeof node.data !== 'object') {
      errors.push({
        nodeId: node.id,
        field: 'data',
        message: 'Invalid node: node must have valid data object',
        operatorType: node.type,
        operatorLabel: (node.data as any)?.label || node.id,
      });
      continue;
    }
  }

  // Validate each edge has required fields
  for (const edge of definition.edges) {
    if (!edge.id || typeof edge.id !== 'string') {
      errors.push({
        nodeId: '',
        field: 'edges',
        message: 'Invalid edge: each edge must have a valid id',
        operatorType: '',
        operatorLabel: '',
      });
      continue;
    }

    if (!edge.source || typeof edge.source !== 'string') {
      errors.push({
        nodeId: '',
        field: 'edges',
        message: `Invalid edge ${edge.id}: edge must have a valid source node id`,
        operatorType: '',
        operatorLabel: '',
      });
      continue;
    }

    if (!edge.target || typeof edge.target !== 'string') {
      errors.push({
        nodeId: '',
        field: 'edges',
        message: `Invalid edge ${edge.id}: edge must have a valid target node id`,
        operatorType: '',
        operatorLabel: '',
      });
      continue;
    }

    // Check if source and target nodes exist
    const sourceNodeExists = definition.nodes.some(n => n.id === edge.source);
    const targetNodeExists = definition.nodes.some(n => n.id === edge.target);

    if (!sourceNodeExists) {
      errors.push({
        nodeId: '',
        field: 'edges',
        message: `Invalid edge ${edge.id}: source node "${edge.source}" does not exist`,
        operatorType: '',
        operatorLabel: '',
      });
    }

    if (!targetNodeExists) {
      errors.push({
        nodeId: '',
        field: 'edges',
        message: `Invalid edge ${edge.id}: target node "${edge.target}" does not exist`,
        operatorType: '',
        operatorLabel: '',
      });
    }
  }

  // If there are structural errors, return early
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  // Validate each operator's configuration
  for (const node of definition.nodes) {
    const nodeErrors = validateOperator(node);
    errors.push(...nodeErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single operator node
 * 
 * @param node - The operator node to validate
 * @returns Array of validation errors for this node
 */
export function validateOperator(node: OperatorNode): ValidationError[] {
  const errors: ValidationError[] = [];
  const config = node.data?.config || {};
  const label = node.data?.label || node.type;

  switch (node.type) {
    case 'fetch':
      errors.push(...validateFetchOperator(node.id, config, label));
      break;
    case 'filter':
      errors.push(...validateFilterOperator(node.id, config, label));
      break;
    case 'sort':
      errors.push(...validateSortOperator(node.id, config, label));
      break;
    case 'transform':
      errors.push(...validateTransformOperator(node.id, config, label));
      break;
    default:
      // Unknown operator type - let backend handle it
      break;
  }

  return errors;
}


/**
 * Validate Fetch operator configuration
 */
function validateFetchOperator(
  nodeId: string,
  config: any,
  label: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // URL is required
  if (!config.url || typeof config.url !== 'string' || config.url.trim() === '') {
    errors.push({
      nodeId,
      field: 'url',
      message: 'URL is required',
      operatorType: 'fetch',
      operatorLabel: label,
    });
    return errors; // No point validating format if URL is missing
  }

  // Validate URL format
  try {
    const url = new URL(config.url);
    
    // Check for localhost/private IPs (will be rejected by backend anyway)
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.2') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.')
    ) {
      errors.push({
        nodeId,
        field: 'url',
        message: 'Cannot fetch from localhost or private IP addresses',
        operatorType: 'fetch',
        operatorLabel: label,
      });
    }

    // Check protocol
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      errors.push({
        nodeId,
        field: 'url',
        message: 'URL must use http or https protocol',
        operatorType: 'fetch',
        operatorLabel: label,
      });
    }
  } catch {
    errors.push({
      nodeId,
      field: 'url',
      message: 'Invalid URL format',
      operatorType: 'fetch',
      operatorLabel: label,
    });
  }

  return errors;
}

/**
 * Validate Filter operator configuration
 * Note: Empty rules are allowed (pass-through behavior)
 */
function validateFilterOperator(
  nodeId: string,
  config: any,
  label: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Rules are optional - empty rules means pass-through
  if (!config.rules || !Array.isArray(config.rules) || config.rules.length === 0) {
    return errors; // Empty rules are valid (pass-through)
  }

  // Validate each rule
  config.rules.forEach((rule: any, index: number) => {
    if (!rule.field || typeof rule.field !== 'string' || rule.field.trim() === '') {
      errors.push({
        nodeId,
        field: `rules[${index}].field`,
        message: `Rule ${index + 1}: Field name is required`,
        operatorType: 'filter',
        operatorLabel: label,
      });
    }

    if (!rule.operator) {
      errors.push({
        nodeId,
        field: `rules[${index}].operator`,
        message: `Rule ${index + 1}: Operator is required`,
        operatorType: 'filter',
        operatorLabel: label,
      });
    }

    // Value can be empty for some operators, so we don't validate it strictly
  });

  return errors;
}

/**
 * Validate Sort operator configuration
 */
function validateSortOperator(
  nodeId: string,
  config: any,
  label: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Field is required
  if (!config.field || typeof config.field !== 'string' || config.field.trim() === '') {
    errors.push({
      nodeId,
      field: 'field',
      message: 'Sort field is required',
      operatorType: 'sort',
      operatorLabel: label,
    });
  }

  // Direction should be valid if provided
  if (config.direction && !['asc', 'desc'].includes(config.direction)) {
    errors.push({
      nodeId,
      field: 'direction',
      message: 'Sort direction must be "asc" or "desc"',
      operatorType: 'sort',
      operatorLabel: label,
    });
  }

  return errors;
}

/**
 * Validate Transform operator configuration
 * Note: Empty mappings are allowed (pass-through behavior)
 */
function validateTransformOperator(
  nodeId: string,
  config: any,
  label: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Mappings are optional - empty mappings means pass-through
  if (!config.mappings || !Array.isArray(config.mappings) || config.mappings.length === 0) {
    return errors; // Empty mappings are valid (pass-through)
  }

  // Validate each mapping
  config.mappings.forEach((mapping: any, index: number) => {
    if (!mapping.source || typeof mapping.source !== 'string' || mapping.source.trim() === '') {
      errors.push({
        nodeId,
        field: `mappings[${index}].source`,
        message: `Mapping ${index + 1}: Source field is required`,
        operatorType: 'transform',
        operatorLabel: label,
      });
    }

    if (!mapping.target || typeof mapping.target !== 'string' || mapping.target.trim() === '') {
      errors.push({
        nodeId,
        field: `mappings[${index}].target`,
        message: `Mapping ${index + 1}: Target field is required`,
        operatorType: 'transform',
        operatorLabel: label,
      });
    }
  });

  return errors;
}

/**
 * Format validation errors into a user-friendly summary
 * 
 * @param errors - Array of validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    const error = errors[0];
    return error.operatorLabel 
      ? `${error.operatorLabel}: ${error.message}`
      : error.message;
  }

  // Group errors by operator
  const byOperator = new Map<string, ValidationError[]>();
  errors.forEach(error => {
    const key = error.nodeId || 'general';
    if (!byOperator.has(key)) {
      byOperator.set(key, []);
    }
    byOperator.get(key)!.push(error);
  });

  const lines: string[] = [];
  byOperator.forEach((operatorErrors, _nodeId) => {
    const label = operatorErrors[0].operatorLabel || 'Unknown';
    const messages = operatorErrors.map(e => `  • ${e.message}`).join('\n');
    lines.push(`${label}:\n${messages}`);
  });

  return lines.join('\n\n');
}
