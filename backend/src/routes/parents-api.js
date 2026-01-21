/**
 * Parents API Routes for Frontend SPA
 * Provides JSON API endpoints for parent management
 */
const express = require('express');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { User } = require('../models/user');
const { Parent } = require('../models/parent');
const { Student } = require('../models/student');
const { Staff } = require('../models/staff');
const { Fee } = require('../models/fees');
const { Payment } = require('../models/payment');
const { Homework } = require('../models/homework');
const { Classroom } = require('../models/classroom');
const { getCurrentAcademicYear } = require('../models/school-settings');
const { validateObjectId, validateRequiredFields, validateEmail, sanitizeString } = require('../utils/validation');
const cacheManager = require('../utils/cache');

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

// ============= Parents Dashboard =============
/**
 * GET /api/parents/dashboard
 * Get parent dashboard with children's summary
 */
router.get('/dashboard', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  
  // Generate cache key
  const cacheKey = `parent-dashboard-${req.user.id}-${academicYear || 'current'}`;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const user = await User.findById(req.user.id);
  
  // Try to get parent by parentId first, then fallback to email lookup
  let parent = null;
  
  if (user.parentId) {
    parent = await Parent.findById(user.parentId)
      .populate('students', 'firstName lastName studentId')
      .lean();
  } else {
    // Fallback: find parent by email and update user
    parent = await Parent.findOne({ email: user.email })
      .populate('students', 'firstName lastName studentId')
      .lean();
    
    if (parent) {
      // Update user to have parentId for next time
      await User.findByIdAndUpdate(req.user.id, { parentId: parent._id });
    }
  }

  if (!parent) {
    return res.json({
      message: 'Parent profile not found',
      children: []
    });
  }

  const { Fee } = require('../models/fees');
  const { Attendance } = require('../models/attendance');
  const { Grade } = require('../models/grades');

  // Get current academic year if not specified
  const currentYear = academicYear || (await getCurrentAcademicYear())?.year;
  
  // Get summary data for all children
  const childrenIds = parent.students.map(c => c._id);
  
  // Build filter for academic year
  const feeFilter = { studentId: { $in: childrenIds } };
  if (currentYear) feeFilter.academicYear = currentYear;
  
  const [fees, attendance, grades] = await Promise.all([
    Fee.find(feeFilter).lean(),
    Attendance.find({ studentId: { $in: childrenIds } }).lean(),
    Grade.find({ studentId: { $in: childrenIds } }).lean()
  ]);

  const response = {
    parent: {
      name: `${parent.firstName} ${parent.lastName}`,
      email: parent.email,
      phone: parent.phone
    },
    children: parent.students,
    currentAcademicYear: currentYear,
    summary: {
      totalChildren: parent.students.length,
      totalFees: fees.reduce((sum, f) => sum + f.amount, 0),
      totalPaid: fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0),
      pendingFees: fees.reduce((sum, f) => sum + Math.max(0, f.amount - (f.amountPaid || 0)), 0),
      overdueFees: fees.filter(f => f.dueDate && new Date(f.dueDate) < new Date() && f.status !== 'paid')
        .reduce((sum, f) => sum + Math.max(0, f.amount - (f.amountPaid || 0)), 0),
      attendanceRate: attendance.length > 0 
        ? parseFloat((attendance.filter(a => a.status === 'present').length / attendance.length * 100).toFixed(2))
        : 0,
      averageGrade: grades.length > 0
        ? parseFloat((grades.reduce((sum, g) => sum + g.grade, 0) / grades.length).toFixed(2))
        : 0,
      feesByStatus: fees.reduce((acc, f) => {
        acc[f.status] = (acc[f.status] || 0) + f.amount;
        return acc;
      }, {})
    }
  };

  // Cache for 10 minutes
  cacheManager.set(cacheKey, response, 10 * 60 * 1000);

  res.json(response);
}));

/**
 * GET /api/parents/children
 * Get all children linked to the parent
 */
router.get('/children', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId)
      .populate('students', 'firstName lastName studentId class')
      .lean();
  } else {
    parent = await Parent.findOne({ email: user.email })
      .populate('students', 'firstName lastName studentId class')
      .lean();
    
    if (parent) {
      await User.findByIdAndUpdate(req.user.id, { parentId: parent._id });
    }
  }

  if (!parent) {
    return res.json({ children: [] });
  }

  res.json({ children: parent.students });
}));

/**
 * GET /api/parents/children/:student_id/grades
 * Get a child's exam results (grades)
 */
router.get('/children/:student_id/grades', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  // Verify parent owns this child
  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId).lean();
  } else {
    parent = await Parent.findOne({ email: user.email }).lean();
  }

  if (!parent) {
    return res.status(403).json({ error: 'Parent not found' });
  }

  const studentObjectId = require('mongoose').Types.ObjectId;
  const childIsLinked = parent.students.some(s => s.toString() === req.params.student_id);
  
  if (!childIsLinked) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get exam results instead of Grade records
  const ExamResult = require('../models/examResult');
  const results = await ExamResult.find({ student: req.params.student_id })
    .populate('exam', 'name examType')
    .populate('subjectResults.subject', 'name')
    .sort({ createdAt: -1 })
    .lean();
  
  res.json(results);
}));

/**
 * GET /api/parents/children/:student_id/attendance
 * Get a child's attendance records
 */
router.get('/children/:student_id/attendance', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId).lean();
  } else {
    parent = await Parent.findOne({ email: user.email }).lean();
  }

  if (!parent) {
    return res.status(403).json({ error: 'Parent not found' });
  }

  const childIsLinked = parent.students.some(s => s.toString() === req.params.student_id);
  
  if (!childIsLinked) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { Attendance } = require('../models/attendance');
  const attendance = await Attendance.find({ studentId: req.params.student_id }).lean();
  
  res.json(attendance);
}));

/**
 * GET /api/parents/children/:student_id/fees
 * Get a child's fee information with academic year filtering
 */
router.get('/children/:student_id/fees', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { academicYear, term } = req.query;
  const user = await User.findById(req.user.id);
  
  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId).lean();
  } else {
    parent = await Parent.findOne({ email: user.email }).lean();
  }

  if (!parent) {
    return res.status(403).json({ error: 'Parent not found' });
  }

  const childIsLinked = parent.students.some(s => s.toString() === req.params.student_id);
  
  if (!childIsLinked) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { Fee } = require('../models/fees');
  const { getCurrentAcademicYear } = require('../models/school-settings');
  
  // Build filter
  const filter = { studentId: req.params.student_id };
  if (academicYear) {
    filter.academicYear = academicYear;
  } else {
    // Default to current academic year if not specified
    const currentYear = await getCurrentAcademicYear();
    if (currentYear) filter.academicYear = currentYear.year;
  }
  if (term) filter.term = term;
  
  const fees = await Fee.find(filter).sort({ dueDate: -1 }).lean();
  
  const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const pendingFees = totalFees - totalPaid;
  
  res.json({
    fees,
    academicYear: filter.academicYear,
    term: term || 'All',
    summary: {
      totalFees,
      totalPaid,
      pendingFees,
      feeCount: fees.length,
      paidCount: fees.filter(f => f.status === 'paid').length,
      unpaidCount: fees.filter(f => f.status !== 'paid').length
    }
  });
}));

/**
 * GET /api/parents/children/:student_id/homework
 * Get homework for a student's classroom
 */
router.get('/children/:student_id/homework', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { student_id } = req.params;
  const { academicYear } = req.query;

  if (!validateObjectId(student_id)) {
    return res.status(400).json({ error: 'Invalid student ID' });
  }

  // Get student with classroom info
  const student = await Student.findById(student_id).populate('classroomId').lean();
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  if (!student.classroomId) {
    return res.json({ homework: [], classroomId: null });
  }

  // Get current academic year if not specified
  const currentYear = academicYear || (await getCurrentAcademicYear())?.year;

  // Build filter
  const filter = { classroomId: student.classroomId._id };
  if (currentYear) filter.academicYear = currentYear;

  // Get homework for the classroom
  const homework = await Homework.find(filter)
    .populate('teacher', 'firstName lastName email')
    .populate('classroomId', 'className grade section')
    .sort({ dueDate: -1 })
    .lean();

  // Map homework with student submission status
  const homeworkWithStatus = homework.map(hw => ({
    ...hw,
    studentSubmission: hw.submissions?.find(s => s.student?.toString() === student_id) || null
  }));

  res.json({
    homework: homeworkWithStatus,
    classroomId: student.classroomId._id,
    academicYear: currentYear,
    total: homeworkWithStatus.length
  });
}));

/**
 * GET /api/parents/homework/:homework_id
 * Get homework details for parent view
 */
router.get('/homework/:homework_id', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { homework_id } = req.params;

  if (!validateObjectId(homework_id)) {
    return res.status(400).json({ error: 'Invalid homework ID' });
  }

  const homework = await Homework.findById(homework_id)
    .populate('teacher', 'firstName lastName email')
    .populate('classroomId', 'className grade section')
    .populate('submissions.student', 'firstName lastName studentId')
    .lean();

  if (!homework) {
    return res.status(404).json({ error: 'Homework not found' });
  }

  res.json(homework);
}));

/**
 * GET /api/parents/payment-history
 * Get payment history for all children with academic year filtering
 */
router.get('/payment-history', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { academicYear, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;
  const user = await User.findById(req.user.id);
  const { getCurrentAcademicYear } = require('../models/school-settings');
  const { Payment } = require('../models/payment');
  
  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId).lean();
  } else {
    parent = await Parent.findOne({ email: user.email }).lean();
  }

  if (!parent) {
    return res.status(403).json({ error: 'Parent not found' });
  }

  const { Fee } = require('../models/fees');
  
  // Get fees for all children to find associated payments
  const childrenIds = parent.students || [];
  const feeFilter = { studentId: { $in: childrenIds } };
  
  if (academicYear) {
    feeFilter.academicYear = academicYear;
  } else {
    const currentYear = await getCurrentAcademicYear();
    if (currentYear) feeFilter.academicYear = currentYear.year;
  }
  
  const fees = await Fee.find(feeFilter).lean();
  const feeIds = fees.map(f => f._id);
  
  // Get payments for those fees
  const payments = await Payment.find({ feeId: { $in: feeIds } })
    .populate('feeId')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ paymentDate: -1 })
    .lean();
  
  const total = await Payment.countDocuments({ feeId: { $in: feeIds } });
  
  res.json({
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    summary: {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amountPaid, 0),
      academicYear: academicYear || (await getCurrentAcademicYear())?.year
    }
  });
}));

/**
 * GET /api/parents/children/:student_id/report
 * Download a child's report card as PDF
 */
router.get('/children/:student_id/report', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId).lean();
  } else {
    parent = await Parent.findOne({ email: user.email }).lean();
  }

  if (!parent) {
    return res.status(403).json({ error: 'Parent not found' });
  }

  const childIsLinked = parent.students.some(s => s.toString() === req.params.student_id);
  if (!childIsLinked) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { Grade } = require('../models/grades');
  const { Attendance } = require('../models/attendance');
  const { Fee } = require('../models/fees');
  const PDFDocument = require('pdfkit');
  const fs = require('fs');
  const path = require('path');
  const { getSchoolSettings, getCurrentAcademicYear } = require('../models/school-settings');

  const student = await Student.findById(req.params.student_id).lean();
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const [grades, attendance, fees, schoolSettings, currentYear] = await Promise.all([
    Grade.find({ studentId: req.params.student_id }).lean(),
    Attendance.find({ studentId: req.params.student_id }).lean(),
    Fee.find({ studentId: req.params.student_id }).lean(),
    getSchoolSettings(),
    getCurrentAcademicYear()
  ]);

  let headTeacher = null;
  try {
    headTeacher = await Staff.findOne({ role: 'head-teacher' }).lean();
  } catch {}

  const present = attendance.filter(a => a.status === 'present').length;
  const totalAttendance = attendance.length;
  const attendanceRate = totalAttendance > 0 ? ((present / totalAttendance) * 100).toFixed(2) : '0.00';
  const avgGrade = grades.length > 0 ? (grades.reduce((sum, g) => sum + (g.grade || 0), 0) / grades.length).toFixed(2) : 'N/A';
  const totalFees = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const totalPending = Math.max(0, totalFees - totalPaid);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${student.studentId || student._id}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // Header and Branding
  const schoolName = schoolSettings?.schoolName || 'School Management System';
  const logoPath = schoolSettings?.schoolLogo;
  const termName = (currentYear?.terms || []).find(t => t.isActive)?.name || 'Current Term';
  const academicYearLabel = currentYear?.year || new Date().getFullYear();

  if (logoPath) {
    try {
      const resolved = logoPath.startsWith('/') ? path.join(process.cwd(), logoPath.replace(/^\//, '')) : path.join(process.cwd(), logoPath);
      if (fs.existsSync(resolved)) {
        doc.image(resolved, 40, 40, { fit: [60, 60] });
      }
    } catch {}
  }

  // Title block
  doc.fontSize(20).font('Helvetica-Bold').text(schoolName, { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Student Report Card', { align: 'center' });
  doc.moveDown();

  // Student & School Info
  doc.fontSize(12);
  doc.text(`Parent: ${parent.firstName || ''} ${parent.lastName || ''}`);
  doc.text(`Student: ${student.firstName || ''} ${student.lastName || ''}`);
  doc.text(`Student ID: ${student.studentId || student._id}`);
  if (student.classLevel) doc.text(`Class: ${student.classLevel}${student.stream ? ' - ' + student.stream : ''}`);
  doc.text(`Academic Year: ${academicYearLabel}`);
  doc.text(`Term: ${termName}`);
  if (schoolSettings?.schoolAddress) doc.text(`School Address: ${schoolSettings.schoolAddress}`);
  if (schoolSettings?.schoolPhone) doc.text(`School Phone: ${schoolSettings.schoolPhone}`);
  if (schoolSettings?.schoolEmail) doc.text(`School Email: ${schoolSettings.schoolEmail}`);
  doc.moveDown();

  // Grades - Table
  doc.fontSize(14).font('Helvetica-Bold').text('Academic Performance');
  doc.fontSize(11).font('Helvetica').text(`Average Grade: ${avgGrade}`);
  doc.moveDown(0.5);
  const gradeHeaders = ['Subject', 'Marks', 'Total', 'Percentage', 'Grade'];
  const gradeRows = grades.map(g => {
    const marks = g.marksObtained ?? g.grade ?? g.marks ?? 0;
    const total = g.totalMarks ?? 100;
    const pct = total ? `${((marks / total) * 100).toFixed(1)}%` : '-';
    const letter = g.gradeLetter ?? (typeof g.grade === 'string' ? g.grade : '-');
    return [g.subject || '-', marks, total, pct, letter];
  });
  if (gradeRows.length > 0) {
    const { addTable } = require('../services/reportGenerator');
  }
  try {
    const ReportGenerator = require('../services/reportGenerator');
    ReportGenerator.addTable(doc, gradeHeaders, gradeRows, {
      columnWidths: [160, 85, 85, 95, 90]
    });
  } catch {}
  doc.moveDown();

  // Subject Comments (if any)
  const commentEntries = grades.filter(g => g.comments).map(g => [g.subject || '-', g.comments]);
  if (commentEntries.length > 0) {
    doc.fontSize(13).font('Helvetica-Bold').text('Subject Comments');
    doc.moveDown(0.5);
    try {
      const ReportGenerator = require('../services/reportGenerator');
      ReportGenerator.addTable(doc, ['Subject', 'Comment'], commentEntries, {
        columnWidths: [160, 355]
      });
    } catch {
      commentEntries.forEach(([subj, comment]) => doc.text(`• ${subj}: ${comment}`));
    }
    doc.moveDown();
  }

  // Attendance - Summary + Table
  doc.fontSize(14).font('Helvetica-Bold').text('Attendance');
  doc.fontSize(11).font('Helvetica').text(`Attendance Rate: ${attendanceRate}%`);
  doc.text(`Present: ${present}`);
  doc.text(`Absent: ${attendance.filter(a => a.status === 'absent').length}`);
  doc.moveDown(0.5);
  const attHeaders = ['Date', 'Status', 'Notes'];
  const attRows = attendance.slice(0, 50).map(a => [
    new Date(a.date).toLocaleDateString(),
    a.status?.charAt(0).toUpperCase() + a.status?.slice(1),
    a.notes || '-'
  ]);
  try {
    const ReportGenerator = require('../services/reportGenerator');
    ReportGenerator.addTable(doc, attHeaders, attRows, {
      columnWidths: [150, 120, 245]
    });
  } catch {}
  doc.moveDown();

  // Fees - Summary + Table
  doc.fontSize(14).font('Helvetica-Bold').text('Fees & Payments');
  doc.fontSize(11).font('Helvetica').text(`Total Fees: $${totalFees.toFixed(2)}`);
  doc.text(`Total Paid: $${totalPaid.toFixed(2)}`);
  doc.text(`Pending: $${totalPending.toFixed(2)}`);
  doc.moveDown(0.5);
  const feeHeaders = ['Type', 'Amount Due', 'Amount Paid', 'Balance', 'Status'];
  const feeRows = fees.map(f => [
    f.type || f.name || '-',
    `$${(f.amount || 0).toFixed(2)}`,
    `$${(f.amountPaid || 0).toFixed(2)}`,
    `$${((f.amount || 0) - (f.amountPaid || 0)).toFixed(2)}`,
    f.paymentStatus || 'Pending'
  ]);
  try {
    const ReportGenerator = require('../services/reportGenerator');
    ReportGenerator.addTable(doc, feeHeaders, feeRows, {
      columnWidths: [160, 85, 85, 95, 90]
    });
  } catch {}
  doc.moveDown();

  try {
    const ReportGenerator = require('../services/reportGenerator');
    ReportGenerator.addFooters(doc);
  } catch {
    doc.text('Generated by School Management System', { align: 'right' });
  }
  // Signature block
  doc.moveDown(2);
  doc.fontSize(11).font('Helvetica-Bold').text('Approvals');
  doc.moveDown(0.5);
  const startY = doc.y;
  const headTeacherName = headTeacher ? `${headTeacher.firstName || ''} ${headTeacher.lastName || ''}`.trim() : '';
  doc.fontSize(10).font('Helvetica').text(`Head Teacher${headTeacherName ? ` (${headTeacherName})` : ''} Signature:`, 40, startY);
  doc.moveTo(180, startY + 12).lineTo(370, startY + 12).stroke();
  doc.text('Parent/Guardian Signature:', 40, startY + 30);
  doc.moveTo(200, startY + 42).lineTo(370, startY + 42).stroke();
  doc.end();
}));

// ============= Parents Management =============
/**
 * GET /api/parents
 * Get all parents
 */
router.get('/', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { search, relationship, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }
  if (relationship) filter.relationship = relationship;

  const parents = await Parent.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('students', 'firstName lastName studentId')
    .lean();

  const total = await Parent.countDocuments(filter);

  res.json({
    parents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * GET /api/parents/:id
 * Get single parent
 */
router.get('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.id)
    .populate('students')
    .lean();

  if (!parent) return res.status(404).json({ error: 'Parent not found' });
  res.json(parent);
}));

/**
 * POST /api/parents
 * Create new parent
 */
router.post('/', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, relationship, address, occupation } = req.body;

  // Validate required fields
  const missingFields = validateRequiredFields({ firstName, lastName, email });
  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Sanitize string inputs
  const sanitizedFirstName = sanitizeString(firstName);
  const sanitizedLastName = sanitizeString(lastName);
  const sanitizedRelationship = relationship ? sanitizeString(relationship) : '';
  const sanitizedAddress = address ? sanitizeString(address) : '';
  const sanitizedOccupation = occupation ? sanitizeString(occupation) : '';

  // Check if parent with same email exists
  const existingParent = await Parent.findOne({ email: email.toLowerCase() });
  if (existingParent) {
    return res.status(409).json({ error: 'Parent with this email already exists' });
  }

  const parent = new Parent({
    firstName: sanitizedFirstName,
    lastName: sanitizedLastName,
    email: email.toLowerCase(),
    phone,
    relationship: sanitizedRelationship,
    address: sanitizedAddress,
    occupation: sanitizedOccupation,
    students: []
  });

  await parent.save();
  res.status(201).json({ message: 'Parent created', parent });
}));

/**
 * PUT /api/parents/:id
 * Update parent
 */
router.put('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, relationship, address, occupation } = req.body;
  const parent = await Parent.findById(req.params.id);

  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  if (firstName) parent.firstName = firstName;
  if (lastName) parent.lastName = lastName;
  if (email) parent.email = email;
  if (phone) parent.phone = phone;
  if (relationship) parent.relationship = relationship;
  if (address) parent.address = address;
  if (occupation) parent.occupation = occupation;

  await parent.save();
  res.json({ message: 'Parent updated', parent });
}));

/**
 * DELETE /api/parents/:id
 * Delete parent
 */
router.delete('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const parent = await Parent.findByIdAndDelete(req.params.id);
  if (!parent) return res.status(404).json({ error: 'Parent not found' });
  res.json({ message: 'Parent deleted' });
}));

// ============= Parent-Student Links =============
/**
 * POST /api/parents/:parentId/link/:studentId
 * Link parent to student
 */
router.post('/:parentId/link/:studentId', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.parentId);
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const student = await findStudentByIdOrStudentId(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  if (!parent.students.some(s => s.toString() === student._id.toString())) {
    parent.students.push(student._id);
    await parent.save();
  }

  res.json({ message: 'Student linked to parent', parent });
}));

/**
 * POST /api/parents/:parentId/unlink/:studentId
 * Unlink parent from student
 */
router.post('/:parentId/unlink/:studentId', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.parentId);
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const student = await findStudentByIdOrStudentId(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  parent.students = parent.students.filter(s => s.toString() !== student._id.toString());
  await parent.save();

  res.json({ message: 'Student unlinked from parent', parent });
}));

/**
 * GET /api/parents/:id/students
 * Get parent's students
 */
router.get('/:id/students', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.id)
    .populate('students')
    .lean();

  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  res.json(parent.students);
}));

/**
 * POST /api/parents/children/:student_id/payments
 * Make a payment towards child's fees
 */
router.post('/children/:student_id/payments', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const { fee_id, amount, paymentMethod, notes } = req.body;

  // Validate required fields
  const validation = validateRequiredFields(['amount', 'paymentMethod'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  // Verify parent owns this child
  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId).lean();
  } else {
    parent = await Parent.findOne({ email: user.email }).lean();
  }

  if (!parent) {
    return res.status(403).json({ error: 'Parent not found' });
  }

  const childIsLinked = parent.students.some(s => s.toString() === req.params.student_id);
  if (!childIsLinked) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Validate amount
  if (amount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than 0' });
  }

  // If fee_id is provided, update that specific fee
  if (fee_id) {
    if (!validateObjectId(fee_id)) {
      return res.status(400).json({ error: 'Invalid fee ID' });
    }

    const fee = await Fee.findById(fee_id);
    if (!fee) {
      return res.status(404).json({ error: 'Fee not found' });
    }

    if (fee.studentId.toString() !== req.params.student_id) {
      return res.status(403).json({ error: 'This fee does not belong to the student' });
    }

    // Check if payment exceeds remaining balance
    const remaining = fee.amount - (fee.amountPaid || 0);
    if (amount > remaining) {
      return res.status(400).json({ 
        error: `Payment amount exceeds remaining balance. Remaining: K${remaining}` 
      });
    }

    // Record payment
    fee.amountPaid = (fee.amountPaid || 0) + amount;
    fee.payments = fee.payments || [];
    fee.payments.push({
      amount,
      date: new Date(),
      method: paymentMethod,
      notes: notes || '',
      paidBy: user._id
    });

    // Update status
    if (fee.amountPaid >= fee.amount) {
      fee.status = 'paid';
      fee.amountPaid = fee.amount;
    } else {
      fee.status = 'pending';
    }

    await fee.save();

    return res.json({
      success: true,
      message: 'Payment recorded successfully',
      fee: {
        _id: fee._id,
        amount: fee.amount,
        amountPaid: fee.amountPaid,
        remaining: fee.amount - fee.amountPaid,
        status: fee.status,
        feeType: fee.feeType
      }
    });
  } else {
    // Pay towards any unpaid fees (automatic allocation)
    const fees = await Fee.find({
      studentId: req.params.student_id,
      status: { $ne: 'paid' }
    });

    if (fees.length === 0) {
      return res.status(400).json({ error: 'No unpaid fees found' });
    }

    let remainingPayment = amount;
    const updatedFees = [];

    for (const fee of fees) {
      if (remainingPayment <= 0) break;

      const feeRemaining = fee.amount - (fee.amountPaid || 0);
      const paymentForThisFee = Math.min(remainingPayment, feeRemaining);

      fee.amountPaid = (fee.amountPaid || 0) + paymentForThisFee;
      fee.payments = fee.payments || [];
      fee.payments.push({
        amount: paymentForThisFee,
        date: new Date(),
        method: paymentMethod,
        notes: notes || '',
        paidBy: user._id
      });

      if (fee.amountPaid >= fee.amount) {
        fee.status = 'paid';
        fee.amountPaid = fee.amount;
      } else {
        fee.status = 'pending';
      }

      await fee.save();
      updatedFees.push({
        _id: fee._id,
        feeType: fee.feeType,
        amount: fee.amount,
        amountPaid: fee.amountPaid,
        status: fee.status
      });

      remainingPayment -= paymentForThisFee;
    }

    res.json({
      success: true,
      message: `Payment of K${amount} recorded successfully`,
      totalPaid: amount - remainingPayment,
      updatedFees,
      remainingBalance: remainingPayment > 0 ? remainingPayment : 0
    });
  }
}));

/**
 * GET /api/parents/children/:student_id/payment-history
 * Get payment history for a child
 */
router.get('/children/:student_id/payment-history', requireAuth, requireRole('parent', ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  // Verify parent owns this child
  let parent = null;
  if (user.parentId) {
    parent = await Parent.findById(user.parentId).lean();
  } else {
    parent = await Parent.findOne({ email: user.email }).lean();
  }

  if (!parent) {
    return res.status(403).json({ error: 'Parent not found' });
  }

  const childIsLinked = parent.students.some(s => s.toString() === req.params.student_id);
  if (!childIsLinked) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get all fees with payment history
  const fees = await Fee.find({ studentId: req.params.student_id })
    .select('feeType amount amountPaid payments status term dueDate')
    .lean();

  // Flatten all payments
  const allPayments = [];
  fees.forEach(fee => {
    if (fee.payments && Array.isArray(fee.payments)) {
      fee.payments.forEach(payment => {
        allPayments.push({
          feeId: fee._id,
          feeType: fee.feeType,
          term: fee.term,
          amount: payment.amount,
          method: payment.method,
          date: payment.date,
          notes: payment.notes,
          feeTotalAmount: fee.amount,
          feeStatus: fee.status
        });
      });
    }
  });

  // Sort by date descending
  allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    payments: allPayments,
    totalPayments: allPayments.length,
    totalAmountPaid: allPayments.reduce((sum, p) => sum + p.amount, 0)
  });
}));

module.exports = router;
