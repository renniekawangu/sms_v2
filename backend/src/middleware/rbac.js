/**
 * RBAC Middleware
 * Handles role-based access control and permission checking
 */
const jwt = require('jsonwebtoken');
const { ROLES, hasPermission, canAccessEndpoint } = require('../config/rbac');

/**
 * Verify JWT Token and extract user info
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
  } catch (err) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 */
const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
};

/**
 * Middleware to require authentication
 * Verifies JWT token and attaches user to request
 */
const requireAuth = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
};

/**
 * Middleware to require specific role(s)
 * @param {...string} allowedRoles - Role(s) that can access this endpoint
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admin can access everything
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    return next();
  };
};

/**
 * Middleware to require specific permission
 * @param {...string} requiredPermissions - Permission(s) required
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role;

    // Check if user has at least one of the required permissions
    const hasAnyPermission = requiredPermissions.some(permission =>
      hasPermission(userRole, permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient permissions',
        requiredPermissions,
        userRole
      });
    }

    return next();
  };
};

/**
 * Middleware to require endpoint access
 * Uses the ENDPOINT_ACCESS configuration
 */
const requireEndpointAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const endpoint = req.path;
  if (!canAccessEndpoint(req.user.role, endpoint)) {
    return res.status(403).json({
      error: 'Forbidden: No access to this endpoint',
      endpoint,
      userRole: req.user.role
    });
  }

  return next();
};

/**
 * Helper to check if request user has specific role
 */
const userHasRole = (req, ...roles) => {
  return req.user && (roles.includes(req.user.role) || req.user.role === ROLES.ADMIN);
};

/**
 * Helper to check if request user has specific permission
 */
const userHasPermission = (req, ...permissions) => {
  if (!req.user) return false;
  return permissions.some(permission => hasPermission(req.user.role, permission));
};

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
  requireEndpointAccess,
  verifyToken,
  extractToken,
  userHasRole,
  userHasPermission
};
