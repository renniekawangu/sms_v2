/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines all roles, their permissions, and access levels
 */

const ROLES = {
  ADMIN: 'admin',
  HEAD_TEACHER: 'head-teacher',
  TEACHER: 'teacher',
  STUDENT: 'student',
  ACCOUNTS: 'accounts',
  PARENT: 'parent'
};

// Permission levels
const PERMISSIONS = {
  // Student Permissions
  VIEW_OWN_GRADES: 'view_own_grades',
  VIEW_OWN_ATTENDANCE: 'view_own_attendance',
  VIEW_OWN_SUBJECTS: 'view_own_subjects',
  DOWNLOAD_GRADE_CARD: 'download_grade_card',
  VIEW_OWN_FEES: 'view_own_fees',

  // Teacher Permissions
  MARK_ATTENDANCE: 'mark_attendance',
  MANAGE_GRADES: 'manage_grades',
  VIEW_CLASS_STUDENTS: 'view_class_students',
  VIEW_SUBJECTS: 'view_subjects',
  VIEW_CLASS_ATTENDANCE: 'view_class_attendance',

  // Head-Teacher Permissions
  MANAGE_STAFF: 'manage_staff',
  MARK_STAFF_ATTENDANCE: 'mark_staff_attendance',
  VIEW_STAFF_ATTENDANCE: 'view_staff_attendance',
  MANAGE_STUDENTS: 'manage_students',
  MANAGE_SUBJECTS: 'manage_subjects',
  IMPORT_DATA: 'import_data',
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_GRADE_ANALYTICS: 'view_grade_analytics',
  VIEW_ATTENDANCE_ANALYTICS: 'view_attendance_analytics',
  VIEW_CLASSROOM_REPORTS: 'view_classroom_reports',

  // Accounts Permissions
  MANAGE_FEES: 'manage_fees',
  MANAGE_PAYMENTS: 'manage_payments',
  MANAGE_EXPENSES: 'manage_expenses',
  GENERATE_FINANCIAL_REPORTS: 'generate_financial_reports',
  VIEW_FINANCIAL_ANALYTICS: 'view_financial_analytics',

  // Admin Permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  CONFIGURE_SYSTEM: 'configure_system',
  MANAGE_STAFF_USERS: 'manage_staff_users',
  MANAGE_SCHOOL_SETTINGS: 'manage_school_settings',
  MANAGE_ALL_DATA: 'manage_all_data'
};

// Role Permission Matrix
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.CONFIGURE_SYSTEM,
    PERMISSIONS.MANAGE_STAFF_USERS,
    PERMISSIONS.MANAGE_SCHOOL_SETTINGS,
    PERMISSIONS.MANAGE_ALL_DATA,
    // Admin can also do everything
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.MANAGE_GRADES,
    PERMISSIONS.VIEW_CLASS_STUDENTS,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.MANAGE_SUBJECTS,
    PERMISSIONS.MANAGE_FEES,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.MANAGE_EXPENSES,
    PERMISSIONS.GENERATE_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_GRADE_ANALYTICS,
    PERMISSIONS.VIEW_ATTENDANCE_ANALYTICS
  ],

  [ROLES.HEAD_TEACHER]: [
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.MARK_STAFF_ATTENDANCE,
    PERMISSIONS.VIEW_STAFF_ATTENDANCE,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.MANAGE_SUBJECTS,
    PERMISSIONS.IMPORT_DATA,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_GRADE_ANALYTICS,
    PERMISSIONS.VIEW_ATTENDANCE_ANALYTICS,
    PERMISSIONS.VIEW_CLASSROOM_REPORTS,
    PERMISSIONS.MANAGE_ALL_DATA
  ],

  [ROLES.TEACHER]: [
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.MANAGE_GRADES,
    PERMISSIONS.VIEW_CLASS_STUDENTS,
    PERMISSIONS.VIEW_SUBJECTS,
    PERMISSIONS.VIEW_CLASS_ATTENDANCE
  ],

  [ROLES.STUDENT]: [
    PERMISSIONS.VIEW_OWN_GRADES,
    PERMISSIONS.VIEW_OWN_ATTENDANCE,
    PERMISSIONS.VIEW_OWN_SUBJECTS,
    PERMISSIONS.DOWNLOAD_GRADE_CARD,
    PERMISSIONS.VIEW_OWN_FEES
  ],

  [ROLES.ACCOUNTS]: [
    PERMISSIONS.MANAGE_FEES,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.MANAGE_EXPENSES,
    PERMISSIONS.GENERATE_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_ANALYTICS
  ],

  [ROLES.PARENT]: [
    PERMISSIONS.VIEW_OWN_FEES,
    PERMISSIONS.VIEW_OWN_GRADES,
    PERMISSIONS.VIEW_OWN_ATTENDANCE
  ]
};

// Endpoint Access Control
const ENDPOINT_ACCESS = {
  // Authentication endpoints
  '/api/auth/login': ['*'], // Public
  '/api/auth/logout': ['*'], // Authenticated users
  '/api/auth/profile': [ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER, ROLES.STUDENT, ROLES.ACCOUNTS],

  // Student endpoints
  '/api/student/dashboard': [ROLES.STUDENT, ROLES.ADMIN],
  '/api/student/grades': [ROLES.STUDENT, ROLES.ADMIN, ROLES.TEACHER],
  '/api/student/attendance': [ROLES.STUDENT, ROLES.ADMIN, ROLES.TEACHER, ROLES.HEAD_TEACHER],
  '/api/student/fees': [ROLES.STUDENT, ROLES.ADMIN, ROLES.ACCOUNTS],

  // Teacher endpoints
  '/api/teacher/dashboard': [ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER],
  '/api/teacher/attendance': [ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER],
  '/api/teacher/grades': [ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER],
  '/api/teacher/classes': [ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER],

  // Admin endpoints
  '/api/admin/dashboard': [ROLES.ADMIN],
  '/api/admin/users': [ROLES.ADMIN],
  '/api/admin/roles': [ROLES.ADMIN],
  '/api/admin/audit-logs': [ROLES.ADMIN],

  // Accounts endpoints
  '/api/accounts/dashboard': [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.HEAD_TEACHER],
  '/api/accounts/fees': [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.HEAD_TEACHER],
  '/api/accounts/payments': [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.HEAD_TEACHER],
  '/api/accounts/expenses': [ROLES.ACCOUNTS, ROLES.ADMIN],

  // Head-teacher endpoints
  '/api/head-teacher/dashboard': [ROLES.HEAD_TEACHER, ROLES.ADMIN],
  '/api/head-teacher/staff': [ROLES.HEAD_TEACHER, ROLES.ADMIN],
  '/api/head-teacher/students': [ROLES.HEAD_TEACHER, ROLES.ADMIN],
  '/api/head-teacher/analytics': [ROLES.HEAD_TEACHER, ROLES.ADMIN]
};

/**
 * Check if role has permission
 */
function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if role can access endpoint
 */
function canAccessEndpoint(role, endpoint) {
  const allowedRoles = ENDPOINT_ACCESS[endpoint];
  if (!allowedRoles) return true; // If not defined, allow by default (should be configured)
  if (allowedRoles.includes('*')) return true; // Public endpoint
  return allowedRoles.includes(role) || role === ROLES.ADMIN; // Admin can access everything
}

/**
 * Get all permissions for a role
 */
function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get all roles with their permissions
 */
function getAllRoles() {
  return Object.keys(ROLES).map(key => ({
    name: ROLES[key],
    permissions: ROLE_PERMISSIONS[ROLES[key]] || []
  }));
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ENDPOINT_ACCESS,
  hasPermission,
  canAccessEndpoint,
  getRolePermissions,
  getAllRoles
};
