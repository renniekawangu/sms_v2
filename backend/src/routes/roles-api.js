/**
 * Roles API
 * Endpoint for managing and querying system roles and permissions
 */
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const mongoose = require('mongoose');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require('../config/rbac');
const { Role, createRole, updateRole, getAllRoles, getRoleById } = require('../models/role');
const roleService = require('../services/roleService');

const router = express.Router();

/**
 * GET /api/roles
 * Get all roles (system + custom)
 * Access: Admin only for management UI
 */
router.get('/', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (_req, res) => {
  const roles = await getAllRoles();
  res.json({ success: true, count: roles.length, data: roles });
}));

/**
// Helper to resolve role by id or name
async function findRole(identifier) {
  if (mongoose.isValidObjectId(identifier)) {
    const byId = await Role.findById(identifier);
    if (byId) return byId;
  }
  return Role.findOne({ name: identifier });
}

/**
 * POST /api/roles
 * Create a custom role
 * Access: Admin only
 */
router.post('/', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { name, description, permissions = [] } = req.body;
  if (!name || !Array.isArray(permissions) || permissions.length === 0) {
    return res.status(400).json({ error: 'Name and permissions are required' });
  }
  const role = await createRole({ name: name.trim(), description, permissions }, req.user.id);
  res.status(201).json({ success: true, data: role });
}));

/**
 * PUT /api/roles/:id
 * Update role details/permissions
 * Access: Admin only
 */
router.put('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;
  if (permissions && !Array.isArray(permissions)) {
    return res.status(400).json({ error: 'Permissions must be an array' });
  }
  const updated = await updateRole(id, { name, description, permissions });
  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/roles/:id
 * Delete a custom role (system roles cannot be deleted)
 * Access: Admin only
 */
router.delete('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const role = await getRoleById(id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (role.isSystem) return res.status(400).json({ error: 'System roles cannot be deleted' });
  await Role.deleteOne({ _id: id });
  res.json({ success: true, message: 'Role deleted' });
}));

// ---- Parameterized routes should stay last to avoid collisions ----

/**
 * GET /api/roles/:id/permissions
 * Get permissions for a specific role (db-backed)
 * Access: Admin only
 */
router.get('/:id/permissions', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const role = await findRole(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  const permissions = role.permissions || [];
  res.json({ success: true, role: role.name, permissions, count: permissions.length });
}));

/**
 * GET /api/roles/:id
 * Get role by id or name
 * Access: Admin only
 */
router.get('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const role = await findRole(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  res.json({ success: true, data: role });
}));

/**
 * GET /api/roles/hierarchy
 * Get role hierarchy (admin, head-teacher, teacher, student)
 * Access: All authenticated users
 */
router.get('/hierarchy', asyncHandler(async (_req, res) => {
  const hierarchy = roleService.getRoleHierarchy();
  res.json({
    success: true,
    count: hierarchy.length,
    data: hierarchy
  });
}));

/**
 * GET /api/roles/permissions/all
 * Get all available permissions in the system
 * Access: Admin only
 */
router.get('/permissions/all', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const permissions = roleService.getAllPermissions();
  const byCategory = roleService.getPermissionsByCategory();

  res.json({
    success: true,
    allPermissions: permissions,
    byCategory,
    total: permissions.length
  });
}));

/**
 * GET /api/roles/statistics
 * Get role distribution statistics
 * Access: Admin and Head-Teacher only
 */
router.get('/statistics', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const stats = await roleService.getRoleStatistics();
  const hierarchy = roleService.getRoleHierarchy();

  res.json({
    success: true,
    stats,
    hierarchy,
    timestamp: new Date()
  });
}));

/**
 * GET /api/roles/:roleName/users
 * Get all users with a specific role
 * Access: Admin and Head-Teacher only
 */
router.get('/:roleName/users', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { roleName } = req.params;

  if (!Object.values(ROLES).includes(roleName)) {
    return res.status(404).json({
      error: 'Role not found'
    });
  }

  const users = await roleService.getUsersByRole(roleName);

  res.json({
    success: true,
    role: roleName,
    count: users.length,
    data: users
  });
}));

/**
 * GET /api/roles/my/info
 * Get current user's role information
 * Access: All authenticated users
 */
router.get('/my/info', requireAuth, asyncHandler(async (req, res) => {
  const roleDetails = await roleService.getRoleWithDetails(req.user.role);
  const features = roleService.getRoleFeatures(req.user.role);

  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    },
    roleDetails: {
      ...roleDetails,
      features
    }
  });
}));

/**
 * GET /api/roles/my/permissions
 * Get current user's resolved permissions list
 * Access: All authenticated users
 */
router.get('/my/permissions', requireAuth, asyncHandler(async (req, res) => {
  const permissions = roleService.getResolvedPermissions(req.user.role);

  res.json({
    success: true,
    role: req.user.role,
    permissions,
    count: permissions.length
  });
}));

/**
 * POST /api/roles/check-permission
 * Check if user/role has specific permission(s)
 * Body: { role: string, permissions: string[] }
 * Access: Admin only (for verification purposes)
 */
router.post('/check-permission', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { role, permissions } = req.body;

  if (!role || !permissions || !Array.isArray(permissions)) {
    return res.status(400).json({
      error: 'Role and permissions array required'
    });
  }

  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({
      error: 'Invalid role',
      availableRoles: Object.values(ROLES)
    });
  }

  const results = {};
  for (const permission of permissions) {
    results[permission] = roleService.canPerformAction(role, permission);
  }

  res.json({
    success: true,
    role,
    permissions: results
  });
}));

module.exports = router;
