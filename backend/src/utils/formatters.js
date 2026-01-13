/**
 * Utility functions for safe data formatting
 * Prevents errors from null/undefined/NaN values
 */

/**
 * Safely format a grade/percentage value
 * @param {number|null|undefined} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @param {string} suffix - Suffix to add (default: '%')
 * @returns {string} Formatted value or '—' if invalid
 */
function formatGrade(value, decimals = 1, suffix = '%') {
  if (value == null || isNaN(value) || typeof value !== 'number') {
    return '—';
  }
  return value.toFixed(decimals) + suffix;
}

/**
 * Safely format a currency value
 * @param {number|null|undefined} value - The value to format
 * @param {string} currency - Currency symbol (default: 'K')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted value or '—' if invalid
 */
function formatCurrency(value, currency = 'K', decimals = 2) {
  if (value == null || isNaN(value) || typeof value !== 'number') {
    return '—';
  }
  return currency + value.toFixed(decimals);
}

/**
 * Safely format a date
 * @param {Date|string|null|undefined} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date or '—' if invalid
 */
function formatDate(date, options = {}) {
  if (!date) return '—';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '—';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    return dateObj.toLocaleDateString('en-US', defaultOptions);
  } catch (e) {
    return '—';
  }
}

/**
 * Safely format a datetime
 * @param {Date|string|null|undefined} date - The date to format
 * @returns {string} Formatted datetime or '—' if invalid
 */
function formatDateTime(date) {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Safely format a number
 * @param {number|null|undefined} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted value or '—' if invalid
 */
function formatNumber(value, decimals = 0) {
  if (value == null || isNaN(value) || typeof value !== 'number') {
    return '—';
  }
  return value.toFixed(decimals);
}

/**
 * Get a safe string value or default
 * @param {any} value - The value to check
 * @param {string} defaultValue - Default if value is invalid
 * @returns {string} Safe string value
 */
function safeString(value, defaultValue = '—') {
  if (value == null || value === undefined) return defaultValue;
  return String(value);
}

/**
 * Calculate percentage safely
 * @param {number} part - The part value
 * @param {number} total - The total value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Percentage or '—' if invalid
 */
function calculatePercentage(part, total, decimals = 1) {
  if (part == null || total == null || isNaN(part) || isNaN(total) || total === 0) {
    return '—';
  }
  return formatGrade((part / total) * 100, decimals);
}

module.exports = {
  formatGrade,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  safeString,
  calculatePercentage
};
