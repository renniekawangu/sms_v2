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
      validateObjectId(classroomId);

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

    validateObjectId(id);

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
    validateObjectId(classroomId);

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

    validateObjectId(id);

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
    
    // Update attachments if provided (for removing attachments)
    if (req.body.attachments !== undefined) {
      // Parse attachments if it's a string (JSON)
      let attachments = req.body.attachments;
      if (typeof attachments === 'string') {
        try {
          attachments = JSON.parse(attachments);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid attachments format' });
        }
      }
      homework.attachments = attachments;
    }

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

    validateObjectId(id);

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

    validateObjectId(id);

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

    validateObjectId(id);
    validateObjectId(studentId);

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

/**
 * POST /api/homework/create-with-files
 * Create homework with file uploads (for teachers)
 */
router.post(
  '/create-with-files',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER),
  upload.array('files', 10),
  asyncHandler(async (req, res) => {
    const { title, description, classroomId, subject, dueDate, academicYear, term } = req.body;

    // Validate required fields
    const requiredFields = ['title', 'description', 'classroomId', 'subject', 'dueDate'];
    const validation = validateRequiredFields({ title, description, classroomId, subject, dueDate }, requiredFields);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Validate classroomId
    validateObjectId(classroomId);

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
      createdBy: req.user.id,
      attachments: [] // Will populate with file data
    });

    // Process uploaded files if any
    if (req.files && req.files.length > 0) {
      try {
        const uploadedFiles = await processUploadedFiles(req.files, 'homework/materials');
        homework.attachments = uploadedFiles;
      } catch (uploadErr) {
        console.error('File upload error:', uploadErr);
        return res.status(400).json({ error: 'Failed to upload files: ' + uploadErr.message });
      }
    }

    await homework.save();

    // Populate teacher info
    await homework.populate('teacher', 'firstName lastName email');
    await homework.populate('classroomId', 'className grade section');

    // Invalidate cache
    cacheManager.delete(`homework-classroom-${classroomId}`);

    res.status(201).json({
      message: 'Homework created successfully with materials',
      homework
    });
  })
);

/**
 * PUT /api/homework/:id/add-files
 * Add files to existing homework
 */
router.put(
  '/:id/add-files',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER),
  upload.array('files', 10),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    validateObjectId(id);

    const homework = await Homework.findById(id);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Check authorization
    if (homework.teacher.toString() !== req.user.id && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.HEAD_TEACHER) {
      return res.status(403).json({ error: 'Not authorized to update this homework' });
    }

    // Process uploaded files if any
    if (req.files && req.files.length > 0) {
      try {
        const uploadedFiles = await processUploadedFiles(req.files, 'homework/materials');
        // Add new files to existing attachments
        homework.attachments = [...(homework.attachments || []), ...uploadedFiles];
      } catch (uploadErr) {
        console.error('File upload error:', uploadErr);
        return res.status(400).json({ error: 'Failed to upload files: ' + uploadErr.message });
      }
    }

    await homework.save();
    await homework.populate('teacher', 'firstName lastName email');
    await homework.populate('classroomId', 'className grade section');

    // Invalidate cache
    cacheManager.delete(`homework-classroom-${homework.classroomId}`);

    res.json({
      message: 'Files added successfully',
      homework
    });
  })
);

/**
 * GET /api/homework/:id/attachment/:attachmentId/download
 * Download homework attachment (teacher-uploaded materials)
 * Accessible by teachers, parents (of students in the classroom), and admins
 */
router.get(
  '/:id/attachment/:attachmentId/download',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.PARENT, ROLES.STUDENT),
  asyncHandler(async (req, res) => {
    const { id, attachmentId } = req.params;
    const fs = require('fs');
    const path = require('path');

    validateObjectId(id);

    const homework = await Homework.findById(id)
      .populate('classroomId', 'className grade section')
      .lean();

    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Find the attachment - try _id first, then filename
    let attachment = null;
    if (attachmentId && attachmentId.length === 24) {
      // Try as ObjectId first (24 hex characters)
      try {
        const mongoose = require('mongoose');
        const attachmentObjectId = new mongoose.Types.ObjectId(attachmentId);
        attachment = homework.attachments?.find(
          att => att._id && att._id.toString() === attachmentObjectId.toString()
        );
      } catch (e) {
        // Not a valid ObjectId, continue to filename check
      }
    }
    
    // If not found by _id, try filename
    if (!attachment) {
      attachment = homework.attachments?.find(
        att => att.filename === attachmentId || att.url?.includes(attachmentId)
      );
    }

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Authorization check
    const userRole = req.user.role;
    let hasAccess = false;

    if (userRole === ROLES.ADMIN || userRole === ROLES.HEAD_TEACHER) {
      hasAccess = true;
    } else if (userRole === ROLES.TEACHER) {
      // Teacher can access if they created the homework
      hasAccess = homework.teacher?.toString() === req.user.id;
    } else if (userRole === ROLES.PARENT || userRole === ROLES.STUDENT) {
      // Parent/Student can access if they are linked to a student in the classroom
      const { Student } = require('../models/student');
      const { Parent } = require('../models/parent');
      const { User } = require('../models/user');

      const user = await User.findById(req.user.id).lean();
      
      if (userRole === ROLES.STUDENT) {
        // Student can access if they are in the classroom
        const student = await Student.findById(req.user.id).lean();
        hasAccess = student?.classroomId?.toString() === homework.classroomId?._id?.toString();
      } else {
        // Parent can access if they have a child in the classroom
        let parent = null;
        if (user.parentId) {
          parent = await Parent.findById(user.parentId).lean();
        } else {
          parent = await Parent.findOne({ email: user.email }).lean();
        }

        if (parent) {
          const studentsInClassroom = await Student.find({
            _id: { $in: parent.students || [] },
            classroomId: homework.classroomId?._id
          }).lean();
          hasAccess = studentsInClassroom.length > 0;
        }
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Construct file path
    // attachment.url is like /uploads/homework/materials/filename.pdf
    // We need to get the actual file path
    const filename = attachment.filename || attachment.url?.split('/').pop();
    if (!filename) {
      return res.status(404).json({ error: 'Filename not found in attachment' });
    }
    const filePath = path.join(__dirname, '../../uploads/homework/materials', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }

    // Set headers for download
    const originalName = attachment.name || filename;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  })
);

/**
 * GET /api/homework/:id/submission/:studentId/attachment/:attachmentId/download
 * Download student submission attachment
 * Accessible by the student who submitted, their parent, teacher of the homework, and admins
 */
router.get(
  '/:id/submission/:studentId/attachment/:attachmentId/download',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.PARENT, ROLES.STUDENT),
  asyncHandler(async (req, res) => {
    const { id, studentId, attachmentId } = req.params;
    const fs = require('fs');
    const path = require('path');

    validateObjectId(id);
    validateObjectId(studentId);

    const homework = await Homework.findById(id)
      .populate('classroomId', 'className grade section')
      .lean();

    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Find the student submission
    const submission = homework.submissions?.find(
      sub => sub.student?.toString() === studentId || sub.student === studentId
    );

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Find the attachment
    let attachment = null;
    if (attachmentId && attachmentId.length === 24) {
      // Try as ObjectId first
      try {
        const mongoose = require('mongoose');
        const attachmentObjectId = new mongoose.Types.ObjectId(attachmentId);
        attachment = submission.attachments?.find(
          att => att._id && att._id.toString() === attachmentObjectId.toString()
        );
      } catch (e) {
        // Not a valid ObjectId, continue to filename check
      }
    }
    
    // If not found by _id, try filename
    if (!attachment) {
      attachment = submission.attachments?.find(
        att => att.filename === attachmentId || att.url?.includes(attachmentId) || att.name === attachmentId
      );
    }

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Authorization check
    const userRole = req.user.role;
    let hasAccess = false;

    if (userRole === ROLES.ADMIN || userRole === ROLES.HEAD_TEACHER) {
      hasAccess = true;
    } else if (userRole === ROLES.TEACHER) {
      // Teacher can access if they created the homework
      hasAccess = homework.teacher?.toString() === req.user.id;
    } else if (userRole === ROLES.STUDENT) {
      // Student can access their own submission
      hasAccess = studentId === req.user.id;
    } else if (userRole === ROLES.PARENT) {
      // Parent can access if the student is their child
      const { Parent } = require('../models/parent');
      const { User } = require('../models/user');

      const user = await User.findById(req.user.id).lean();
      let parent = null;
      if (user.parentId) {
        parent = await Parent.findById(user.parentId).lean();
      } else {
        parent = await Parent.findOne({ email: user.email }).lean();
      }

      if (parent) {
        hasAccess = parent.students?.some(s => s.toString() === studentId);
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Construct file path
    // attachment.url is like /uploads/submissions/filename.pdf
    const filename = attachment.filename || attachment.url?.split('/').pop();
    if (!filename) {
      return res.status(404).json({ error: 'Filename not found in attachment' });
    }
    const filePath = path.join(__dirname, '../../uploads/submissions', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }

    // Set headers for download
    const originalName = attachment.name || filename;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  })
);

/**
 * POST /api/homework/migrate-paths (TEMPORARY - Admin only)
 * Migrate attachment paths from old structure to new structure
 */
router.post(
  '/migrate-paths',
  requireAuth,
  requireRole(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    try {
      const result = await Homework.updateMany(
        { 'attachments.url': { $regex: '/uploads/homework/homework/materials/' } },
        [
          {
            $set: {
              attachments: {
                $map: {
                  input: '$attachments',
                  as: 'att',
                  in: {
                    _id: '$$att._id',
                    filename: '$$att.filename',
                    url: {
                      $replaceOne: {
                        input: '$$att.url',
                        find: '/uploads/homework/homework/materials/',
                        replacement: '/uploads/homework/materials/'
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      );

      res.json({
        message: 'Paths migrated successfully',
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      res.status(500).json({
        error: 'Migration failed',
        message: error.message
      });
    }
  })
);

module.exports = router;
