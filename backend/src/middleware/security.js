/**
 * Security middleware
 * Adds security headers and CSRF protection
 */

/**
 * Add security headers to responses
 */
function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';"
    );
  }
  
  // Strict Transport Security (HTTPS only)
  if (isProd && process.env.SESSION_SECURE === 'true') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * CSRF protection middleware
 */
function csrfProtection(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Generate token if not exists
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }

  // Expose token to views
  res.locals.csrfToken = req.session.csrfToken;

  // Check token for POST/PUT/DELETE/PATCH
  const token = req.body._csrf || req.headers['x-csrf-token'];
  
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({
      error: 'Invalid CSRF token. Please refresh the page and try again.'
    });
  }

  next();
}

/**
 * Input sanitization middleware
 * Basic XSS prevention
 */
function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
}

/**
 * Password strength validator
 */
function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  securityHeaders,
  csrfProtection,
  sanitizeInput,
  generateCSRFToken,
  validatePasswordStrength
};
