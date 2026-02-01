/**
 * RBAC Middleware
 * Handles role-based access control and permission checking
 */
const jwt = require('jsonwebtoken');
const { ROLES, hasPermission, canAccessEndpoint, canAccessResource } = require('../config/rbac');

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
    console.log('[AUTH] Token extracted:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    
    if (!token) {
      console.log('[AUTH] No token provided');
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const decoded = verifyToken(token);
    console.log('[AUTH] Token decoded:', decoded ? { id: decoded.id, role: decoded.role, email: decoded.email } : 'INVALID');
    
    if (!decoded) {
      console.log('[AUTH] Token verification failed');
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    req.user = decoded;
    console.log('[AUTH] User attached to request:', { id: req.user.id, role: req.user.role });
    return next();
  } catch (err) {
    console.log('[AUTH] Token verification error:', err.message);
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
      console.log('[RBAC] requireRole - No user in request');
      return res.status(401).json({ error: 'Unauthorized: No user in request' });
    }

    const userRole = req.user.role;
    console.log('[RBAC] requireRole check - userRole:', userRole, 'allowedRoles:', allowedRoles);

    // Admin can access everything
    if (userRole === ROLES.ADMIN || userRole === 'admin') {
      console.log('[RBAC] Admin access granted');
      return next();
    }

    // Normalize role comparison (handle head-teacher, head_teacher variations)
    const normalizeRole = (role) => String(role || '').toLowerCase().replace(/_/g, '-');
    const normalizedUserRole = normalizeRole(userRole);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

    // Debug logging
    console.log('[RBAC] Role check - detailed:', {
      userRole,
      normalizedUserRole,
      allowedRoles,
      normalizedAllowedRoles,
      matches: normalizedAllowedRoles.includes(normalizedUserRole),
      endpoint: req.path
    });

    // Check if user's role is in allowed roles
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      console.log('[RBAC] Role check FAILED:', { userRole, allowedRoles, endpoint: req.path });
      return res.status(403).json({
        error: 'Forbidden: Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
        normalizedUserRole,
        normalizedAllowedRoles
      });
    }

    console.log('[RBAC] Role check PASSED for:', userRole);
    return next();
  };
};

/**
 * Middleware to require specific permission
 * Supports both single and multiple permissions
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
 * Middleware to require permission with context-aware access control
 * Enforces self-access-only rules for Parent and Student roles
 * @param {string} permission - Permission to check
 * @param {function} getContext - Function to extract context from request
 */
const requirePermissionWithContext = (permission, getContext) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role;

    // Check basic permission
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient permissions',
        permission,
        userRole
      });
    }

    // Get context for self-access checks
    const context = getContext ? getContext(req) : {};
    
    // Check with context (self-access rules)
    const canAccess = canAccessResource(userRole, permission, {
      userId: req.user.id,
      ...context
    });

    if (!canAccess) {
      return res.status(403).json({
        error: 'Forbidden: Cannot access this resource',
        permission,
        reason: 'self_access_only'
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
 * Middleware to prevent privilege escalation
 * Prevents users from modifying roles/permissions they don't have
 */
const preventPrivilegeEscalation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Prevent non-admin users from assigning roles they don't have
  if (req.user.role !== ROLES.ADMIN) {
    if (req.body.role && req.body.role !== req.user.role) {
      return res.status(403).json({
        error: 'Forbidden: Cannot assign roles you do not possess'
      });
    }
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
  requirePermissionWithContext,
  requireEndpointAccess,
  preventPrivilegeEscalation,
  verifyToken,
  extractToken,
  userHasRole,
  userHasPermission,
  ROLES
};
