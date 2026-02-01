/**
 * Validation Utilities
 * Provides common validation functions for API endpoints
 */

/**
 * Validate required fields in request body
 */
function validateRequiredFields(data, fields) {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`
    };
  }
  return { valid: true };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate date format (ISO 8601)
 */
function validateDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate numeric range
 */
function validateNumericRange(value, min, max) {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
}

/**
 * Validate enum value
 */
function validateEnum(value, allowedValues) {
  return allowedValues.includes(value);
}

/**
 * Sanitize string input (remove excess whitespace)
 */
function sanitizeString(str) {
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Validate ObjectId format - throws error if invalid
 */
function validateObjectId(id) {
  if (!id || typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id)) {
    const error = new Error(`Invalid ObjectId format: ${id}`);
    error.status = 400;
    throw error;
  }
  return true;
}

module.exports = {
  validateRequiredFields,
  validateEmail,
  validateDate,
  validateNumericRange,
  validateEnum,
  sanitizeString,
  validateObjectId
};
