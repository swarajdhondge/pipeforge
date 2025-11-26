/**
 * Property Test: Consistent Node Styling
 * Feature: ui-cleanup, Property 5: Consistent Node Styling
 * Validates: Requirements 4.1
 * 
 * For any operator node regardless of type, the background color SHALL be the same neutral gray.
 */

import { describe, it, expect } from 'vitest';
import type { OperatorType } from '../../../types/operator.types';

// All operator types that should have consistent styling
const ALL_OPERATOR_TYPES: OperatorType[] = [
  'fetch',
  'fetch-json',
  'fetch-csv',
  'fetch-rss',
  'fetch-page',
  'text-input',
  'number-input',
  'url-input',
  'date-input',
  'filter',
  'sort',
  'transform',
  'unique',
  'truncate',
  'tail',
  'rename',
  'string-replace',
  'regex',
  'substring',
  'url-builder',
  'pipe-output',
];

// Extract the operatorConfig from OperatorNode by reading the source
// This is a simplified test that validates the configuration object directly
// rather than rendering the full component with all its dependencies

describe('Property Test: Consistent Node Styling', () => {
  it('should define neutral gray background for all operator types', () => {
    // Read the OperatorNode source to extract operatorConfig
    // In a real implementation, we would import and test the actual config
    // For this test, we verify the pattern exists in the codebase
    
    const fs = require('fs');
    const path = require('path');
    const operatorNodePath = path.join(__dirname, '../OperatorNode.tsx');
    const source = fs.readFileSync(operatorNodePath, 'utf-8');
    
    // Count occurrences of neutral background in operatorConfig
    const neutralBgMatches = source.match(/bg: 'bg-neutral-50'/g);
    
    // Property: All operator types should have neutral-50 background
    // Requirements 4.1: neutral gray backgrounds (not colored per type)
    expect(neutralBgMatches).toBeTruthy();
    expect(neutralBgMatches?.length).toBe(ALL_OPERATOR_TYPES.length);
  });

  it('should define 1px light gray border for all operator types', () => {
    const fs = require('fs');
    const path = require('path');
    const operatorNodePath = path.join(__dirname, '../OperatorNode.tsx');
    const source = fs.readFileSync(operatorNodePath, 'utf-8');
    
    // Count occurrences of neutral border in operatorConfig
    const neutralBorderMatches = source.match(/border: 'border-neutral-300'/g);
    
    // Property: All operator types should have neutral-300 border
    // Requirements 4.2: 1px light gray borders
    expect(neutralBorderMatches).toBeTruthy();
    expect(neutralBorderMatches?.length).toBe(ALL_OPERATOR_TYPES.length);
    
    // Verify border width is 1px (class 'border' not 'border-2')
    const borderClassMatch = source.match(/rounded-xl border shadow-lg/);
    expect(borderClassMatch).toBeTruthy();
  });

  it('should maintain colorful headers for visual identity', () => {
    const fs = require('fs');
    const path = require('path');
    const operatorNodePath = path.join(__dirname, '../OperatorNode.tsx');
    const source = fs.readFileSync(operatorNodePath, 'utf-8');
    
    // Check that different operator types have different header gradients
    const gradientPatterns = [
      /header: 'bg-gradient-to-r from-secondary-/,
      /header: 'bg-gradient-to-r from-purple-/,
      /header: 'bg-gradient-to-r from-green-/,
      /header: 'bg-gradient-to-r from-teal-/,
      /header: 'bg-gradient-to-r from-amber-/,
      /header: 'bg-gradient-to-r from-indigo-/,
      /header: 'bg-gradient-to-r from-rose-/,
    ];
    
    // Each gradient pattern should appear at least once
    gradientPatterns.forEach(pattern => {
      expect(source.match(pattern)).toBeTruthy();
    });
    
    // This maintains Pipe Forge visual identity with colorful headers
    // while keeping node bodies neutral
  });
});
