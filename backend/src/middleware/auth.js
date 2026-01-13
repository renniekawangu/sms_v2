/**
 * Authentication Middleware
 * Handles user authentication and role-based authorization
 */

/**
 * Middleware to require authentication
 * Optionally checks for specific role
 * @param {string} role - Optional specific role to check
 * @returns {function} Express middleware function
 */
function requireAuth(role) {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    // Check if user has required role (admins inherit all roles)
    if (role && req.session.user.role !== role && req.session.user.role !== 'admin') {
      return res.status(403).send('Forbidden - Insufficient permissions');
    }

    next();
  };
}

/**
 * Middleware to require specific role
 * Helper function for cleaner role checking
 * @param {...string} roles - Roles to check
 * @returns {function} Express middleware function
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    if (!roles.includes(req.session.user.role) && req.session.user.role !== 'admin') {
      return res.status(403).render('error', {
        message: 'Access denied. You do not have permission to access this page.'
      });
    }

    next();
  };
}

/**
 * Middleware to check if user is admin
 */
function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  if (req.session.user.role !== 'admin') {
    return res.status(403).send('Admin access required');
  }

  next();
}

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin
};