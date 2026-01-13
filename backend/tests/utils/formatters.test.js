/**
 * Tests for formatter utilities
 */

const {
  formatGrade,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  safeString,
  calculatePercentage
} = require('../../utils/formatters');

describe('Formatter Utilities', () => {
  describe('formatGrade', () => {
    test('should format valid number', () => {
      expect(formatGrade(85.5)).toBe('85.5%');
      expect(formatGrade(100)).toBe('100.0%');
    });

    test('should handle null/undefined', () => {
      expect(formatGrade(null)).toBe('—');
      expect(formatGrade(undefined)).toBe('—');
    });

    test('should handle NaN', () => {
      expect(formatGrade(NaN)).toBe('—');
    });

    test('should handle custom decimals and suffix', () => {
      expect(formatGrade(85.567, 2, 'pts')).toBe('85.57pts');
    });
  });

  describe('formatCurrency', () => {
    test('should format valid number', () => {
      expect(formatCurrency(1000.50)).toBe('K1000.50');
      expect(formatCurrency(500, 'USD')).toBe('USD500.00');
    });

    test('should handle invalid values', () => {
      expect(formatCurrency(null)).toBe('—');
      expect(formatCurrency(undefined)).toBe('—');
      expect(formatCurrency(NaN)).toBe('—');
    });
  });

  describe('formatDate', () => {
    test('should format valid date', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toContain('Jan');
      expect(formatDate(date)).toContain('2024');
    });

    test('should handle invalid dates', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate('invalid')).toBe('—');
    });
  });

  describe('formatNumber', () => {
    test('should format valid number', () => {
      expect(formatNumber(123.456, 2)).toBe('123.46');
      expect(formatNumber(100)).toBe('100');
    });

    test('should handle invalid values', () => {
      expect(formatNumber(null)).toBe('—');
      expect(formatNumber(undefined)).toBe('—');
      expect(formatNumber(NaN)).toBe('—');
    });
  });

  describe('safeString', () => {
    test('should convert to string', () => {
      expect(safeString(123)).toBe('123');
      expect(safeString(true)).toBe('true');
    });

    test('should return default for null/undefined', () => {
      expect(safeString(null)).toBe('—');
      expect(safeString(null, 'N/A')).toBe('N/A');
    });
  });

  describe('calculatePercentage', () => {
    test('should calculate percentage', () => {
      expect(calculatePercentage(25, 100)).toBe('25.0%');
      expect(calculatePercentage(1, 3, 2)).toBe('33.33%');
    });

    test('should handle invalid values', () => {
      expect(calculatePercentage(null, 100)).toBe('—');
      expect(calculatePercentage(25, 0)).toBe('—');
      expect(calculatePercentage(25, null)).toBe('—');
    });
  });
});
