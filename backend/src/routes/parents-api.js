/**
 * Parents API Routes for Frontend SPA
 * Provides JSON API endpoints for parent management
 */
const express = require('express');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { User } = require('../models/user');
const { Parent } = require('../models/parent');
const { Student } = require('../models/student');

const router = express.Router();

async function findStudentByIdOrStudentId(id) {
  if (mongoose.isValidObjectId(id)) {
    const doc = await Student.findById(id);
    if (doc) return doc;
  }
  const num = Number(id);
  if (!Number.isNaN(num)) {
    return Student.findOne({ studentId: num });
  }
  return null;
}

// ============= Parents Dashboard =============
/**
 * GET /api/parents/dashboard
 * Get parent dashboard with children's summary
 */
router.get('/dashboard', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const parent = await Parent.findOne({ userId: user._id })
    .populate('children', 'firstName lastName studentId')
    .lean();

  if (!parent) {
    return res.json({
      message: 'Parent profile not found',
      children: []
    });
  }

  const { Fee } = require('../models/fees');
  const { Attendance } = require('../models/attendance');
  const { Grade } = require('../models/grades');

  // Get summary data for all children
  const childrenIds = parent.children.map(c => c._id);
  
  const [fees, attendance, grades] = await Promise.all([
    Fee.find({ studentId: { $in: childrenIds } }).lean(),
    Attendance.find({ studentId: { $in: childrenIds } }).lean(),
    Grade.find({ studentId: { $in: childrenIds } }).lean()
  ]);

  res.json({
    parent: {
      name: `${parent.firstName} ${parent.lastName}`,
      email: parent.email,
      phone: parent.phone
    },
    children: parent.children,
    summary: {
      totalChildren: parent.children.length,
      totalFees: fees.reduce((sum, f) => sum + f.amount, 0),
      totalPaid: fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0),
      pendingFees: fees.reduce((sum, f) => sum + Math.max(0, f.amount - (f.amountPaid || 0)), 0),
      attendanceRate: attendance.length > 0 
        ? parseFloat((attendance.filter(a => a.status === 'present').length / attendance.length * 100).toFixed(2))
        : 0,
      averageGrade: grades.length > 0
        ? parseFloat((grades.reduce((sum, g) => sum + g.grade, 0) / grades.length).toFixed(2))
        : 0
    }
  });
}));

// ============= Parents Management =============
/**
 * GET /api/parents
 * Get all parents
 */
router.get('/', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { search, relationship, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }
  if (relationship) filter.relationship = relationship;

  const parents = await Parent.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('students', 'firstName lastName studentId')
    .lean();

  const total = await Parent.countDocuments(filter);

  res.json({
    parents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * GET /api/parents/:id
 * Get single parent
 */
router.get('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.id)
    .populate('students')
    .lean();

  if (!parent) return res.status(404).json({ error: 'Parent not found' });
  res.json(parent);
}));

/**
 * POST /api/parents
 * Create new parent
 */
router.post('/', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, relationship, address, occupation } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }

  // Check if parent with same email exists
  const existingParent = await Parent.findOne({ email });
  if (existingParent) {
    return res.status(409).json({ error: 'Parent with this email already exists' });
  }

  const parent = new Parent({
    firstName,
    lastName,
    email,
    phone,
    relationship,
    address,
    occupation,
    students: []
  });

  await parent.save();
  res.status(201).json({ message: 'Parent created', parent });
}));

/**
 * PUT /api/parents/:id
 * Update parent
 */
router.put('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, relationship, address, occupation } = req.body;
  const parent = await Parent.findById(req.params.id);

  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  if (firstName) parent.firstName = firstName;
  if (lastName) parent.lastName = lastName;
  if (email) parent.email = email;
  if (phone) parent.phone = phone;
  if (relationship) parent.relationship = relationship;
  if (address) parent.address = address;
  if (occupation) parent.occupation = occupation;

  await parent.save();
  res.json({ message: 'Parent updated', parent });
}));

/**
 * DELETE /api/parents/:id
 * Delete parent
 */
router.delete('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const parent = await Parent.findByIdAndDelete(req.params.id);
  if (!parent) return res.status(404).json({ error: 'Parent not found' });
  res.json({ message: 'Parent deleted' });
}));

// ============= Parent-Student Links =============
/**
 * POST /api/parents/:parentId/link/:studentId
 * Link parent to student
 */
router.post('/:parentId/link/:studentId', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.parentId);
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const student = await findStudentByIdOrStudentId(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  if (!parent.students.some(s => s.toString() === student._id.toString())) {
    parent.students.push(student._id);
    await parent.save();
  }

  res.json({ message: 'Student linked to parent', parent });
}));

/**
 * POST /api/parents/:parentId/unlink/:studentId
 * Unlink parent from student
 */
router.post('/:parentId/unlink/:studentId', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.parentId);
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const student = await findStudentByIdOrStudentId(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  parent.students = parent.students.filter(s => s.toString() !== student._id.toString());
  await parent.save();

  res.json({ message: 'Student unlinked from parent', parent });
}));

/**
 * GET /api/parents/:id/students
 * Get parent's students
 */
router.get('/:id/students', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.id)
    .populate('students')
    .lean();

  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  res.json(parent.students);
}));

module.exports = router;
