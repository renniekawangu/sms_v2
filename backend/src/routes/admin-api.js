/**
 * Admin API Routes for Frontend SPA
 * Provides JSON API endpoints for admin dashboard and management
 */
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { User } = require('../models/user');
const { Student } = require('../models/student');
const { Staff } = require('../models/staff');
const { Grade } = require('../models/grades');
const { Attendance } = require('../models/attendance');
const { Fee } = require('../models/fees');
const { Payment } = require('../models/payment');
const { Expense } = require('../models/expense');
const { AuditLog } = require('../models/audit-log');
const { logAction } = require('../utils/auditLogger');
const { getSchoolSettings, getCurrentAcademicYear } = require('../models/school-settings');

const router = express.Router();

// ============= Admin Dashboard =============
/**
 * GET /api/admin/dashboard
 * Get dashboard statistics and overview data
 */
router.get('/dashboard', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const schoolSettings = await getSchoolSettings();
  const currentAcademicYear = await getCurrentAcademicYear();

  const totalStudents = await Student.countDocuments();
  const totalStaff = await Staff.countDocuments();
  const totalUsers = await User.countDocuments();

  // Attendance stats
  const attendanceStats = await Attendance.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Fee stats
  const feeStats = await Fee.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }
    }
  ]);

  // Recent activities
  const recentActivities = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Grade statistics
  const gradeStats = await Grade.aggregate([
    {
      $group: {
        _id: null,
        averageGrade: { $avg: '$grade' },
        totalRecords: { $sum: 1 }
      }
    }
  ]);

  res.json({
    schoolSettings,
    currentAcademicYear,
    stats: {
      totalStudents,
      totalStaff,
      totalUsers,
      attendance: Object.fromEntries(attendanceStats.map(s => [s._id || 'unknown', s.count])),
      fees: Object.fromEntries(feeStats.map(f => [f._id || 'unknown', { count: f.count, amount: f.amount }])),
      grades: gradeStats[0] || { averageGrade: 0, totalRecords: 0 }
    },
    recentActivities
  });
}));

// ============= Search =============
/**
 * GET /api/admin/search
 * Global search across students, staff, users
 */
router.get('/search', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  
  if (q.length < 2) {
    return res.json({ students: [], staff: [], users: [] });
  }

  const searchRegex = { $regex: q, $options: 'i' };

  const [students, staff, users] = await Promise.all([
    Student.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { studentId: !isNaN(q) ? parseInt(q) : undefined }
      ]
    }).limit(10).lean(),
    
    Staff.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ]
    }).limit(10).lean(),
    
    User.find({
      $or: [
        { email: searchRegex }
      ]
    }).limit(10).lean()
  ]);

  res.json({ students, staff, users });
}));

// ============= Users Management =============
/**
 * GET /api/admin/users
 * List all users
 */
router.get('/users', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, role } = req.query;
  const skip = (page - 1) * limit;
  const filter = role ? { role } : {};

  const users = await User.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await User.countDocuments(filter);

  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * GET /api/admin/users/:id
 * Get single user
 */
router.get('/users/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}));

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/users', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { email, password, role, name, phone, date_of_join } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const user = new User({ 
    email, 
    password, 
    role,
    name,
    phone,
    date_of_join: date_of_join ? new Date(date_of_join) : undefined
  });
  await user.save();

  await logAction({
    action: 'create_user',
    actor: req.user,
    targetType: 'User',
    targetId: user._id,
    details: { email: user.email, role: user.role }
  });

  res.status(201).json({ 
    message: 'User created', 
    user_id: user._id, 
    email: user.email, 
    role: user.role,
    name: user.name,
    phone: user.phone,
    date_of_join: user.date_of_join
  });
}));

/**
 * PUT /api/admin/users/:id
 * Update user
 */
router.put('/users/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  if (email) user.email = email;
  if (role) user.role = role;

  await user.save();
  await logAction({
    action: 'update_user',
    actor: req.user,
    targetType: 'User',
    targetId: user._id,
    details: { email: user.email, role: user.role }
  });
  res.json({ message: 'User updated', user_id: user._id });
}));

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
router.delete('/users/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await logAction({
    action: 'delete_user',
    actor: req.user,
    targetType: 'User',
    targetId: req.params.id,
    details: { email: user.email, role: user.role }
  });
  res.json({ message: 'User deleted' });
}));

// ============= Students Management =============
/**
 * GET /api/admin/students
 * List all students
 */
router.get('/students-list', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, classLevel } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (classLevel) filter.classLevel = classLevel;

  const students = await Student.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Student.countDocuments(filter);

  res.json({
    students,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * POST /api/admin/students/bulk-delete
 * Delete multiple students
 */
router.post('/students/bulk-delete', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { ids = [] } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No student IDs provided' });
  }

  const result = await Student.deleteMany({ _id: { $in: ids } });
  await logAction({
    action: 'bulk_delete_students',
    actor: req.user,
    targetType: 'Student',
    details: { ids }
  });
  res.json({ message: `${result.deletedCount} students deleted` });
}));

// ============= Staff Management =============
/**
 * GET /api/admin/staff
 * List all staff
 */
router.get('/staff-list', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, role } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (role) filter.role = role;

  const staff = await Staff.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Staff.countDocuments(filter);

  res.json({
    staff,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * POST /api/admin/staff/bulk-delete
 * Delete multiple staff members
 */
router.post('/staff/bulk-delete', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { ids = [] } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No staff IDs provided' });
  }

  const result = await Staff.deleteMany({ _id: { $in: ids } });
  await logAction({
    action: 'bulk_delete_staff',
    actor: req.user,
    targetType: 'Staff',
    details: { ids }
  });
  res.json({ message: `${result.deletedCount} staff members deleted` });
}));

// ============= Audit Log =============
/**
 * GET /api/admin/audit-logs
 * Get audit logs
 */
router.get('/audit-logs', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await AuditLog.countDocuments();

  res.json({
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

module.exports = router;
