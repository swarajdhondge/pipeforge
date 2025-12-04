/**
 * User Experience Tracker
 * Tracks user experience level based on pipes created
 * Used for progressive disclosure of advanced operators
 */

const USER_EXPERIENCE_KEY = 'pipe_forge_user_experience';
const ADVANCED_USER_THRESHOLD = 5; // Show advanced operators after 5+ pipes

export interface UserExperience {
  pipesCreated: number;
  lastUpdated: number;
}

/**
 * Get user experience data from localStorage
 */
export function getUserExperience(): UserExperience {
  try {
    const data = localStorage.getItem(USER_EXPERIENCE_KEY);
    if (!data) {
      return { pipesCreated: 0, lastUpdated: Date.now() };
    }
    
    const parsed = JSON.parse(data);
    
    // Validate structure
    if (
      typeof parsed === 'object' &&
      typeof parsed.pipesCreated === 'number' &&
      typeof parsed.lastUpdated === 'number'
    ) {
      return parsed;
    }
    
    // Invalid structure, return default
    return { pipesCreated: 0, lastUpdated: Date.now() };
  } catch (error) {
    console.error('Error loading user experience data:', error);
    return { pipesCreated: 0, lastUpdated: Date.now() };
  }
}

/**
 * Increment pipes created count
 */
export function incrementPipesCreated(): void {
  try {
    const experience = getUserExperience();
    experience.pipesCreated += 1;
    experience.lastUpdated = Date.now();
    
    localStorage.setItem(USER_EXPERIENCE_KEY, JSON.stringify(experience));
  } catch (error) {
    console.error('Error incrementing pipes created:', error);
  }
}

/**
 * Check if user is an advanced user (5+ pipes created)
 */
export function isAdvancedUser(): boolean {
  const experience = getUserExperience();
  return experience.pipesCreated >= ADVANCED_USER_THRESHOLD;
}

/**
 * Get pipes remaining until advanced user status
 */
export function getPipesUntilAdvanced(): number {
  const experience = getUserExperience();
  const remaining = ADVANCED_USER_THRESHOLD - experience.pipesCreated;
  return Math.max(0, remaining);
}

/**
 * Reset user experience (for testing or user request)
 */
export function resetUserExperience(): void {
  try {
    localStorage.removeItem(USER_EXPERIENCE_KEY);
  } catch (error) {
    console.error('Error resetting user experience:', error);
  }
}
