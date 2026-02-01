/**
 * Role-Based Access Control (RBAC) Configuration
 * Hardcoded roles and permissions configuration
 * Provides centralized permission management
 */

// Permission levels (defined first for use in rolesConfig)
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
  APPROVE_RESULTS: 'approve_results',

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

// Hardcoded roles and permissions from roles.permissions.json
const rolesConfig = {
  roles: {
    ADMIN: {
      description: "Full control of the school system",
      permissions: [
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.MANAGE_ROLES,
        PERMISSIONS.VIEW_AUDIT_LOGS,
        PERMISSIONS.CONFIGURE_SYSTEM,
        PERMISSIONS.MANAGE_STAFF_USERS,
        PERMISSIONS.MANAGE_SCHOOL_SETTINGS,
        PERMISSIONS.MANAGE_ALL_DATA,
        // Admin can also do everything else
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
      routes: [
        "/admin/**"
      ]
    },
    HEAD_TEACHER: {
      description: "Academic oversight and staff monitoring",
      permissions: [
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
        PERMISSIONS.APPROVE_RESULTS
      ],
      routes: [
        "/head-teacher/**"
      ]
    },
    TEACHER: {
      description: "Classroom and subject management",
      permissions: [
        PERMISSIONS.MARK_ATTENDANCE,
        PERMISSIONS.MANAGE_GRADES,
        PERMISSIONS.VIEW_CLASS_STUDENTS,
        PERMISSIONS.VIEW_SUBJECTS,
        PERMISSIONS.VIEW_CLASS_ATTENDANCE
      ],
      routes: [
        "/teacher/**"
      ]
    },
    ACCOUNTS: {
      description: "Financial management and reporting",
      permissions: [
        PERMISSIONS.MANAGE_FEES,
        PERMISSIONS.MANAGE_PAYMENTS,
        PERMISSIONS.MANAGE_EXPENSES,
        PERMISSIONS.GENERATE_FINANCIAL_REPORTS,
        PERMISSIONS.VIEW_FINANCIAL_ANALYTICS
      ],
      routes: [
        "/accounts/**"
      ]
    },
    PARENT: {
      description: "View-only access for own child",
      permissions: [
        PERMISSIONS.VIEW_OWN_FEES,
        PERMISSIONS.VIEW_OWN_GRADES,
        PERMISSIONS.VIEW_OWN_ATTENDANCE
      ],
      routes: [
        "/parent/**"
      ]
    },
    STUDENT: {
      description: "Personal academic access",
      permissions: [
        PERMISSIONS.VIEW_OWN_GRADES,
        PERMISSIONS.VIEW_OWN_ATTENDANCE,
        PERMISSIONS.VIEW_OWN_SUBJECTS
      ],
      routes: [
        "/student/**"
      ]
    }
  },
  rules: {
    self_access_only: [
      PERMISSIONS.VIEW_OWN_GRADES,
      PERMISSIONS.VIEW_OWN_ATTENDANCE,
      PERMISSIONS.VIEW_OWN_FEES
    ],
    approval_required: {
      "student:results:publish": "HEAD_TEACHER"
    }
  }
};

console.log('[RBAC] Using hardcoded roles configuration');

const ROLES = {
  ADMIN: 'admin',
  HEAD_TEACHER: 'head-teacher',
  TEACHER: 'teacher',
  STUDENT: 'student',
  ACCOUNTS: 'accounts',
  PARENT: 'parent'
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
    PERMISSIONS.VIEW_ATTENDANCE_ANALYTICS,
    PERMISSIONS.APPROVE_RESULTS
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
    PERMISSIONS.MANAGE_ALL_DATA,
    PERMISSIONS.APPROVE_RESULTS
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
  '/api/auth/profile': [ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER, ROLES.STUDENT, ROLES.ACCOUNTS, ROLES.PARENT],

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
 * Uses hardcoded rolesConfig for permission checking
 * Handles role name conversion (hyphens to underscores)
 */
function hasPermission(role, permission) {
  // Convert role name: 'head-teacher' -> 'HEAD_TEACHER'
  const roleKey = role?.toUpperCase().replace(/-/g, '_');
  
  if (rolesConfig.roles && rolesConfig.roles[roleKey]) {
    const roleConfig = rolesConfig.roles[roleKey];
    return roleConfig.permissions?.includes(permission) || false;
  }
  
  // Fallback to hardcoded permissions
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if user can access a specific resource
 * Implements self-access-only rules from rolesConfig
 * @param {string} role - User's role (e.g., 'admin', 'head-teacher')
 * @param {string} permission - Permission to check (e.g., 'student:results:view:self')
 * @param {object} context - Context object with userId, resourceOwnerId, etc.
 * @returns {boolean} True if user can access the resource
 */
function canAccessResource(role, permission, context = {}) {
  // Admin can access everything
  if (role === ROLES.ADMIN) {
    return true;
  }

  // Check basic permission
  if (!hasPermission(role, permission)) {
    return false;
  }

  // Enforce self-access-only rules
  const selfAccessRules = rolesConfig.rules?.self_access_only || [];
  if (selfAccessRules.includes(permission)) {
    // User can only access their own data
    if (context.userId && context.resourceOwnerId) {
      return context.userId === context.resourceOwnerId;
    }
    return false;
  }

  return true;
}

/**
 * Check if role can access endpoint
 */
function canAccessEndpoint(role, endpoint) {
  const allowedRoles = ENDPOINT_ACCESS[endpoint];
  if (!allowedRoles) return true;
  if (allowedRoles.includes('*')) return true;
  return allowedRoles.includes(role) || role === ROLES.ADMIN;
}

/**
 * Get all permissions for a role
 */
function getRolePermissions(role) {
  // Convert role name: 'head-teacher' -> 'HEAD_TEACHER'
  const roleKey = role?.toUpperCase().replace(/-/g, '_');
  
  if (rolesConfig.roles && rolesConfig.roles[roleKey]) {
    return rolesConfig.roles[roleKey].permissions || [];
  }
  // Fallback to hardcoded permissions
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get all roles with their permissions
 */
function getAllRoles() {
  if (rolesConfig.roles && Object.keys(rolesConfig.roles).length > 0) {
    // Use roles from config
    return Object.entries(rolesConfig.roles).map(([roleKey, roleConfig]) => ({
      name: roleKey.toLowerCase(),
      description: roleConfig.description,
      permissions: roleConfig.permissions || []
    }));
  }

  // Fallback to hardcoded roles
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
  canAccessResource,
  canAccessEndpoint,
  getRolePermissions,
  getAllRoles,
  rolesConfig
};
