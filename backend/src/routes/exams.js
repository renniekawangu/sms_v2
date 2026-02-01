/**
 * Exam Management Routes
 * POST   /api/exams              - Create exam
 * GET    /api/exams              - List all exams
 * GET    /api/exams/:id          - Get exam details
 * PUT    /api/exams/:id          - Update exam
 * DELETE /api/exams/:id          - Delete exam
 * POST   /api/exams/:id/publish  - Publish exam
 */

const express = require('express');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { Exam } = require('../models/exam');
const { ExamResult } = require('../models/examResult');
const { validateObjectId } = require('../utils/validation');
const logger = require('../utils/logger');

const router = express.Router();

// ==================== CREATE ====================
/**
 * POST /api/exams
 * Create a new exam (Admin/Head-Teacher only)
 */
router.post(
  '/',
  requireAuth,
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { name, examType, term, academicYear, classrooms, subjects, totalMarks, scheduledDate, description } = req.body;

    // Validation
    if (!name || !term || !academicYear) {
      return res.status(400).json({ error: 'Name, term, and academic year are required' });
    }

    const exam = new Exam({
      name,
      examType: examType || 'unit-test',
      term,
      academicYear,
      classrooms: classrooms || [],
      subjects: subjects || [],
      totalMarks: totalMarks || 100,
      scheduledDate,
      description,
      createdBy: req.user.id
    });

    await exam.save();
    logger.info(`Exam created: ${exam._id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      exam
    });
  })
);

// ==================== READ ====================
/**
 * GET /api/exams
 * List all exams with filters
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { academicYear, term, status, examType } = req.query;
    const query = { isDeleted: false };

    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    if (status) query.status = status;
    if (examType) query.examType = examType;

    const exams = await Exam.find(query)
      .populate('classrooms', 'name level')
      .populate('subjects', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: exams.length,
      exams
    });
  })
);

/**
 * GET /api/exams/:id
 * Get exam details with statistics
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.id);

    const exam = await Exam.findById(req.params.id)
      .populate('classrooms', 'name level')
      .populate('subjects', 'name code')
      .populate('createdBy', 'name email');

    if (!exam || exam.isDeleted) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Get results count
    const resultsCount = await ExamResult.countDocuments({ exam: exam._id });
    const pendingCount = await ExamResult.countDocuments({
      exam: exam._id,
      status: { $in: ['draft', 'submitted'] }
    });

    res.json({
      success: true,
      exam,
      statistics: {
        totalResults: resultsCount,
        pendingResults: pendingCount,
        approvedResults: await ExamResult.countDocuments({
          exam: exam._id,
          status: 'approved'
        }),
        publishedResults: await ExamResult.countDocuments({
          exam: exam._id,
          status: 'published'
        })
      }
    });
  })
);

// ==================== UPDATE ====================
/**
 * PUT /api/exams/:id
 * Update exam (only if draft status)
 */
router.put(
  '/:id',
  requireAuth,
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.id);

    const exam = await Exam.findById(req.params.id);
    if (!exam || exam.isDeleted) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft exams can be updated' });
    }

    const updates = req.body;
    const allowedUpdates = ['name', 'examType', 'term', 'academicYear', 'classrooms', 'subjects', 'totalMarks', 'scheduledDate', 'description', 'passingMarks'];
    const hasValidUpdates = Object.keys(updates).every(key => allowedUpdates.includes(key));

    if (!hasValidUpdates) {
      return res.status(400).json({ error: 'Invalid update fields' });
    }

    Object.assign(exam, updates);
    exam.updatedBy = req.user.id;
    await exam.save();

    logger.info(`Exam updated: ${exam._id}`);

    res.json({
      success: true,
      message: 'Exam updated successfully',
      exam
    });
  })
);

// ==================== DELETE ====================
/**
 * DELETE /api/exams/:id
 * Soft delete exam (only if draft status)
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.id);

    const exam = await Exam.findById(req.params.id);
    if (!exam || exam.isDeleted) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft exams can be deleted' });
    }

    exam.isDeleted = true;
    await exam.save();

    logger.info(`Exam deleted: ${exam._id}`);

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  })
);

// ==================== ACTIONS ====================
/**
 * POST /api/exams/:id/publish
 * Publish exam (make it available for results entry)
 */
router.post(
  '/:id/publish',
  requireAuth,
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.id);

    const exam = await Exam.findById(req.params.id);
    if (!exam || exam.isDeleted) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft exams can be published' });
    }

    await exam.publish();

    logger.info(`Exam published: ${exam._id}`);

    res.json({
      success: true,
      message: 'Exam published successfully',
      exam
    });
  })
);

/**
 * POST /api/exams/:id/close
 * Close exam (no more results can be entered)
 */
router.post(
  '/:id/close',
  requireAuth,
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    validateObjectId(req.params.id);

    const exam = await Exam.findById(req.params.id);
    if (!exam || exam.isDeleted) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.status === 'closed') {
      return res.status(400).json({ error: 'Exam is already closed' });
    }

    await exam.close();

    logger.info(`Exam closed: ${exam._id}`);

    res.json({
      success: true,
      message: 'Exam closed successfully',
      exam
    });
  })
);

module.exports = router;
