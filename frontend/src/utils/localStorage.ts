/**
 * localStorage utility functions for managing drafts and cleanup
 */

const DRAFTS_KEY = 'pipe_forge_drafts';
const MAX_DRAFT_AGE_DAYS = 30;

interface DraftPipe {
  id: string;
  name: string;
  definition: {
    nodes: any[];
    edges: any[];
  };
  timestamp: number;
  operatorCount: number;
}

/**
 * Clean up old drafts (older than 30 days)
 */
export function cleanupOldDrafts(): number {
  try {
    const drafts = getDraftsFromStorage();
    if (drafts.length === 0) return 0;

    const cutoffTime = Date.now() - (MAX_DRAFT_AGE_DAYS * 24 * 60 * 60 * 1000);
    const validDrafts = drafts.filter(draft => draft.timestamp > cutoffTime);
    
    const removedCount = drafts.length - validDrafts.length;
    
    if (removedCount > 0) {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(validDrafts));
    }
    
    return removedCount;
  } catch (error) {
    console.error('Error cleaning up old drafts:', error);
    return 0;
  }
}

/**
 * Validate draft structure
 */
export function validateDraft(draft: any): draft is DraftPipe {
  return (
    draft &&
    typeof draft === 'object' &&
    typeof draft.id === 'string' &&
    typeof draft.name === 'string' &&
    draft.definition &&
    Array.isArray(draft.definition.nodes) &&
    Array.isArray(draft.definition.edges) &&
    typeof draft.timestamp === 'number' &&
    typeof draft.operatorCount === 'number'
  );
}

/**
 * Get draft count
 */
export function getDraftCount(): number {
  try {
    const drafts = getDraftsFromStorage();
    return drafts.length;
  } catch (error) {
    console.error('Error getting draft count:', error);
    return 0;
  }
}

/**
 * Get total size of drafts in localStorage (in bytes)
 */
export function getDraftsTotalSize(): number {
  try {
    const draftsString = localStorage.getItem(DRAFTS_KEY);
    if (!draftsString) return 0;
    
    // Calculate size in bytes (UTF-16, so 2 bytes per character)
    return new Blob([draftsString]).size;
  } catch (error) {
    console.error('Error calculating drafts size:', error);
    return 0;
  }
}

/**
 * Get drafts from localStorage with validation
 */
function getDraftsFromStorage(): DraftPipe[] {
  try {
    const draftsString = localStorage.getItem(DRAFTS_KEY);
    if (!draftsString) return [];
    
    const parsed = JSON.parse(draftsString);
    if (!Array.isArray(parsed)) return [];
    
    // Filter out invalid drafts
    return parsed.filter(validateDraft);
  } catch (error) {
    console.error('Error loading drafts from localStorage:', error);
    return [];
  }
}

/**
 * Check if localStorage is available and working
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get localStorage usage info
 */
export function getLocalStorageInfo(): {
  available: boolean;
  draftCount: number;
  draftsSize: number;
  draftsSizeFormatted: string;
} {
  const available = isLocalStorageAvailable();
  const draftCount = getDraftCount();
  const draftsSize = getDraftsTotalSize();
  
  // Format size
  let draftsSizeFormatted: string;
  if (draftsSize < 1024) {
    draftsSizeFormatted = `${draftsSize} B`;
  } else if (draftsSize < 1024 * 1024) {
    draftsSizeFormatted = `${(draftsSize / 1024).toFixed(2)} KB`;
  } else {
    draftsSizeFormatted = `${(draftsSize / (1024 * 1024)).toFixed(2)} MB`;
  }
  
  return {
    available,
    draftCount,
    draftsSize,
    draftsSizeFormatted,
  };
}

/**
 * Initialize localStorage cleanup on app start
 */
export function initializeLocalStorage(): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }
  
  // Clean up old drafts
  cleanupOldDrafts();
}
