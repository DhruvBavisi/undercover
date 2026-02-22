
import { describe, it, expect } from 'vitest';
import { 
  getRecommendedRoles, 
  calculateRounds, 
  getMaxUndercover, 
  getMaxMrWhite,
  getMinCivilians
} from './roleDistribution';

describe('Role Distribution Logic', () => {
  describe('getRecommendedRoles', () => {
    it('should return correct roles for 3 players', () => {
      const result = getRecommendedRoles(3);
      expect(result).toEqual({ undercover: 1, mrWhite: 0 });
    });

    it('should return correct roles for 5 players', () => {
      const result = getRecommendedRoles(5);
      expect(result).toEqual({ undercover: 1, mrWhite: 1 });
    });

    it('should return correct roles for 7 players', () => {
      const result = getRecommendedRoles(7);
      expect(result).toEqual({ undercover: 2, mrWhite: 1 });
    });

    it('should return correct roles for 10 players', () => {
      const result = getRecommendedRoles(10);
      expect(result).toEqual({ undercover: 3, mrWhite: 1 });
    });

    it('should return correct roles for 20 players', () => {
      const result = getRecommendedRoles(20);
      expect(result).toEqual({ undercover: 6, mrWhite: 3 });
    });
  });

  describe('calculateRounds', () => {
    it('should return count - 2 for standard cases', () => {
      expect(calculateRounds(5)).toBe(3);
      expect(calculateRounds(10)).toBe(8);
    });

    it('should return minimum 1 round', () => {
      expect(calculateRounds(3)).toBe(1);
      // Even if logic allows <3 input, it should be robust
      expect(calculateRounds(2)).toBe(1); 
    });
  });

  describe('Role Limits', () => {
    it('should return correct max undercover count', () => {
      expect(getMaxUndercover(3)).toBe(1);
      expect(getMaxUndercover(5)).toBe(2);
      expect(getMaxUndercover(20)).toBe(9);
    });

    it('should return correct max Mr. White count', () => {
      expect(getMaxMrWhite(3)).toBe(1);
      expect(getMaxMrWhite(5)).toBe(2);
      expect(getMaxMrWhite(20)).toBe(9);
    });

    it('should return correct min civilians count', () => {
        expect(getMinCivilians(3)).toBe(2); // ceil(3/2) = 2
        expect(getMinCivilians(4)).toBe(2); // ceil(4/2) = 2
        expect(getMinCivilians(5)).toBe(3); // ceil(5/2) = 3
    });
  });
});
