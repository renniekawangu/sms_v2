/**
 * Custom Role Model
 * Allows admins to create and manage custom roles with permissions
 */
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  description: String,
  isSystem: { 
    type: Boolean, 
    default: false 
  }, // System roles cannot be deleted
  permissions: [
    {
      type: String,
      enum: [
        // Student permissions
        'view_own_grades',
        'view_own_attendance',
        'view_own_subjects',
        'download_grade_card',

        // Dashboard
        'view_dashboard',
        
        // Teacher permissions
        'mark_attendance',
        'manage_grades',
        'view_students',
        'view_subjects',
        'view_teachers',
        'view_users',
        'create_user',
        'edit_user',
        'delete_user',
        'create_student',
        'edit_student',
        'delete_student',
        'create_teacher',
        'edit_teacher',
        'delete_teacher',
        
        // Head-teacher permissions
        'manage_staff',
        'mark_staff_attendance',
        'view_staff_attendance',
        'manage_students',
        'manage_subjects',
        'import_data',
        'view_analytics',
        'view_grade_analytics',
        'view_attendance_analytics',

        // Classroom / attendance
        'view_classrooms',
        'create_classroom',
        'edit_classroom',
        'delete_classroom',
        'view_attendance',
        'create_attendance',
        
        // Accounts permissions
        'manage_fees',
        'generate_reports',
        'view_fees',
        'view_payments',
        'create_payment',
        'view_expenses',
        'manage_expenses',
        
        // Admin permissions
        'manage_users',
        'manage_roles',
        'view_audit_logs',
        'configure_system',
        'manage_staff_users',
        'view_reports'
        ,
        'view_settings',
        'manage_settings'
      ]
    }
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Default system roles
const DEFAULT_ROLES = [
  {
    name: 'admin',
    description: 'System administrator with full access',
    isSystem: true,
    permissions: [
      'manage_users',
      'manage_roles',
      'view_audit_logs',
      'configure_system',
      'manage_staff_users',
      'view_analytics'
    ]
  },
  {
    name: 'head-teacher',
    description: 'Head teacher managing school operations',
    isSystem: true,
    permissions: [
      'manage_staff',
      'mark_staff_attendance',
      'view_staff_attendance',
      'manage_students',
      'manage_subjects',
      'import_data',
      'view_analytics',
      'view_grade_analytics',
      'view_attendance_analytics'
    ]
  },
  {
    name: 'teacher',
    description: 'Teacher managing classes and grades',
    isSystem: true,
    permissions: [
      'mark_attendance',
      'manage_grades',
      'view_students',
      'view_subjects'
    ]
  },
  {
    name: 'student',
    description: 'Student accessing own academic records',
    isSystem: true,
    permissions: [
      'view_own_grades',
      'view_own_attendance',
      'view_own_subjects',
      'download_grade_card'
    ]
  },
  {
    name: 'accounts',
    description: 'Accounts officer managing fees',
    isSystem: true,
    permissions: [
      'manage_fees',
      'generate_reports'
    ]
  }
];

const Role = mongoose.model('Role', roleSchema);

/**
 * Initialize default roles if they don't exist
 */
async function initializeDefaultRoles() {
  try {
    for (const roleData of DEFAULT_ROLES) {
      const existing = await Role.findOne({ name: roleData.name });
      if (!existing) {
        await Role.create(roleData);
        console.log(`Created default role: ${roleData.name}`);
      }
    }
  } catch (err) {
    console.error('Error initializing default roles:', err);
  }
}

/**
 * Get all roles
 */
async function getAllRoles() {
  return await Role.find().sort({ isSystem: -1, name: 1 });
}

/**
 * Get role by ID
 */
async function getRoleById(id) {
  return await Role.findById(id);
}

/**
 * Get role by name
 */
async function getRoleByName(name) {
  return await Role.findOne({ name });
}

/**
 * Create custom role
 */
async function createRole(roleData, createdBy) {
  const role = new Role({
    ...roleData,
    isSystem: false,
    createdBy
  });
  return await role.save();
}

/**
 * Update role
 */
async function updateRole(id, updateData) {
  const role = await Role.findById(id);
  if (!role) throw new Error('Role not found');
  // System roles can be updated but their name is locked
  if (role.isSystem && updateData.name && updateData.name !== role.name) {
    throw new Error('Cannot rename system roles');
  }

  // Prevent toggling system flag
  if (typeof updateData.isSystem !== 'undefined') {
    delete updateData.isSystem;
  }

  Object.assign(role, updateData);
  role.updatedAt = new Date();
  return await role.save();
}

/**
 * Delete role
 */
async function deleteRole(id) {
  const role = await Role.findById(id);
  if (!role) throw new Error('Role not found');
  if (role.isSystem) throw new Error('Cannot delete system roles');
  
  // Check if any users have this role
  const { User } = require('./user');
  const usersWithRole = await User.findOne({ role: role.name });
  if (usersWithRole) throw new Error('Cannot delete role that is in use');
  
  return await Role.findByIdAndDelete(id);
}

/**
 * Check if user has permission
 */
async function hasPermission(userRole, permission) {
  const role = await getRoleByName(userRole);
  if (!role) return false;
  return role.permissions.includes(permission);
}

/**
 * Get user permissions
 */
async function getUserPermissions(userRole) {
  const role = await getRoleByName(userRole);
  if (!role) return [];
  return role.permissions;
}

module.exports = {
  Role,
  initializeDefaultRoles,
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  hasPermission,
  getUserPermissions,
  DEFAULT_ROLES
};
