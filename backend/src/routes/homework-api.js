/**
 * Homework API Routes
 * Provides endpoints for homework management
 */
const express = require('express');
const multer = require('multer');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { Homework } = require('../models/homework');
const { Classroom } = require('../models/classroom');
const { Student } = require('../models/student');
const { getCurrentAcademicYear } = require('../models/school-settings');
const { validateRequiredFields, validateObjectId, sanitizeString } = require('../utils/validation');
const { processUploadedFiles, deleteUploadedFile } = require('../utils/fileUpload');
const cacheManager = require('../utils/cache');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

/**
 * GET /api/homework/classroom/:classroomId
 * Get homework for a specific classroom
 */
router.get(
  '/classroom/:classroomId',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.PARENT),
  asyncHandler(async (req, res) => {
    try {
      const { classroomId } = req.params;
      const { academicYear } = req.query;

      // Validate classroomId
      if (!validateObjectId(classroomId)) {
        return res.status(400).json({ error: 'Invalid classroom ID' });
      }

      // Get current academic year if not specified
      let currentYear = academicYear;
      if (!currentYear) {
        const settings = await getCurrentAcademicYear();
        currentYear = settings?.year;
      }

      // Build filter
      const filter = { classroomId };
      if (currentYear) {
        filter.academicYear = currentYear;
      }

      // Get homework - always returns array, never null
      let homework = [];
      try {
        homework = await Homework.find(filter)
          .populate('teacher', 'firstName lastName email')
          .populate('classroomId', 'className grade section')
          .sort({ dueDate: -1 })
          .lean();
      } catch (dbErr) {
        console.error('Database error in homework query:', dbErr);
        // Return empty array instead of erroring
        homework = [];
      }

      res.json({
        homework: homework || [],
        classroomId,
        academicYear: currentYear,
        total: (homework || []).length
      });
    } catch (error) {
      console.error('Homework GET error:', error);
      // Always return 200 with empty array on error
      res.json({
        homework: [],
        error: error.message,
        total: 0
      });
    }
  })
);

/**
 * GET /api/homework/:id
 * Get homework details
 */
router.get(
  '/:id',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.PARENT),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid homework ID' });
    }

    const homework = await Homework.findById(id)
      .populate('teacher', 'firstName lastName email')
      .populate('classroomId', 'className grade section')
      .populate('submissions.student', 'firstName lastName studentId')
      .populate('submissions.gradedBy', 'firstName lastName');

    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    res.json(homework);
  })
);

/**
 * POST /api/homework
 * Create new homework
 */
router.post(
  '/',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER),
  asyncHandler(async (req, res) => {
    const { title, description, classroomId, subject, dueDate, academicYear, term } = req.body || {};

    // Validate required fields
    const requiredFields = ['title', 'description', 'classroomId', 'subject', 'dueDate'];
    const validation = validateRequiredFields({ title, description, classroomId, subject, dueDate }, requiredFields);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Validate classroomId
    if (!validateObjectId(classroomId)) {
      return res.status(400).json({ error: 'Invalid classroom ID' });
    }

    // Validate due date format
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      return res.status(400).json({ error: 'Invalid due date format' });
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = sanitizeString(description);
    const sanitizedSubject = sanitizeString(subject);

    // Get current academic year if not specified
    const currentYear = academicYear || (await getCurrentAcademicYear())?.year;

    // Create homework
    const homework = new Homework({
      title: sanitizedTitle,
      description: sanitizedDescription,
      classroomId,
      subject: sanitizedSubject,
      teacher: req.user.id,
      dueDate: dueDateObj,
      academicYear: currentYear,
      term: term || 'General',
      createdBy: req.user.id
    });

    await homework.save();

    // Populate teacher info
    await homework.populate('teacher', 'firstName lastName email');
    await homework.populate('classroomId', 'className grade section');

    // Invalidate cache
    cacheManager.delete(`homework-classroom-${classroomId}`);

    res.status(201).json({
      message: 'Homework created successfully',
      homework
    });
  })
);

/**
 * PUT /api/homework/:id
 * Update homework
 */
router.put(
  '/:id',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, subject, dueDate, status, term } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid homework ID' });
    }

    const homework = await Homework.findById(id);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Check authorization
    if (homework.teacher.toString() !== req.user.id && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.HEAD_TEACHER) {
      return res.status(403).json({ error: 'Not authorized to update this homework' });
    }

    // Update fields
    if (title) homework.title = sanitizeString(title);
    if (description) homework.description = sanitizeString(description);
    if (subject) homework.subject = sanitizeString(subject);
    if (dueDate) homework.dueDate = new Date(dueDate);
    if (status && ['pending', 'assigned', 'completed'].includes(status)) homework.status = status;
    if (term) homework.term = term;

    await homework.save();
    await homework.populate('teacher', 'firstName lastName email');
    await homework.populate('classroomId', 'className grade section');

    // Invalidate cache
    cacheManager.delete(`homework-classroom-${homework.classroomId}`);

    res.json({
      message: 'Homework updated successfully',
      homework
    });
  })
);

/**
 * DELETE /api/homework/:id
 * Delete homework
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid homework ID' });
    }

    const homework = await Homework.findById(id);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Check authorization
    if (homework.teacher.toString() !== req.user.id && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.HEAD_TEACHER) {
      return res.status(403).json({ error: 'Not authorized to delete this homework' });
    }

    const classroomId = homework.classroomId;
    await Homework.findByIdAndDelete(id);

    // Invalidate cache
    cacheManager.delete(`homework-classroom-${classroomId}`);

    res.json({ message: 'Homework deleted successfully' });
  })
);

/**
 * POST /api/homework/:id/submit
 * Submit homework (student) with optional file attachments
 */
router.post(
  '/:id/submit',
  requireAuth,
  requireRole(ROLES.STUDENT),
  upload.array('files', 20), // Allow up to 20 files
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid homework ID' });
    }

    const homework = await Homework.findById(id);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Process uploaded files if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
      try {
        attachments = processUploadedFiles(req.files, 'submissions');
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }

    // Find or create submission
    let submission = homework.submissions.find(s => s.student.toString() === req.user.id);

    if (!submission) {
      submission = {
        student: req.user.id,
        status: 'submitted',
        submissionDate: new Date(),
        attachments: attachments
      };
      homework.submissions.push(submission);
    } else {
      submission.status = 'submitted';
      submission.submissionDate = new Date();
      submission.attachments = attachments;
    }

    await homework.save();
    await homework.populate('submissions.student', 'firstName lastName email studentId');
    await homework.populate('submissions.gradedBy', 'firstName lastName');

    res.json({
      message: 'Homework submitted successfully',
      homework,
      submission: homework.submissions.find(s => s.student.toString() === req.user.id)
    });
  })
);

/**
 * POST /api/homework/:id/grade
 * Grade homework submission (teacher)
 */
router.post(
  '/:id/grade',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { studentId, grade, feedback } = req.body;

    if (!validateObjectId(id) || !validateObjectId(studentId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const homework = await Homework.findById(id);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Find submission
    const submission = homework.submissions.find(s => s.student.toString() === studentId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Update submission
    submission.status = 'graded';
    submission.grade = grade;
    submission.feedback = feedback || '';
    submission.gradedBy = req.user.id;
    submission.gradedAt = new Date();

    await homework.save();

    res.json({
      message: 'Homework graded successfully',
      homework
    });
  })
);

module.exports = router;
