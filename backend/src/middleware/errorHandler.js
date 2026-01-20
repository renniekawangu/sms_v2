/**
 * Comprehensive error handling middleware
 */

const logger = require('../utils/logger');

/**
 * Async wrapper to catch errors in route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  logger.error(`${status} ${message}`, {
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    stack: err.stack
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose cast error (ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      field: err.path
    });
  }

  // MongoDB connection/buffering timeout errors
  if (err.name === 'MongooseError' && err.message && err.message.includes('buffering timed out')) {
    return res.status(503).json({
      success: false,
      message: 'Database connection timeout. Please check your MongoDB connection.',
      error: 'Database unavailable'
    });
  }

  // MongoDB server selection errors
  if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkTimeoutError') {
    return res.status(503).json({
      success: false,
      message: 'Cannot connect to database. Please check your MongoDB connection settings.',
      error: 'Database connection failed'
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      field
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Generic error response
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    path: req.path,
    method: req.method
  });
};

module.exports = { asyncHandler, errorHandler, notFoundHandler };
