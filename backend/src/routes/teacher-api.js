/**
 * Teacher API Routes for Frontend SPA
 * Provides JSON API endpoints for teacher dashboard
 */
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, requirePermission } = require('../middleware/rbac');
const { ROLES, PERMISSIONS } = require('../config/rbac');
const { Teacher } = require('../models/teacher');
const { Classroom } = require('../models/classroom');
const Grade = require('../models/grades');
const { Attendance, markSubjectAttendance } = require('../models/attendance');
const { Student } = require('../models/student');
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
router.get('/classrooms', requireAuth, requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER), async (req, res, next) => {
  try {
    // Admin and Head Teacher can see all classrooms
    if (req.user.role === 'admin' || req.user.role === 'head-teacher') {
      const classrooms = await Classroom.find().lean();
      return res.json({ success: true, data: classrooms });
    }

    // Teacher sees only their assigned classrooms
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
router.get('/classroom/:classroomId/students', requireAuth, requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER), async (req, res, next) => {
  try {
    // Admin and Head Teacher can access any classroom
    if (req.user.role === 'admin' || req.user.role === 'head-teacher') {
      const students = await Student.find({ classroomId: req.params.classroomId }).lean();
      return res.json({ success: true, data: students });
    }

    // Teacher needs to verify access
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
router.get('/classroom/:classroomId/attendance', requireAuth, requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER), async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    
    // Check authorization for teachers (admins and head teachers have full access)
    if (req.user.role === ROLES.TEACHER) {
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher || !teacher.classroomIds || !teacher.classroomIds.some(id => id.toString() === classroomId)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    const students = await Student.find({ classroomId }).select('_id').lean();
    const studentIds = students.map(s => s._id);

    const attendance = await Attendance.find({ studentId: { $in: studentIds } })
      .populate('studentId', 'firstName lastName name email')
      .populate('markedBy', 'email')
      .lean();
    
    res.json({ success: true, data: attendance });
  } catch (err) {
    next(err);
  }
});

// Bulk mark attendance for a subject and date
router.post('/attendance/mark', requireAuth, requirePermission(PERMISSIONS.MARK_ATTENDANCE), async (req, res, next) => {
  try {
    const { subject, date, records } = req.body;

    if (!subject || !date || !Array.isArray(records)) {
      return res.status(400).json({ message: 'subject, date and records are required' });
    }

    // Admin and Head Teacher can mark attendance for any students
    if (req.user.role === 'admin' || req.user.role === 'head-teacher') {
      const result = await markSubjectAttendance({
        subject,
        date,
        records,
        markedBy: req.user.id
      });
      return res.json({ success: true, updated: result.success.length, errors: result.errors });
    }

    // Teacher needs to verify classroom access
    const teacher = await Teacher.findOne({ userId: req.user.id }).lean();
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Verify access: only allow students from teacher's classrooms
    const classroomIds = (teacher.classroomIds || []).map(id => String(id));
    const allowedStudents = await Student.find({ classroomId: { $in: classroomIds } }).select('_id').lean();
    const allowedSet = new Set(allowedStudents.map(s => String(s._id)));

    const filtered = records.filter(r => allowedSet.has(String(r.studentId)));
    if (filtered.length !== records.length) {
      logger.warn('Some attendance records were ignored due to classroom access restrictions');
    }

    const result = await markSubjectAttendance({
      subject,
      date,
      records: filtered,
      markedBy: req.user.id
    });

    return res.json({ success: true, updated: result.success.length, errors: result.errors });
  } catch (err) {
    next(err);
  }
});

// Teacher attendance records (filterable by date/subject)
router.get('/attendance', requireAuth, requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER), async (req, res, next) => {
  try {
    const { date, subject } = req.query;
    let query = {};

    // Admin and Head Teacher can see all attendance
    if (req.user.role === 'admin' || req.user.role === 'head-teacher') {
      if (date) {
        const start = new Date(date);
        const end = new Date(date);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        query.date = { $gte: start, $lt: end };
      }
      if (subject) {
        query.subject = subject;
      }
      const records = await Attendance.find(query).lean().sort({ date: -1 });
      return res.json({ success: true, data: records });
    }

    // Teacher sees only their classroom students
    const teacher = await Teacher.findOne({ userId: req.user.id }).lean();
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const classroomIds = (teacher.classroomIds || []).map(id => String(id));
    const students = await Student.find({ classroomId: { $in: classroomIds } }).select('_id').lean();
    const studentIds = students.map(s => s._id);

    query = { studentId: { $in: studentIds } };

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lt: end };
    }
    if (subject) {
      query.subject = subject;
    }

    const records = await Attendance.find(query).lean().sort({ date: -1 });
    return res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
