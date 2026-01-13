/**
 * Rate limiting middleware
 * Prevents brute force attacks and API abuse
 */

// Simple in-memory store for rate limiting
// In production, use Redis for distributed systems
const rateLimitStore = new Map();

/**
 * Rate limiter middleware
 * @param {object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.max - Maximum requests per window (default: 100)
 * @param {string} options.message - Error message (default: 'Too many requests')
 * @param {boolean} options.skipSuccessfulRequests - Don't count successful requests (default: false)
 */
function rateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false
  } = options;

  return (req, res, next) => {
    // Get client identifier (IP address or user ID)
    const identifier = req.session?.user?.id || req.ip || req.connection.remoteAddress;
    const key = `${identifier}:${req.path}`;
    const now = Date.now();

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [k, v] of rateLimitStore.entries()) {
        if (now - v.resetTime > windowMs) {
          rateLimitStore.delete(k);
        }
      }
    }

    // Get or create rate limit record
    let record = rateLimitStore.get(key);
    
    if (!record || now - record.resetTime > windowMs) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // Check if limit exceeded
    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
      
      return res.status(429).json({
        error: message,
        retryAfter
      });
    }

    // Increment counter
    record.count++;
    rateLimitStore.set(key, record);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    // If skipping successful requests, decrement on success
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode < 400) {
          record.count = Math.max(0, record.count - 1);
          rateLimitStore.set(key, record);
        }
        return originalSend.call(this, data);
      };
    }

    next();
  };
}

/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per 15 minutes
  message: 'Too many login attempts. Please try again in 15 minutes.',
  skipSuccessfulRequests: true
});

/**
 * API rate limiter
 */
const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'API rate limit exceeded.'
});

module.exports = {
  rateLimiter,
  authRateLimiter,
  apiRateLimiter
};
