/**
 * Timetable API Routes
 * Comprehensive timetable management following the prototype structure
 */
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { TimetableSchedule, Instructor, Course } = require('../models/timetable-container');
const { Classroom } = require('../models/classroom');
const { Staff } = require('../models/staff');
const { Subject } = require('../models/subjects');
const mongoose = require('mongoose');

const router = express.Router();

// ============= Timetable Schedule API =============

/**
 * GET /api/timetable-schedules
 * Get all timetable schedules
 */
router.get('/schedules', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), 
  asyncHandler(async (req, res) => {
    const { academicYear, term, classroomId, isActive } = req.query;
    
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    if (classroomId) query.classroomId = classroomId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const schedules = await TimetableSchedule.find(query)
      .populate('classroomId', 'name grade section capacity')
      .populate('timetable.periods.instructorId', 'firstName lastName email')
      .sort({ academicYear: -1, term: 1, 'classroomId.grade': 1 });
    
    res.json(schedules);
  })
);

/**
 * GET /api/timetable-schedules/classroom/:classroomId
 * Get timetable schedule for a specific classroom
 */
router.get('/schedules/classroom/:classroomId', 
  requireAuth,
  asyncHandler(async (req, res) => {
    const { classroomId } = req.params;
    const { academicYear, term } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({ error: 'Invalid classroom ID' });
    }
    
    const query = { 
      classroomId,
      isActive: true
    };
    
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    
    const schedule = await TimetableSchedule.findOne(query)
      .populate('classroomId', 'name grade section capacity')
      .populate('timetable.periods.instructorId', 'firstName lastName email');
    
    if (!schedule) {
      return res.status(404).json({ error: 'Timetable schedule not found' });
    }
    
    res.json(schedule);
  })
);

/**
 * GET /api/timetable-schedules/instructor/:instructorId
 * Get timetable schedule for a specific instructor
 */
router.get('/schedules/instructor/:instructorId', 
  requireAuth,
  asyncHandler(async (req, res) => {
    const { instructorId } = req.params;
    const { academicYear, term } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ error: 'Invalid instructor ID' });
    }
    
    const query = { 
      'timetable.periods.instructorId': instructorId,
      isActive: true
    };
    
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    
    const schedules = await TimetableSchedule.find(query)
      .populate('classroomId', 'name grade section')
      .populate('timetable.periods.instructorId', 'firstName lastName email');
    
    // Extract only periods for this instructor
    const instructorSchedule = schedules.map(schedule => {
      const filteredTimetable = schedule.timetable.map(day => ({
        day: day.day,
        periods: day.periods.filter(p => p.instructorId._id.equals(instructorId))
      })).filter(day => day.periods.length > 0);
      
      return {
        classroom: schedule.classroomId,
        academicYear: schedule.academicYear,
        term: schedule.term,
        timetable: filteredTimetable
      };
    });
    
    res.json(instructorSchedule);
  })
);

/**
 * GET /api/timetable-schedules/:id
 * Get a specific timetable schedule by ID
 */
router.get('/schedules/:id', 
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }
    
    const schedule = await TimetableSchedule.findById(req.params.id)
      .populate('classroomId', 'name grade section capacity')
      .populate('timetable.periods.instructorId', 'firstName lastName email');
    
    if (!schedule) {
      return res.status(404).json({ error: 'Timetable schedule not found' });
    }
    
    res.json(schedule);
  })
);

/**
 * POST /api/timetable-schedules
 * Create a new timetable schedule
 */
router.post('/schedules', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), 
  asyncHandler(async (req, res) => {
    const { classroomId, timetable, academicYear, term, isActive } = req.body;
    
    if (!classroomId) {
      return res.status(400).json({ error: 'classroomId is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({ error: 'Invalid classroom ID' });
    }
    
    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    // Check if schedule already exists for this classroom/term
    const existing = await TimetableSchedule.findOne({
      classroomId,
      academicYear: academicYear || new Date().getFullYear().toString(),
      term: term || 'Term 1'
    });
    
    if (existing) {
      return res.status(409).json({ 
        error: 'Timetable schedule already exists for this classroom and term' 
      });
    }
    
    const schedule = new TimetableSchedule({
      classroomId,
      timetable: timetable || [],
      academicYear: academicYear || new Date().getFullYear().toString(),
      term: term || 'Term 1',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });
    
    await schedule.save();
    
    const populated = await TimetableSchedule.findById(schedule._id)
      .populate('classroomId', 'name grade section capacity')
      .populate('timetable.periods.instructorId', 'firstName lastName email');
    
    res.status(201).json(populated);
  })
);

/**
 * PUT /api/timetable-schedules/:id
 * Update a timetable schedule
 */
router.put('/schedules/:id', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), 
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }
    
    const { timetable, isActive, term, academicYear } = req.body;
    
    const updateData = {
      updatedBy: req.user.id
    };
    
    if (timetable) updateData.timetable = timetable;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (term) updateData.term = term;
    if (academicYear) updateData.academicYear = academicYear;
    
    const schedule = await TimetableSchedule.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    )
      .populate('classroomId', 'name grade section capacity')
      .populate('timetable.periods.instructorId', 'firstName lastName email');
    
    if (!schedule) {
      return res.status(404).json({ error: 'Timetable schedule not found' });
    }
    
    res.json(schedule);
  })
);

/**
 * DELETE /api/timetable-schedules/:id
 * Delete a timetable schedule
 */
router.delete('/schedules/:id', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), 
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }
    
    const schedule = await TimetableSchedule.findByIdAndDelete(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Timetable schedule not found' });
    }
    
    res.json({ message: 'Timetable schedule deleted successfully' });
  })
);

// ============= Instructor API =============

/**
 * GET /api/timetable-instructors
 * Get all instructors
 */
router.get('/instructors', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), 
  asyncHandler(async (req, res) => {
    const instructors = await Instructor.find()
      .populate('staffId', 'firstName lastName email phone');
    
    res.json(instructors);
  })
);

/**
 * GET /api/timetable-instructors/:id
 * Get a specific instructor
 */
router.get('/instructors/:id', 
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid instructor ID' });
    }
    
    const instructor = await Instructor.findById(req.params.id)
      .populate('staffId', 'firstName lastName email phone');
    
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }
    
    res.json(instructor);
  })
);

/**
 * GET /api/timetable-instructors/staff/:staffId
 * Get instructor by staff ID
 */
router.get('/instructors/staff/:staffId', 
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.staffId)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }
    
    const instructor = await Instructor.findOne({ staffId: req.params.staffId })
      .populate('staffId', 'firstName lastName email phone');
    
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }
    
    res.json(instructor);
  })
);

/**
 * POST /api/timetable-instructors
 * Create a new instructor
 */
router.post('/instructors', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), 
  asyncHandler(async (req, res) => {
    const { staffId, subjects, maxHoursPerWeek, availability } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ error: 'staffId is required' });
    }
    
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'subjects array is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }
    
    // Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    // Check if instructor already exists for this staff
    const existing = await Instructor.findOne({ staffId });
    if (existing) {
      return res.status(409).json({ error: 'Instructor already exists for this staff member' });
    }
    
    const instructor = new Instructor({
      staffId,
      subjects,
      maxHoursPerWeek: maxHoursPerWeek || 40,
      availability: availability || [],
      createdBy: req.user.id
    });
    
    await instructor.save();
    
    const populated = await Instructor.findById(instructor._id)
      .populate('staffId', 'firstName lastName email phone');
    
    res.status(201).json(populated);
  })
);

/**
 * PUT /api/timetable-instructors/:id
 * Update an instructor
 */
router.put('/instructors/:id', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), 
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid instructor ID' });
    }
    
    const { subjects, maxHoursPerWeek, availability } = req.body;
    
    const updateData = {};
    if (subjects) updateData.subjects = subjects;
    if (maxHoursPerWeek) updateData.maxHoursPerWeek = maxHoursPerWeek;
    if (availability) updateData.availability = availability;
    
    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('staffId', 'firstName lastName email phone');
    
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }
    
    res.json(instructor);
  })
);

/**
 * DELETE /api/timetable-instructors/:id
 * Delete an instructor
 */
router.delete('/instructors/:id', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), 
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid instructor ID' });
    }
    
    const instructor = await Instructor.findByIdAndDelete(req.params.id);
    
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }
    
    res.json({ message: 'Instructor deleted successfully' });
  })
);

// ============= Course API =============

/**
 * GET /api/timetable-courses
 * Get all courses
 */
router.get('/courses', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), 
  asyncHandler(async (req, res) => {
    const { classroomId, academicYear, term } = req.query;
    
    const query = {};
    if (classroomId) query.classroomId = classroomId;
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    
    const courses = await Course.find(query)
      .populate('classroomId', 'name grade section')
      .populate('subjects.id', 'name code classLevel teacherId');
    
    res.json(courses);
  })
);

/**
 * GET /api/timetable-courses/classroom/:classroomId
 * Get courses for a specific classroom
 */
router.get('/courses/classroom/:classroomId', 
  requireAuth,
  asyncHandler(async (req, res) => {
    const { classroomId } = req.params;
    const { academicYear, term } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({ error: 'Invalid classroom ID' });
    }
    
    const query = { classroomId };
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    
    const course = await Course.findOne(query)
      .populate('classroomId', 'name grade section')
      .populate('subjects.id', 'name code classLevel teacherId');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  })
);

/**
 * GET /api/timetable-courses/:id
 * Get a specific course
 */
router.get('/courses/:id', 
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }
    
    const course = await Course.findById(req.params.id)
      .populate('classroomId', 'name grade section')
      .populate('subjects.id', 'name code classLevel teacherId');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  })
);

/**
 * POST /api/timetable-courses
 * Create a new course
 */
router.post('/courses', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), 
  asyncHandler(async (req, res) => {
    const { classroomId, subjects, academicYear, term } = req.body;
    
    if (!classroomId) {
      return res.status(400).json({ error: 'classroomId is required' });
    }
    
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'subjects array is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({ error: 'Invalid classroom ID' });
    }
    
    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    // Check if course already exists
    const existing = await Course.findOne({
      classroomId,
      academicYear: academicYear || new Date().getFullYear().toString(),
      term: term || 'Term 1'
    });
    
    if (existing) {
      return res.status(409).json({ 
        error: 'Course already exists for this classroom and term' 
      });
    }
    
    const course = new Course({
      classroomId,
      subjects,
      academicYear: academicYear || new Date().getFullYear().toString(),
      term: term || 'Term 1',
      createdBy: req.user.id
    });
    
    await course.save();
    
    const populated = await Course.findById(course._id)
      .populate('classroomId', 'name grade section')
      .populate('subjects.id', 'name code classLevel teacherId');
    
    res.status(201).json(populated);
  })
);

/**
 * PUT /api/timetable-courses/:id
 * Update a course
 */
router.put('/courses/:id', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), 
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }
    
    const { subjects, academicYear, term } = req.body;
    
    const updateData = {
      updatedBy: req.user.id
    };
    
    if (subjects) updateData.subjects = subjects;
    if (academicYear) updateData.academicYear = academicYear;
    if (term) updateData.term = term;
    
    const course = await Course.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    )
      .populate('classroomId', 'name grade section')
      .populate('subjects.id', 'name code classLevel teacherId');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  })
);

/**
 * DELETE /api/timetable-courses/:id
 * Delete a course
 */
router.delete('/courses/:id', 
  requireAuth, 
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), 
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }
    
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ message: 'Course deleted successfully' });
  })
);

module.exports = router;
