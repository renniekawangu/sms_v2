/**
 * Student API Routes for Frontend SPA
 * Provides JSON API endpoints for student dashboard
 */
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, requirePermission } = require('../middleware/rbac');
const { ROLES, PERMISSIONS } = require('../config/rbac');
const Student = require('../models/student');
const Attendance = require('../models/attendance');
const Grade = require('../models/grades');
const logger = require('../utils/logger');

// Helper: Resolve student by ObjectId or numeric studentId
const findStudentByIdOrStudentId = async (idOrStudentId) => {
  try {
    // Try numeric studentId first
    if (!isNaN(idOrStudentId)) {
      const student = await Student.findOne({ studentId: parseInt(idOrStudentId) });
      if (student) return student;
    }
    // Try ObjectId
    if (idOrStudentId.match(/^[0-9a-fA-F]{24}$/)) {
      return await Student.findById(idOrStudentId);
    }
  } catch (err) {
    logger.error(`Student lookup error: ${err.message}`);
  }
  return null;
};

// ============= Student Dashboard =============
/**
 * GET /api/student/dashboard
 * Get student dashboard data
 */
router.get('/dashboard', requireAuth, requireRole(ROLES.STUDENT), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate('classroomId')
      .populate('parentId');
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const attendance = await Attendance.findOne({ studentId: student._id }).lean();
    const grades = await Grade.find({ studentId: student._id }).lean();

    res.json({
      success: true,
      data: {
        student,
        attendance,
        grades,
        enrollmentDate: student.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// ============= Student Attendance =============
/**
 * GET /api/student/attendance
 * Get student's attendance records
 */
router.get('/attendance', requireAuth, requireRole(ROLES.STUDENT), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const attendance = await Attendance.findOne({ studentId: student._id }).lean();
    res.json({ success: true, data: attendance || {} });
  } catch (err) {
    next(err);
  }
});

// ============= Student Grades =============
/**
 * GET /api/student/grades
 * Get student's grades
 */
router.get('/grades', requireAuth, requireRole(ROLES.STUDENT), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const grades = await Grade.find({ studentId: student._id })
      .populate('subjectId')
      .lean();
    
    res.json({ success: true, data: grades });
  } catch (err) {
    next(err);
  }
});

// ============= Student Performance =============
/**
 * GET /api/student/performance
 * Get student's academic performance
 */
router.get('/performance', requireAuth, requireRole(ROLES.STUDENT), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const grades = await Grade.find({ studentId: student._id }).lean();
    const avgGrade = grades.length > 0 
      ? (grades.reduce((sum, g) => sum + (g.score || 0), 0) / grades.length).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        totalSubjects: grades.length,
        averageGrade: avgGrade,
        grades
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
