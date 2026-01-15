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
  
  // Try to get parent by parentId first, then fallback to email lookup
  let parent = null;
  
  if (user.parentId) {
    parent = await Parent.findById(user.parentId)
      .populate('students', 'firstName lastName studentId')
      .lean();
  } else {
    // Fallback: find parent by email and update user
    parent = await Parent.findOne({ email: user.email })
      .populate('students', 'firstName lastName studentId')
      .lean();
    
    if (parent) {
      // Update user to have parentId for next time
      await User.findByIdAndUpdate(req.user.id, { parentId: parent._id });
    }
  }

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
  const childrenIds = parent.students.map(c => c._id);
  
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
    children: parent.students,
    summary: {
      totalChildren: parent.students.length,
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

/**
 * GET /api/parents/children
 * Get all children linked to the parent
 */
router.get('/children', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId)
      .populate('students', 'firstName lastName studentId class')
      .lean();
  } else {
    parent = await Parent.findOne({ email: user.email })
      .populate('students', 'firstName lastName studentId class')
      .lean();
    
    if (parent) {
      await User.findByIdAndUpdate(req.user.id, { parentId: parent._id });
    }
  }

  if (!parent) {
    return res.json({ children: [] });
  }

  res.json({ children: parent.students });
}));

/**
 * GET /api/parents/children/:student_id/grades
 * Get a child's grades
 */
router.get('/children/:student_id/grades', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  // Verify parent owns this child
  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId).lean();
  } else {
    parent = await Parent.findOne({ email: user.email }).lean();
  }

  if (!parent) {
    return res.status(403).json({ error: 'Parent not found' });
  }

  const studentObjectId = require('mongoose').Types.ObjectId;
  const childIsLinked = parent.students.some(s => s.toString() === req.params.student_id);
  
  if (!childIsLinked) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { Grade } = require('../models/grades');
  const grades = await Grade.find({ studentId: req.params.student_id }).lean();
  
  res.json(grades);
}));

/**
 * GET /api/parents/children/:student_id/attendance
 * Get a child's attendance records
 */
router.get('/children/:student_id/attendance', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId).lean();
  } else {
    parent = await Parent.findOne({ email: user.email }).lean();
  }

  if (!parent) {
    return res.status(403).json({ error: 'Parent not found' });
  }

  const childIsLinked = parent.students.some(s => s.toString() === req.params.student_id);
  
  if (!childIsLinked) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { Attendance } = require('../models/attendance');
  const attendance = await Attendance.find({ studentId: req.params.student_id }).lean();
  
  res.json(attendance);
}));

/**
 * GET /api/parents/children/:student_id/fees
 * Get a child's fee information
 */
router.get('/children/:student_id/fees', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId).lean();
  } else {
    parent = await Parent.findOne({ email: user.email }).lean();
  }

  if (!parent) {
    return res.status(403).json({ error: 'Parent not found' });
  }

  const childIsLinked = parent.students.some(s => s.toString() === req.params.student_id);
  
  if (!childIsLinked) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { Fee } = require('../models/fees');
  const fees = await Fee.find({ studentId: req.params.student_id }).lean();
  
  res.json(fees);
}));

/**
 * GET /api/parents/children/:student_id/report
 * Download a child's report card as PDF
 */
router.get('/children/:student_id/report', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId).lean();
  } else {
    parent = await Parent.findOne({ email: user.email }).lean();
  }

  if (!parent) {
    return res.status(403).json({ error: 'Parent not found' });
  }

  const childIsLinked = parent.students.some(s => s.toString() === req.params.student_id);
  if (!childIsLinked) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { Grade } = require('../models/grades');
  const { Attendance } = require('../models/attendance');
  const { Fee } = require('../models/fees');
  const PDFDocument = require('pdfkit');

  const student = await Student.findById(req.params.student_id).lean();
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const [grades, attendance, fees] = await Promise.all([
    Grade.find({ studentId: req.params.student_id }).lean(),
    Attendance.find({ studentId: req.params.student_id }).lean(),
    Fee.find({ studentId: req.params.student_id }).lean()
  ]);

  const present = attendance.filter(a => a.status === 'present').length;
  const totalAttendance = attendance.length;
  const attendanceRate = totalAttendance > 0 ? ((present / totalAttendance) * 100).toFixed(2) : '0.00';
  const avgGrade = grades.length > 0 ? (grades.reduce((sum, g) => sum + (g.grade || 0), 0) / grades.length).toFixed(2) : 'N/A';
  const totalFees = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const totalPending = Math.max(0, totalFees - totalPaid);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${student.studentId || student._id}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // Header
  doc.fontSize(20).text('Student Report Card', { align: 'center' });
  doc.moveDown();

  // Student Info
  doc.fontSize(12);
  doc.text(`Parent: ${parent.firstName || ''} ${parent.lastName || ''}`);
  doc.text(`Student: ${student.firstName || ''} ${student.lastName || ''}`);
  doc.text(`Student ID: ${student.studentId || student._id}`);
  doc.moveDown();

  // Grades
  doc.fontSize(14).text('Academic Performance');
  doc.fontSize(12).text(`Average Grade: ${avgGrade}`);
  grades.slice(0, 10).forEach(g => {
    doc.text(`• ${g.subject || 'Subject'}: ${g.grade ?? 'N/A'}`);
  });
  if (grades.length > 10) doc.text(`+ ${grades.length - 10} more entries`);
  doc.moveDown();

  // Attendance
  doc.fontSize(14).text('Attendance');
  doc.fontSize(12).text(`Attendance Rate: ${attendanceRate}%`);
  doc.text(`Present: ${present}`);
  doc.text(`Absent: ${attendance.filter(a => a.status === 'absent').length}`);
  doc.moveDown();

  // Fees
  doc.fontSize(14).text('Fees & Payments');
  doc.fontSize(12).text(`Total Fees: $${totalFees.toFixed(2)}`);
  doc.text(`Total Paid: $${totalPaid.toFixed(2)}`);
  doc.text(`Pending: $${totalPending.toFixed(2)}`);
  doc.moveDown();

  doc.text('Generated by School Management System', { align: 'right' });
  doc.end();
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
