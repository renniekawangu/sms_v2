/**
 * Teacher API Routes for Frontend SPA
 * Provides JSON API endpoints for teacher dashboard
 */
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, requirePermission } = require('../middleware/rbac');
const { ROLES, PERMISSIONS } = require('../config/rbac');
const Teacher = require('../models/teacher');
const Classroom = require('../models/classroom');
const Grade = require('../models/grades');
const Attendance = require('../models/attendance');
const Student = require('../models/student');
const logger = require('../utils/logger');

// Get teacher dashboard
router.get('/dashboard', requireAuth, requireRole(ROLES.TEACHER), async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id })
      .populate('classroomIds')
      .populate('subjectIds');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const classCount = teacher.classroomIds?.length || 0;
    const subjectCount = teacher.subjectIds?.length || 0;

    res.json({
      success: true,
      data: {
        teacher,
        classroomCount: classCount,
        subjectCount: subjectCount
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get assigned classrooms
router.get('/classrooms', requireAuth, requireRole(ROLES.TEACHER), async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id })
      .populate('classroomIds');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    res.json({ success: true, data: teacher.classroomIds || [] });
  } catch (err) {
    next(err);
  }
});

// Get students in classroom
router.get('/classroom/:classroomId/students', requireAuth, requireRole(ROLES.TEACHER), async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify teacher has access to this classroom
    const hasAccess = teacher.classroomIds.some(id => id.toString() === req.params.classroomId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized access to classroom' });
    }

    const students = await Student.find({ classroomId: req.params.classroomId }).lean();
    res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
});

// Record/update grades (permission-based)
router.post('/grades', requireAuth, requirePermission(PERMISSIONS.MANAGE_GRADES), async (req, res, next) => {
  try {
    const { studentId, subjectId, score, remarks } = req.body;

    if (!studentId || !subjectId || score === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const grade = await Grade.findOneAndUpdate(
      { studentId, subjectId },
      { score, remarks, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    logger.info(`Grade recorded for student ${studentId} in subject ${subjectId}`);
    res.json({ success: true, data: grade });
  } catch (err) {
    next(err);
  }
});

// Record attendance
router.post('/attendance', requireAuth, requirePermission(PERMISSIONS.MANAGE_ATTENDANCE), async (req, res, next) => {
  try {
    const { classroomId, attendanceDate, records } = req.body;

    if (!classroomId || !attendanceDate || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid attendance data' });
    }

    const teacher = await Teacher.findOne({ userId: req.user.id });
    const hasAccess = teacher.classroomIds.some(id => id.toString() === classroomId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const results = await Promise.all(
      records.map(record =>
        Attendance.findOneAndUpdate(
          { studentId: record.studentId, attendanceDate },
          { status: record.status, remarks: record.remarks },
          { upsert: true, new: true }
        )
      )
    );

    logger.info(`Attendance recorded for classroom ${classroomId} on ${attendanceDate}`);
    res.json({ success: true, recordsUpdated: results.length });
  } catch (err) {
    next(err);
  }
});

// Get class attendance summary
router.get('/classroom/:classroomId/attendance', requireAuth, requireRole(ROLES.TEACHER), async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const teacher = await Teacher.findOne({ userId: req.user.id });
    
    const hasAccess = teacher.classroomIds.some(id => id.toString() === classroomId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const students = await Student.find({ classroomId }).select('_id').lean();
    const studentIds = students.map(s => s._id);

    const attendance = await Attendance.find({ studentId: { $in: studentIds } }).lean();
    
    res.json({ success: true, data: attendance });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
