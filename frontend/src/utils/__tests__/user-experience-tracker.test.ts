import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUserExperience,
  incrementPipesCreated,
  isAdvancedUser,
  getPipesUntilAdvanced,
  resetUserExperience,
} from '../user-experience-tracker';

describe('User Experience Tracker', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should return default experience for new users', () => {
    const experience = getUserExperience();
    expect(experience.pipesCreated).toBe(0);
    expect(experience.lastUpdated).toBeDefined();
  });

  it('should increment pipes created count', () => {
    incrementPipesCreated();
    const experience = getUserExperience();
    expect(experience.pipesCreated).toBe(1);

    incrementPipesCreated();
    const experience2 = getUserExperience();
    expect(experience2.pipesCreated).toBe(2);
  });

  it('should identify new users as not advanced', () => {
    expect(isAdvancedUser()).toBe(false);
  });

  it('should identify users with 5+ pipes as advanced', () => {
    // Create 5 pipes
    for (let i = 0; i < 5; i++) {
      incrementPipesCreated();
    }
    expect(isAdvancedUser()).toBe(true);
  });

  it('should calculate pipes remaining until advanced', () => {
    expect(getPipesUntilAdvanced()).toBe(5);

    incrementPipesCreated();
    expect(getPipesUntilAdvanced()).toBe(4);

    incrementPipesCreated();
    expect(getPipesUntilAdvanced()).toBe(3);

    // Create 3 more to reach 5
    for (let i = 0; i < 3; i++) {
      incrementPipesCreated();
    }
    expect(getPipesUntilAdvanced()).toBe(0);
  });

  it('should reset user experience', () => {
    incrementPipesCreated();
    incrementPipesCreated();
    expect(getUserExperience().pipesCreated).toBe(2);

    resetUserExperience();
    expect(getUserExperience().pipesCreated).toBe(0);
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('pipe_forge_user_experience', 'invalid json');
    const experience = getUserExperience();
    expect(experience.pipesCreated).toBe(0);
  });

  it('should handle missing fields in localStorage data', () => {
    localStorage.setItem('pipe_forge_user_experience', JSON.stringify({ invalid: 'data' }));
    const experience = getUserExperience();
    expect(experience.pipesCreated).toBe(0);
  });
});
