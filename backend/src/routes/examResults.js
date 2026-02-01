/**
 * Exam Results Routes
 * Entry: POST/PUT/DELETE results for teachers
 * Approval: GET pending, POST approve/publish for head-teachers
 * Viewing: GET results for parents/students/admins
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { ExamResult } = require('../models/examResult');
const { Exam } = require('../models/exam');
const { Student } = require('../models/student');
const { Staff } = require('../models/staff');
const { Classroom } = require('../models/classroom');
const { validateObjectId } = require('../utils/validation');
const logger = require('../utils/logger');

const router = express.Router();

// ==================== ENTRY ROUTES (Teacher) ====================

/**
 * POST /api/results
 * Create a single exam result (Teacher)
 */
router.post(
  '/',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { exam, student, classroom, subject, score, maxMarks, remarks } = req.body;

    // Validation
    if (!exam || !student || !classroom || !subject || score === undefined) {
      return res.status(400).json({
        error: 'Exam, student, classroom, subject, and score are required'
      });
    }

    if (score < 0 || score > (maxMarks || 100)) {
      return res.status(400).json({
        error: `Score must be between 0 and ${maxMarks || 100}`
      });
    }

    // Verify teacher has access to this classroom (if teacher role)
    if (req.user.role === ROLES.TEACHER) {
      const Staff = require('../models/staff');
      const staff = await Staff.findOne({ user: req.user.id });
      
      if (!staff) {
        return res.status(403).json({ error: 'Staff record not found' });
      }

      const Classroom = require('../models/classroom');
      const classroom_obj = await Classroom.findById(classroom);
      
      if (!classroom_obj || !classroom_obj.classTeacher?.equals(staff._id)) {
        return res.status(403).json({
          error: 'You do not have permission to enter results for this classroom'
        });
      }
    }

    // Check if result already exists
    let result = await ExamResult.findOne({
      exam,
      student,
      subject,
      classroom,
      isDeleted: false
    });

    if (result) {
      return res.status(400).json({
        error: 'Result already exists for this student-subject combination'
      });
    }

    // Create new result
    result = new ExamResult({
      exam,
      student,
      classroom,
      subject,
      score,
      maxMarks: maxMarks || 100,
      remarks,
      submittedBy: req.user.id,
      status: 'draft'
    });

    await result.save();
    await result.populate('exam', 'name');
    await result.populate('student', 'studentId name');
    await result.populate('subject', 'name code');

    logger.info(`Result created (draft): ${result._id}`);

    res.status(201).json({
      success: true,
      message: 'Result created successfully',
      result
    });
  })
);

/**
 * POST /api/results/initialize
 * Initialize draft results for all students in a classroom for an exam
 * Creates empty draft results so teachers can enter grades
 */
router.post(
  '/initialize',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { exam: examId, classroom: classroomId } = req.body;

    // Validation
    if (!examId || !classroomId) {
      return res.status(400).json({
        error: 'Exam and classroom IDs are required'
      });
    }

    // Verify teacher has access
    if (req.user.role === ROLES.TEACHER) {
      const staff = await Staff.findOne({ user: req.user.id });
      
      if (!staff) {
        return res.status(403).json({ error: 'Staff record not found' });
      }

      const classroom_obj = await Classroom.findById(classroomId);
      
      if (!classroom_obj || !classroom_obj.classTeacher?.equals(staff._id)) {
        return res.status(403).json({
          error: 'You do not have permission to initialize results for this classroom'
        });
      }
    }

    try {
      // Get exam
      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ error: 'Exam not found' });
      }

      // Get all students in classroom
      const students = await Student.find({ classroom: classroomId, isDeleted: false });
      if (students.length === 0) {
        return res.status(400).json({ error: 'No students found in this classroom' });
      }

      // Get exam subjects
      const subjects = exam.subjects || [];
      if (subjects.length === 0) {
        return res.status(400).json({ error: 'Exam has no subjects assigned' });
      }

      let createdCount = 0;
      let existingCount = 0;

      // Create results for each student-subject combination
      for (const student of students) {
        for (const subjectId of subjects) {
          // Check if result already exists
          const existing = await ExamResult.findOne({
            exam: examId,
            student: student._id,
            classroom: classroomId,
            subject: subjectId,
            isDeleted: false
          });

          if (!existing) {
            // Create draft result with default values
            const result = new ExamResult({
              exam: examId,
              student: student._id,
              classroom: classroomId,
              subject: subjectId,
              score: 0,
              maxMarks: 100,
              grade: 'F',
              submittedBy: req.user.id,
              status: 'draft'
            });

            await result.save();
            createdCount++;
          } else {
            existingCount++;
          }
        }
      }

      res.json({
        success: true,
        message: `Initialized results: ${createdCount} created, ${existingCount} already exist`,
        created: createdCount,
        existing: existingCount
      });
    } catch (err) {
      logger.error('Error initializing results:', err);
      res.status(500).json({ error: 'Failed to initialize results' });
    }
  })
);

/**
router.post(
  '/batch',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { exam, classroom, subject, results, maxMarks = 100 } = req.body;

    // Validation
    if (!exam || !classroom || !subject || !results || !Array.isArray(results)) {
      return res.status(400).json({
        error: 'Exam, classroom, subject, and results array are required'
      });
    }

    if (results.length === 0) {
      return res.status(400).json({
        error: 'At least one result must be provided'
      });
    }

    // Verify teacher has access
    if (req.user.role === ROLES.TEACHER) {
      const Staff = require('../models/staff');
      const staff = await Staff.findOne({ user: req.user.id });
      
      if (!staff) {
        return res.status(403).json({ error: 'Staff record not found' });
      }

      const Classroom = require('../models/classroom');
      const classroom_obj = await Classroom.findById(classroom);
      
      if (!classroom_obj || !classroom_obj.classTeacher?.equals(staff._id)) {
        return res.status(403).json({
          error: 'You do not have permission to enter results for this classroom'
        });
      }
    }

    const createdResults = [];
    const errors = [];

    for (let i = 0; i < results.length; i++) {
      const { student, score, remarks } = results[i];

      try {
        // Validation
        if (!student) {
          errors.push({ index: i, error: 'Student ID is required' });
          continue;
        }

        if (score === undefined || score === null) {
          errors.push({ index: i, error: 'Score is required' });
          continue;
        }

        if (score < 0 || score > maxMarks) {
          errors.push({
            index: i,
            error: `Score must be between 0 and ${maxMarks}`
          });
          continue;
        }

        // Check if result already exists
        const existing = await ExamResult.findOne({
          exam,
          student,
          subject,
          classroom,
          isDeleted: false
        });

        if (existing) {
          // Update existing result if in draft/submitted state
          if (['draft', 'submitted'].includes(existing.status)) {
            existing.score = score;
            existing.remarks = remarks;
            existing.maxMarks = maxMarks;
            await existing.save();
            createdResults.push(existing);
          } else {
            errors.push({
              index: i,
              error: `Result already exists with status: ${existing.status}`
            });
          }
          continue;
        }

        // Create new result
        const result = new ExamResult({
          exam,
          student,
          classroom,
          subject,
          score,
          maxMarks,
          remarks: remarks || '',
          submittedBy: req.user.id,
          status: 'draft'
        });

        await result.save();
        createdResults.push(result);
      } catch (err) {
        errors.push({
          index: i,
          error: err.message
        });
        logger.error(`Batch result error at index ${i}:`, err);
      }
    }

    logger.info(`Batch results created: ${createdResults.length} total, ${errors.length} errors`);

    res.status(201).json({
      success: true,
      message: `Batch results processed: ${createdResults.length} created, ${errors.length} errors`,
      created: createdResults.length,
      errors,
      results: createdResults
    });
  })
);

/**
 * GET /api/results/classroom/:classroomId/exam/:examId
 * Get all results for a classroom exam
 */
router.get(
  '/classroom/:classroomId/exam/:examId',
  requireAuth,
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.classroomId);
    validateObjectId(req.params.examId);

    // Teacher can view their assigned classrooms (or all for now)
    if (req.user.role === ROLES.TEACHER) {
      // For now, allow teachers to view all classrooms
      // TODO: Restrict to teacher's assigned classrooms once Staff records are properly set up
    }

    const results = await ExamResult.getClassroomExamResults(
      req.params.examId,
      req.params.classroomId
    );

    res.json({
      success: true,
      count: results.length,
      results
    });
  })
);

/**
 * PUT /api/results/:id
 * Update a result (only if draft or submitted)
 */
router.put(
  '/:id',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.id);

    const result = await ExamResult.findById(req.params.id);
    if (!result || result.isDeleted) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (!['draft', 'submitted'].includes(result.status)) {
      return res.status(400).json({
        error: `Cannot update result with status: ${result.status}`
      });
    }

    // Teacher can only update own submissions
    if (req.user.role === ROLES.TEACHER && !result.submittedBy.equals(req.user.id)) {
      return res.status(403).json({
        error: 'You can only update your own results'
      });
    }

    const updates = req.body;
    const allowedUpdates = ['score', 'maxMarks', 'remarks'];

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        result[key] = updates[key];
      }
    });

    await result.save();
    logger.info(`Result updated: ${result._id}`);

    res.json({
      success: true,
      message: 'Result updated successfully',
      result
    });
  })
);

/**
 * DELETE /api/results/:id
 * Delete a result (only if draft)
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.id);

    const result = await ExamResult.findById(req.params.id);
    if (!result || result.isDeleted) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (result.status !== 'draft') {
      return res.status(400).json({
        error: 'Only draft results can be deleted'
      });
    }

    // Teacher can only delete own results
    if (req.user.role === ROLES.TEACHER && !result.submittedBy.equals(req.user.id)) {
      return res.status(403).json({
        error: 'You can only delete your own results'
      });
    }

    result.isDeleted = true;
    await result.save();
    logger.info(`Result deleted: ${result._id}`);

    res.json({
      success: true,
      message: 'Result deleted successfully'
    });
  })
);

/**
 * POST /api/results/:id/submit
 * Submit result for approval
 */
router.post(
  '/:id/submit',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.id);

    const result = await ExamResult.findById(req.params.id);
    if (!result || result.isDeleted) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (result.status !== 'draft') {
      return res.status(400).json({
        error: 'Only draft results can be submitted'
      });
    }

    // Teacher can only submit own results
    if (req.user.role === ROLES.TEACHER && !result.submittedBy.equals(req.user.id)) {
      return res.status(403).json({
        error: 'You can only submit your own results'
      });
    }

    await result.submit(req.user.id);
    logger.info(`Result submitted: ${result._id}`);

    res.json({
      success: true,
      message: 'Result submitted successfully',
      result
    });
  })
);

// ==================== APPROVAL ROUTES (Head-Teacher/Admin) ====================

/**
 * GET /api/results/pending
 * Get all pending results for approval
 */
router.get(
  '/pending',
  requireAuth,
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { classroom, exam, status } = req.query;

    const filters = {};
    if (classroom) filters.classroom = classroom;
    if (exam) filters.exam = exam;

    const results = await ExamResult.getPendingResults(filters);

    res.json({
      success: true,
      count: results.length,
      results
    });
  })
);

/**
 * POST /api/results/:id/approve
 * Approve a submitted result
 */
router.post(
  '/:id/approve',
  requireAuth,
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.id);

    const result = await ExamResult.findById(req.params.id);
    if (!result || result.isDeleted) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (result.status !== 'submitted') {
      return res.status(400).json({
        error: 'Only submitted results can be approved'
      });
    }

    await result.approve(req.user.id);
    logger.info(`Result approved: ${result._id}`);

    res.json({
      success: true,
      message: 'Result approved successfully',
      result
    });
  })
);

/**
 * POST /api/results/:id/publish
 * Publish an approved result (make visible to parents)
 */
router.post(
  '/:id/publish',
  requireAuth,
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.id);

    const result = await ExamResult.findById(req.params.id);
    if (!result || result.isDeleted) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (result.status !== 'approved') {
      return res.status(400).json({
        error: 'Only approved results can be published'
      });
    }

    await result.publish(req.user.id);
    logger.info(`Result published: ${result._id}`);

    res.json({
      success: true,
      message: 'Result published successfully',
      result
    });
  })
);

/**
 * POST /api/results/:id/reject
 * Reject a submitted or approved result
 */
router.post(
  '/:id/reject',
  requireAuth,
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.id);

    const { reason } = req.body;
    const result = await ExamResult.findById(req.params.id);

    if (!result || result.isDeleted) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (!['submitted', 'approved'].includes(result.status)) {
      return res.status(400).json({
        error: 'Only submitted or approved results can be rejected'
      });
    }

    await result.reject(req.user.id, reason);
    logger.info(`Result rejected: ${result._id}`);

    res.json({
      success: true,
      message: 'Result rejected successfully',
      result
    });
  })
);

// ==================== VIEWING ROUTES ====================

/**
 * GET /api/results/student/:studentId
 * Get all published results for a student
 */
router.get(
  '/student/:studentId',
  requireAuth,
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.studentId);

    // Parents can only view their own children
    if (req.user.role === ROLES.PARENT) {
      const Parent = require('../models/parent');
      const parent = await Parent.findOne({ email: req.user.email });

      if (!parent || !parent.students.some(s => s.equals(req.params.studentId))) {
        return res.status(403).json({
          error: 'You do not have permission to view these results'
        });
      }
    }

    const { academicYear } = req.query;
    const results = await ExamResult.getStudentResults(req.params.studentId, {
      academicYear
    });

    res.json({
      success: true,
      count: results.length,
      results
    });
  })
);

/**
 * GET /api/results/exam/:examId/statistics
 * Get statistics for an exam
 */
router.get(
  '/exam/:examId/statistics',
  requireAuth,
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.examId);

    const { classroomId } = req.query;
    const stats = await ExamResult.getExamStatistics(
      req.params.examId,
      classroomId
    );

    res.json({
      success: true,
      statistics: stats[0] || {}
    });
  })
);

module.exports = router;
