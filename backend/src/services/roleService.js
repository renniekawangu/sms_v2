/**
 * Role Management Service
 * Handles all role-related business logic
 */
const { Role } = require('../models/role');
const { User } = require('../models/user');
const { ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require('../config/rbac');

/**
 * Get all system roles with detailed info
 */
async function getAllSystemRoles() {
  return Object.keys(ROLES).map(key => ({
    id: ROLES[key],
    name: ROLES[key],
    displayName: formatRoleName(ROLES[key]),
    permissions: ROLE_PERMISSIONS[ROLES[key]] || [],
    permissionCount: (ROLE_PERMISSIONS[ROLES[key]] || []).length,
    isSystem: true,
    description: getRoleDescription(ROLES[key])
  }));
}

/**
 * Get role by name with details
 */
async function getRoleWithDetails(roleName) {
  const permissions = ROLE_PERMISSIONS[roleName] || [];
  const userCount = await User.countDocuments({ role: roleName });

  return {
    name: roleName,
    displayName: formatRoleName(roleName),
    permissions: permissions.map(p => ({
      code: p,
      displayName: formatPermissionName(p)
    })),
    permissionCount: permissions.length,
    userCount,
    isSystem: true
  };
}

/**
 * Get role hierarchy (for UI display)
 */
function getRoleHierarchy() {
  return [
    {
      level: 1,
      role: ROLES.ADMIN,
      displayName: 'Administrator',
      description: 'Full system access',
      permissions: ROLE_PERMISSIONS[ROLES.ADMIN].length
    },
    {
      level: 2,
      role: ROLES.HEAD_TEACHER,
      displayName: 'Head Teacher',
      description: 'School operations management',
      permissions: ROLE_PERMISSIONS[ROLES.HEAD_TEACHER].length
    },
    {
      level: 3,
      role: ROLES.ACCOUNTS,
      displayName: 'Accounts Officer',
      description: 'Financial management',
      permissions: ROLE_PERMISSIONS[ROLES.ACCOUNTS].length
    },
    {
      level: 4,
      role: ROLES.TEACHER,
      displayName: 'Teacher',
      description: 'Class and grade management',
      permissions: ROLE_PERMISSIONS[ROLES.TEACHER].length
    },
    {
      level: 5,
      role: ROLES.STUDENT,
      displayName: 'Student',
      description: 'Academic records access',
      permissions: ROLE_PERMISSIONS[ROLES.STUDENT].length
    }
  ];
}

/**
 * Get all available permissions
 */
function getAllPermissions() {
  return Object.entries(PERMISSIONS).map(([key, value]) => ({
    code: value,
    key,
    displayName: formatPermissionName(value),
    category: getPermissionCategory(value)
  }));
}

/**
 * Get permissions by category
 */
function getPermissionsByCategory() {
  const categories = {
    student: [],
    teacher: [],
    'head-teacher': [],
    accounts: [],
    admin: []
  };

  Object.entries(PERMISSIONS).forEach(([key, permission]) => {
    const category = getPermissionCategory(permission);
    if (categories[category]) {
      categories[category].push({
        code: permission,
        displayName: formatPermissionName(permission)
      });
    }
  });

  return categories;
}

/**
 * Check if role can perform action
 */
async function canPerformAction(role, action) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(action) || role === ROLES.ADMIN;
}

/**
 * Get user's role details
 */
async function getUserRoleDetails(userId) {
  const user = await User.findById(userId).select('role email');
  if (!user) {
    throw new Error('User not found');
  }

  return await getRoleWithDetails(user.role);
}

/**
 * Get users by role
 */
async function getUsersByRole(role) {
  return await User.find({ role }).select('email role createdAt -password');
}

/**
 * Get role statistics
 */
async function getRoleStatistics() {
  const stats = {};

  for (const [key, role] of Object.entries(ROLES)) {
    const count = await User.countDocuments({ role });
    stats[role] = {
      role,
      displayName: formatRoleName(role),
      count,
      permissions: ROLE_PERMISSIONS[role].length
    };
  }

  return stats;
}

/**
 * Get all permissions assigned to a role
 */
function getResolvedPermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Format role name for display
 */
function formatRoleName(role) {
  const names = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.HEAD_TEACHER]: 'Head Teacher',
    [ROLES.TEACHER]: 'Teacher',
    [ROLES.STUDENT]: 'Student',
    [ROLES.ACCOUNTS]: 'Accounts Officer'
  };
  return names[role] || role;
}

/**
 * Format permission name for display
 */
function formatPermissionName(permission) {
  return permission
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get permission category
 */
function getPermissionCategory(permission) {
  if (permission.includes('student') || permission.includes('grade') || permission.includes('attendance')) {
    return 'teacher';
  }
  if (permission.includes('staff') || permission.includes('analytics')) {
    return 'head-teacher';
  }
  if (permission.includes('fee') || permission.includes('payment') || permission.includes('expense') || permission.includes('financial')) {
    return 'accounts';
  }
  if (permission.includes('user') || permission.includes('role') || permission.includes('audit') || permission.includes('system')) {
    return 'admin';
  }
  if (permission.includes('own')) {
    return 'student';
  }
  return 'admin';
}

/**
 * Get role description
 */
function getRoleDescription(role) {
  const descriptions = {
    [ROLES.ADMIN]: 'Full system access with ability to manage all aspects of the system',
    [ROLES.HEAD_TEACHER]: 'Manages school operations, staff, and students; can generate reports',
    [ROLES.TEACHER]: 'Can mark attendance, manage grades, and view assigned classes',
    [ROLES.STUDENT]: 'Can view own academic records, attendance, and fees',
    [ROLES.ACCOUNTS]: 'Manages fees, payments, expenses, and financial reports'
  };
  return descriptions[role] || 'System role';
}

/**
 * Get role features/capabilities
 */
function getRoleFeatures(role) {
  const features = {
    [ROLES.ADMIN]: [
      'User Management',
      'Role Management',
      'System Configuration',
      'Audit Logs',
      'Data Import/Export',
      'All Features'
    ],
    [ROLES.HEAD_TEACHER]: [
      'Staff Management',
      'Student Management',
      'Subject Management',
      'Analytics & Reports',
      'Data Import',
      'Attendance Tracking'
    ],
    [ROLES.TEACHER]: [
      'Attendance Marking',
      'Grade Management',
      'View Students',
      'Class Reports',
      'Subject Management'
    ],
    [ROLES.STUDENT]: [
      'View Grades',
      'View Attendance',
      'View Fees',
      'Download Grade Card',
      'View Subjects'
    ],
    [ROLES.ACCOUNTS]: [
      'Fee Management',
      'Payment Recording',
      'Expense Tracking',
      'Financial Reports',
      'Analytics'
    ]
  };
  return features[role] || [];
}

module.exports = {
  getAllSystemRoles,
  getRoleWithDetails,
  getRoleHierarchy,
  getAllPermissions,
  getPermissionsByCategory,
  canPerformAction,
  getUserRoleDetails,
  getUsersByRole,
  getRoleStatistics,
  formatRoleName,
  formatPermissionName,
  getRoleFeatures,
  getPermissionCategory,
  getResolvedPermissions
};
