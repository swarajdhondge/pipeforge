/**
 * Output Size Limiter
 * 
 * Enforces maximum output size limits for operator results.
 * Truncates arrays if needed to stay within limits.
 * 
 * Requirements: 17.6
 */

/**
 * Maximum output size in bytes (1MB)
 */
export const MAX_OUTPUT_SIZE = 1 * 1024 * 1024;

/**
 * Result of output size enforcement
 */
export interface OutputLimitResult {
  /** The (possibly truncated) output */
  output: any;
  /** Whether the output was truncated */
  truncated: boolean;
  /** Original size in bytes */
  originalSize: number;
  /** Final size in bytes */
  finalSize: number;
  /** Original item count (for arrays) */
  originalCount?: number;
  /** Final item count (for arrays) */
  finalCount?: number;
}

/**
 * Enforce output size limit on operator result
 * 
 * @param output - The operator output to check
 * @param maxSize - Maximum size in bytes (default: 1MB)
 * @returns The output with truncation info if needed
 */
export function enforceOutputLimit(
  output: any,
  maxSize: number = MAX_OUTPUT_SIZE
): OutputLimitResult {
  // Handle null/undefined
  if (output === null || output === undefined) {
    return {
      output,
      truncated: false,
      originalSize: 0,
      finalSize: 0,
    };
  }

  // Calculate original size
  const originalJson = JSON.stringify(output);
  const originalSize = Buffer.byteLength(originalJson, 'utf8');

  // If within limit, return as-is
  if (originalSize <= maxSize) {
    return {
      output,
      truncated: false,
      originalSize,
      finalSize: originalSize,
    };
  }

  // Try to truncate if it's an array
  if (Array.isArray(output)) {
    return truncateArray(output, maxSize, originalSize);
  }

  // For non-arrays that exceed limit, we can't truncate safely
  // Return a truncation notice instead
  return {
    output: {
      _truncated: true,
      _error: 'Output truncated: Data exceeded 1MB limit',
      _originalSize: originalSize,
      _maxSize: maxSize,
    },
    truncated: true,
    originalSize,
    finalSize: Buffer.byteLength(JSON.stringify({
      _truncated: true,
      _error: 'Output truncated: Data exceeded 1MB limit',
      _originalSize: originalSize,
      _maxSize: maxSize,
    }), 'utf8'),
  };
}

/**
 * Truncate an array to fit within size limit
 * Uses binary search to find optimal truncation point
 */
function truncateArray(
  arr: any[],
  maxSize: number,
  originalSize: number
): OutputLimitResult {
  const originalCount = arr.length;
  
  // Binary search for the right number of items
  let low = 0;
  let high = arr.length;
  let bestCount = 0;
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const slice = arr.slice(0, mid);
    const sliceJson = JSON.stringify(slice);
    const sliceSize = Buffer.byteLength(sliceJson, 'utf8');
    
    if (sliceSize <= maxSize) {
      bestCount = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  // If we can't fit even one item, return empty array with notice
  if (bestCount === 0) {
    const emptyResult = {
      _truncated: true,
      _error: 'Output truncated: Individual items exceed 1MB limit',
      _originalCount: originalCount,
      _originalSize: originalSize,
      data: [],
    };
    
    return {
      output: emptyResult,
      truncated: true,
      originalSize,
      finalSize: Buffer.byteLength(JSON.stringify(emptyResult), 'utf8'),
      originalCount,
      finalCount: 0,
    };
  }
  
  const truncatedArray = arr.slice(0, bestCount);
  const finalJson = JSON.stringify(truncatedArray);
  const finalSize = Buffer.byteLength(finalJson, 'utf8');
  
  // If we truncated, wrap with metadata
  if (bestCount < originalCount) {
    const wrappedResult = {
      _truncated: true,
      _originalCount: originalCount,
      _returnedCount: bestCount,
      _warning: `Output truncated: Data exceeded 1MB limit. Showing ${bestCount} of ${originalCount} items.`,
      data: truncatedArray,
    };
    
    return {
      output: wrappedResult,
      truncated: true,
      originalSize,
      finalSize: Buffer.byteLength(JSON.stringify(wrappedResult), 'utf8'),
      originalCount,
      finalCount: bestCount,
    };
  }
  
  return {
    output: truncatedArray,
    truncated: false,
    originalSize,
    finalSize,
    originalCount,
    finalCount: bestCount,
  };
}

/**
 * Check if output exceeds size limit without modifying it
 * 
 * @param output - The output to check
 * @param maxSize - Maximum size in bytes
 * @returns True if output exceeds limit
 */
export function exceedsOutputLimit(
  output: any,
  maxSize: number = MAX_OUTPUT_SIZE
): boolean {
  if (output === null || output === undefined) {
    return false;
  }
  
  try {
    const json = JSON.stringify(output);
    const size = Buffer.byteLength(json, 'utf8');
    return size > maxSize;
  } catch {
    // If we can't serialize, assume it's too large
    return true;
  }
}

/**
 * Get the size of an output in bytes
 * 
 * @param output - The output to measure
 * @returns Size in bytes, or -1 if unable to measure
 */
export function getOutputSize(output: any): number {
  if (output === null || output === undefined) {
    return 0;
  }
  
  try {
    const json = JSON.stringify(output);
    return Buffer.byteLength(json, 'utf8');
  } catch {
    return -1;
  }
}
