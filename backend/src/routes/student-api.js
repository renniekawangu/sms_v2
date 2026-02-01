/**
 * Student API Routes for Frontend SPA
 * Provides JSON API endpoints for student dashboard
 * Enforces self-access-only rules for Student and Parent roles
 */
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, requirePermission, requirePermissionWithContext } = require('../middleware/rbac');
const { ROLES, PERMISSIONS, canAccessResource } = require('../config/rbac');
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

/**
 * Middleware to enforce self-access-only for students viewing their own data
 * Prevents privilege escalation by checking user identity
 */
const requireSelfAccess = async (req, res, next) => {
  try {
    if (req.user.role === ROLES.ADMIN) {
      return next(); // Admin can access any student data
    }

    // For student role, verify they own the record
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Attach student to request for use in route handlers
    req.studentData = student;
    return next();
  } catch (err) {
    logger.error(`Self-access check error: ${err.message}`);
    return res.status(500).json({ error: 'Access validation failed' });
  }
};

// ============= Student Dashboard =============
/**
 * GET /api/student/dashboard
 * Get student dashboard data - SELF-ACCESS ONLY
 */
router.get('/dashboard', requireAuth, requireRole(ROLES.STUDENT), requireSelfAccess, async (req, res, next) => {
  try {
    // Use cached student data from middleware
    const student = await Student.findById(req.studentData._id)
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
 * Get student's attendance records - SELF-ACCESS ONLY
 */
router.get('/attendance', requireAuth, requireRole(ROLES.STUDENT), requireSelfAccess, async (req, res, next) => {
  try {
    const attendance = await Attendance.findOne({ studentId: req.studentData._id }).lean();
    res.json({ success: true, data: attendance || {} });
  } catch (err) {
    next(err);
  }
});

// ============= Student Grades =============
/**
 * GET /api/student/grades
 * Get student's grades - SELF-ACCESS ONLY
 */
router.get('/grades', requireAuth, requireRole(ROLES.STUDENT), requireSelfAccess, async (req, res, next) => {
  try {
    const grades = await Grade.find({ studentId: req.studentData._id })
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
 * Get student's academic performance - SELF-ACCESS ONLY
 */
router.get('/performance', requireAuth, requireRole(ROLES.STUDENT), requireSelfAccess, async (req, res, next) => {
  try {
    const grades = await Grade.find({ studentId: req.studentData._id }).lean();
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
