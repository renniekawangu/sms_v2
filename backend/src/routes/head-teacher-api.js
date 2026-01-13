/**
 * Head Teacher API Routes for Frontend SPA
 * Provides JSON API endpoints for head teacher dashboard
 */
const express = require('express');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { User } = require('../models/user');
const { Staff } = require('../models/staff');
const { Student } = require('../models/student');
const { Subject } = require('../models/subjects');
const { Grade } = require('../models/grades');
const { Attendance } = require('../models/attendance');

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

// ============= Head Teacher Dashboard =============
/**
 * GET /api/head-teacher/dashboard
 * Get head teacher dashboard data
 */
router.get('/dashboard', requireAuth, requireRole(ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { classLevel = '' } = req.query;

  // Get subjects with optional filter
  const subjects = await Subject.find(classLevel ? { classLevel } : {})
    .populate('students', '_id firstName lastName studentId')
    .populate('teacherId', 'firstName lastName email')
    .lean();

  // Get teachers
  const teachers = await Staff.find({ role: 'teacher' }).lean();

  // Get students
  const studentFilter = classLevel ? { classLevel } : {};
  const allStudents = await Student.find(studentFilter).lean();

  // Performance stats
  const performanceStats = await Grade.aggregate([
    { $match: { ...(subjects.length ? { subject: { $in: subjects.map(s => s.name) } } : {}) } },
    {
      $group: {
        _id: '$subject',
        avgGrade: { $avg: '$grade' },
        count: { $sum: 1 }
      }
    },
    { $sort: { avgGrade: -1 } }
  ]);

  // Attendance stats
  const attendanceSummary = await Attendance.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    subjects,
    teachers,
    students: allStudents,
    performanceStats,
    attendanceSummary: Object.fromEntries(attendanceSummary.map(a => [a._id || 'unknown', a.count])),
    classLevels: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Secondary 1', 'Secondary 2', 'Secondary 3']
  });
}));

// ============= Students Management =============
/**
 * GET /api/head-teacher/students
 * Get students with optional filter
 */
router.get('/students', requireAuth, requireRole(ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { classLevel, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const filter = classLevel ? { classLevel } : {};

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

// ============= Subjects Management =============
/**
 * GET /api/head-teacher/subjects
 * Get all subjects
 */
router.get('/subjects', requireAuth, requireRole(ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { classLevel, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const filter = classLevel ? { classLevel } : {};

  const subjects = await Subject.find(filter)
    .populate('students', '_id firstName lastName studentId')
    .populate('teacherId', 'firstName lastName email')
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Subject.countDocuments(filter);

  res.json({
    subjects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * GET /api/head-teacher/subjects/:id
 * Get single subject
 */
router.get('/subjects/:id', requireAuth, requireRole(ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('students')
    .populate('teacherId')
    .lean();

  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  res.json(subject);
}));

/**
 * POST /api/head-teacher/subjects
 * Create new subject
 */
router.post('/subjects', requireAuth, requireRole(ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { name, code, classLevel, teacherId } = req.body;

  if (!name || !code || !classLevel) {
    return res.status(400).json({ error: 'Name, code, and classLevel are required' });
  }

  const subject = new Subject({
    name,
    code,
    classLevel,
    teacherId,
    students: []
  });

  await subject.save();
  res.status(201).json({ message: 'Subject created', subject });
}));

/**
 * PUT /api/head-teacher/subjects/:id
 * Update subject
 */
router.put('/subjects/:id', requireAuth, requireRole(ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { name, code, classLevel, teacherId } = req.body;
  const subject = await Subject.findById(req.params.id);

  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  if (name) subject.name = name;
  if (code) subject.code = code;
  if (classLevel) subject.classLevel = classLevel;
  if (teacherId) subject.teacherId = teacherId;

  await subject.save();
  res.json({ message: 'Subject updated', subject });
}));

/**
 * DELETE /api/head-teacher/subjects/:id
 * Delete subject
 */
router.delete('/subjects/:id', requireAuth, requireRole(ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  res.json({ message: 'Subject deleted' });
}));

/**
 * POST /api/head-teacher/subjects/:id/allocate
 * Allocate teacher to subject
 */
router.post('/subjects/:id/allocate', requireAuth, requireRole(ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { teacherId } = req.body;

  if (!teacherId) {
    return res.status(400).json({ error: 'Teacher ID is required' });
  }

  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const teacher = await Staff.findById(teacherId);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  subject.teacherId = teacherId;
  await subject.save();

  res.json({ message: 'Teacher allocated to subject', subject });
}));

/**
 * POST /api/head-teacher/subjects/:id/add-student
 * Add student to subject
 */
router.post('/subjects/:id/add-student', requireAuth, requireRole(ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const student = await findStudentByIdOrStudentId(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  if (!subject.students.some(s => s.toString() === student._id.toString())) {
    subject.students.push(student._id);
    await subject.save();
  }

  res.json({ message: 'Student added to subject', subject });
}));

/**
 * POST /api/head-teacher/subjects/:id/remove-student
 * Remove student from subject
 */
router.post('/subjects/:id/remove-student', requireAuth, requireRole(ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const student = await findStudentByIdOrStudentId(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  subject.students = subject.students.filter(s => s.toString() !== student._id.toString());
  await subject.save();

  res.json({ message: 'Student removed from subject', subject });
}));

module.exports = router;
