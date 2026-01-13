/**
 * Access Logger Middleware
 * Captures request/response metadata for audit visibility
 */
const logger = require('../utils/logger');

function accessLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const meta = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userId: req.user?.id || null,
      role: req.user?.role || 'guest',
      ip: req.ip
    };

    logger.info('access', meta);
  });

  next();
}

module.exports = accessLogger;
