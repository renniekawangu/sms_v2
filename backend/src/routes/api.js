/**
 * API Routes for Frontend SPA
 * Provides JSON API endpoints for the React frontend application
 */
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { User } = require('../models/user');
const { Student } = require('../models/student');
const { Staff } = require('../models/staff');
const { Subject } = require('../models/subjects');
const { Grade } = require('../models/grades');
const { Teacher } = require('../models/teacher');
const { Attendance } = require('../models/attendance');
const { Fee } = require('../models/fees');
const { Classroom } = require('../models/classroom');
const { Payment } = require('../models/payment');
const { Expense } = require('../models/expense');
const { Exam } = require('../models/exam');
const { Issue } = require('../models/issue');
const { Parent } = require('../models/parent');
const { getNextSequence } = require('../models/counter');
const mongoose = require('mongoose');
const messageRoutes = require('./message-api');
const reportRoutes = require('./reports-api');
const timetableRoutes = require('./timetable-api');
const examResultsRoutes = require('./examResults');

const router = express.Router();

// Helper to strictly validate ObjectId (24-char hex string only)
const isValidObjectId = (id) => {
  return id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

async function findStudentByIdOrStudentId(id) {
  // Try as numeric studentId first (more common case in this app)
  const numId = parseInt(id);
  if (!isNaN(numId) && String(numId) === String(id).trim()) {
    return await Student.findOne({ studentId: numId });
  }
  
  // Try as ObjectId (must be 24-character hex string)
  if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
    return await Student.findById(id);
  }
  
  return null;
}

async function findClassroomById(id) {
  // Try as ObjectId (must be 24-character hex string)
  if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
    return await Classroom.findById(id);
  }
  
  // If numeric, check if old data with numeric _id exists (legacy support)
  const numId = parseInt(id);
  if (!isNaN(numId) && String(numId) === String(id).trim()) {
    return await Classroom.findOne({ _id: numId });
  }
  
  return null;
}

// DTO helpers to align with frontend expectations
const toStudentDto = (student) => ({
  _id: student._id,
  student_id: student.studentId,
  name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
  firstName: student.firstName,
  lastName: student.lastName,
  email: student.email,
  phone: student.phone,
  dob: student.dateOfBirth ? student.dateOfBirth.toISOString() : null,
  date_of_join: student.enrollmentDate ? student.enrollmentDate.toISOString() : null,
  address: student.address || '',
  gender: student.gender,
  classLevel: student.classLevel,
  parents: student.parents || []
});

const toTeacherDto = (teacher, teacherId) => ({
  _id: teacher._id,
  teacher_id: teacherId,
  name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim(),
  email: teacher.email,
  phone: teacher.phone,
  dob: teacher.dateOfBirth ? teacher.dateOfBirth.toISOString() : null,
  date_of_join: teacher.employmentDate ? teacher.employmentDate.toISOString() : null,
  address: teacher.address || ''
});

const toClassroomDto = (classroom, teacher, students) => ({
  _id: classroom._id,
  grade: classroom.grade,
  section: classroom.section,
  teacher_id: classroom.teacher_id || null,
  students: students || []
});

const toPaymentDto = (payment) => ({
  payment_id: payment.paymentId,
  fee_id: payment.feeId ? payment.feeId.toString() : null,
  amount_paid: payment.amountPaid,
  payment_date: payment.paymentDate ? payment.paymentDate.toISOString() : null,
  method: payment.method || 'cash'
});

const toExpenseDto = (expense) => ({
  expense_id: expense.expenseId,
  category: expense.category,
  description: expense.description,
  amount: expense.amount,
  date: expense.date ? expense.date.toISOString() : null,
  status: expense.status
});

// ============= Students API =============
router.get('/students', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (_req, res) => {
  const students = await Student.find().lean();
  res.json(students.map(toStudentDto));
}));

router.get('/students/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (req, res) => {
  const student = await findStudentByIdOrStudentId(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(toStudentDto(student));
}));

router.post('/students', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { name = '', email = '', phone = '', dob, address = '', date_of_join, gender, classLevel, parentId } = req.body;
  
  // Validate required fields
  if (!name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email.trim()) return res.status(400).json({ error: 'Email is required' });
  if (!phone.trim()) return res.status(400).json({ error: 'Phone is required' });
  if (!address.trim()) return res.status(400).json({ error: 'Address is required' });
  if (!dob) return res.status(400).json({ error: 'Date of birth is required' });

  // Check if student with this email already exists
  const existingStudent = await Student.findOne({ email: email.trim() });
  if (existingStudent) {
    return res.status(400).json({ error: 'Student with this email already exists' });
  }

  const [firstName, ...rest] = String(name).trim().split(' ');
  const lastName = rest.join(' ') || 'Student';

  const studentId = await getNextSequence('studentId', 25000);

  const student = new Student({
    studentId,
    firstName,
    lastName,
    email: email.trim(),
    phone,
    address,
    dateOfBirth: new Date(dob),
    enrollmentDate: date_of_join ? new Date(date_of_join) : new Date(),
    gender: gender || undefined,
    classLevel: classLevel || 'Grade 1',
    parents: parentId ? [parentId] : [],
    createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined
  });

  await student.save();
  res.status(201).json(toStudentDto(student));
}));

router.put('/students/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const student = await findStudentByIdOrStudentId(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const { name, email, phone, dob, address, date_of_join, gender, classLevel, parentId } = req.body;
  
  // Check if email is being changed and if new email already exists
  if (email && email !== student.email) {
    const existingStudent = await Student.findOne({ email: email.trim(), _id: { $ne: student._id } });
    if (existingStudent) {
      return res.status(400).json({ error: 'Email is already in use by another student' });
    }
  }
  
  if (name) {
    const [firstName, ...rest] = String(name).trim().split(' ');
    student.firstName = firstName;
    student.lastName = rest.join(' ') || student.lastName;
  }
  if (email) student.email = email.trim();
  if (phone) student.phone = phone;
  if (address) student.address = address;
  if (dob) student.dateOfBirth = new Date(dob);
  if (date_of_join) student.enrollmentDate = new Date(date_of_join);
  if (gender) student.gender = gender;
  if (classLevel) student.classLevel = classLevel;
  
  // Handle parent linking
  if (parentId !== undefined) {
    student.parents = parentId ? [parentId] : [];
    student.markModified('parents');
  }

  await student.save();
  res.json(toStudentDto(student));
}));

router.delete('/students/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const student = await findStudentByIdOrStudentId(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  await Student.deleteOne({ _id: student._id });
  await User.deleteOne({ _id: student.userId });
  res.json({ message: 'Student deleted' });
}));

// ============= Teachers API =============
router.get('/teachers', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (_req, res) => {
  const teachers = await Staff.find({}).lean();
  res.json(teachers.map(t => toTeacherDto(t, t.teacherId || t._id)));
}));

router.get('/teachers/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid teacher ID' });
  const teacher = await Staff.findById(req.params.id).lean();
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  res.json(toTeacherDto(teacher, teacher.teacherId || teacher._id));
}));

router.post('/teachers', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { name = '', email = '', phone = '', dob, address = '', date_of_join } = req.body;
  const [firstName, ...rest] = String(name).trim().split(' ');
  const lastName = rest.join(' ') || 'Teacher';

  const user = new User({
    email,
    password: 'temp123',
    role: 'teacher',
    name,
    phone,
    date_of_join: date_of_join ? new Date(date_of_join) : new Date()
  });
  await user.save();

  const teacherId = await getNextSequence('teacherId', 1000);

  const teacher = new Staff({
    teacherId,
    userId: user._id,
    firstName,
    lastName,
    email,
    phone,
    address,
    dateOfBirth: dob ? new Date(dob) : undefined,
    employmentDate: date_of_join ? new Date(date_of_join) : new Date(),
    role: 'teacher',
    createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined
  });

  await teacher.save();
  res.status(201).json(toTeacherDto(teacher.toObject(), teacherId));
}));

router.put('/teachers/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid teacher ID' });
  const teacher = await Staff.findById(req.params.id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const { name, email, phone, dob, address, date_of_join } = req.body;
  if (name) {
    const [firstName, ...rest] = String(name).trim().split(' ');
    teacher.firstName = firstName;
    teacher.lastName = rest.join(' ') || teacher.lastName;
  }
  if (email) teacher.email = email;
  if (phone) teacher.phone = phone;
  if (address) teacher.address = address;
  if (dob) teacher.dateOfBirth = new Date(dob);
  if (date_of_join) teacher.employmentDate = new Date(date_of_join);

  await teacher.save();
  res.json(toTeacherDto(teacher.toObject(), teacher.teacherId || teacher._id));
}));

router.delete('/teachers/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid teacher ID' });
  const teacher = await Staff.findByIdAndDelete(req.params.id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  await User.deleteOne({ _id: teacher.userId });
  res.json({ message: 'Teacher deleted' });
}));

// ============= Classrooms API =============
router.get('/classrooms', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (_req, res) => {
  console.log('[CLASSROOMS] Handler reached, user:', _req.user);
  try {
    const classrooms = await Classroom.find().lean();
    const teacherIds = classrooms
      .map(c => c.teacher_id)
      .filter(isValidObjectId);
    const teachers = teacherIds.length > 0 ? await Staff.find({ _id: { $in: teacherIds } }).lean() : [];
    
    const allStudentIds = classrooms
      .flatMap(c => c.students || [])
      .filter(isValidObjectId);
    const students = allStudentIds.length > 0 ? await Student.find({ _id: { $in: allStudentIds } }).lean() : [];

    const teacherMap = new Map(teachers.map(t => [t._id.toString(), t]));
    const studentMap = new Map(students.map(s => [s._id.toString(), s]));

    const response = classrooms.map(c => {
      const t = c.teacher_id ? teacherMap.get(c.teacher_id.toString()) : null;
      const sDocs = (c.students || []).map(id => studentMap.get(id.toString())).filter(Boolean);
      return toClassroomDto(c, t, sDocs);
    });

    console.log('[CLASSROOMS] Success, returning response');
    res.json(response);
  } catch (err) {
    console.error('[CLASSROOMS] Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}));

router.get('/classrooms/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (req, res) => {
  const classroom = await findClassroomById(req.params.id);
  if (!classroom) {
    return res.status(404).json({ 
      success: false,
      message: 'Classroom not found',
      field: '_id'
    });
  }

  let teacher = null;
  if (classroom.teacher_id) {
    teacher = await Teacher.findById(classroom.teacher_id).lean();
  }
  
  const mongoose = require('mongoose');
  console.log('[GET /classrooms/:id] classroom.students:', classroom.students, 'type:', typeof classroom.students);
  const studentIds = (classroom.students || []).map(id => {
    if (typeof id === 'string' && isValidObjectId(id)) return mongoose.Types.ObjectId(id);
    if (typeof id === 'object' && id instanceof mongoose.Types.ObjectId) return id;
    return null;
  }).filter(Boolean);
  console.log('[GET /classrooms/:id] Querying students with IDs:', studentIds);
  const students = studentIds.length > 0 ? await Student.find({ _id: { $in: studentIds } }).lean() : [];
  console.log('[GET /classrooms/:id] Found students:', students);

  res.json(toClassroomDto(classroom.toObject ? classroom.toObject() : classroom, teacher, students));
}));

router.post('/classrooms', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { grade, section, teacher_id, students = [] } = req.body;

  let teacherRef = null;
  if (teacher_id) {
    if (!isValidObjectId(teacher_id)) return res.status(400).json({ error: 'Invalid teacher ID' });
    const t = await Staff.findById(teacher_id);
    if (!t) return res.status(400).json({ error: 'Teacher not found' });
    teacherRef = t._id;
  }

  const validStudentIds = students.filter(isValidObjectId);
  const classroom = new Classroom({
    grade,
    section,
    teacher_id: teacherRef,
    students: validStudentIds
  });

  await classroom.save();
  
  const finalStudents = validStudentIds.length > 0 
    ? await Student.find({ _id: { $in: validStudentIds } }).lean() 
    : [];
  const teacher = teacherRef ? await Staff.findById(teacherRef).lean() : null;
  
  res.status(201).json(toClassroomDto(classroom.toObject(), teacher, finalStudents));
}));

router.put('/classrooms/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  // Use lean to get raw data without validation
  let classroomData = await findClassroomById(req.params.id);
  if (!classroomData) {
    return res.status(404).json({ 
      success: false,
      message: 'Classroom not found',
      field: '_id'
    });
  }

  const id = classroomData._id;
  
  // Clean up legacy data
  let cleanTeacherId = classroomData.teacher_id;
  if (cleanTeacherId && !isValidObjectId(cleanTeacherId)) {
    cleanTeacherId = null;
  }
  
  let cleanStudents = classroomData.students || [];
  if (Array.isArray(cleanStudents)) {
    cleanStudents = cleanStudents.filter(isValidObjectId);
  }

  const { grade, section, teacher_id, students } = req.body;
  
  // Start with current values
  let finalGrade = grade !== undefined ? grade : classroomData.grade;
  let finalSection = section !== undefined ? section : classroomData.section;
  let finalTeacherId = cleanTeacherId;
  let finalStudents = cleanStudents;

  // Debug: log incoming student IDs
  console.log('[PUT /classrooms/:id] Incoming students:', students);

  // Process teacher_id update
  if (teacher_id !== undefined) {
    if (teacher_id === null) {
      finalTeacherId = null;
    } else if (isValidObjectId(teacher_id)) {
      const t = await Staff.findById(teacher_id);
      if (!t) return res.status(400).json({ error: 'Teacher not found' });
      finalTeacherId = t._id;
    } else {
      return res.status(400).json({ error: 'Invalid teacher ID' });
    }
  }

  // Process students update
  if (Array.isArray(students)) {
    finalStudents = students.filter(isValidObjectId);
    console.log('[PUT /classrooms/:id] Filtered valid students:', finalStudents);
  }

  // Debug: log final update values
  console.log('[PUT /classrooms/:id] Updating classroom:', {
    grade: finalGrade,
    section: finalSection,
    teacher_id: finalTeacherId,
    students: finalStudents
  });

  // Update the document
  const classroom = await Classroom.findByIdAndUpdate(
    id,
    {
      grade: finalGrade,
      section: finalSection,
      teacher_id: finalTeacherId,
      students: finalStudents
    },
    { new: true, runValidators: true }
  ).lean();

  const teacher = classroom.teacher_id ? await Staff.findById(classroom.teacher_id).lean() : null;
  const studentIds = classroom.students || [];
  const finalResult = studentIds.length > 0 ? await Student.find({ _id: { $in: studentIds } }).lean() : [];

  console.log('[PUT /classrooms/:id] Updated classroom:', classroom);
  res.json(toClassroomDto(classroom, teacher, finalResult));
}));

router.delete('/classrooms/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const classroom = await findClassroomById(req.params.id);
  if (!classroom) {
    return res.status(404).json({ 
      success: false,
      message: 'Classroom not found',
      field: '_id'
    });
  }
  
  await Classroom.findByIdAndDelete(classroom._id);
  res.json({ success: true, message: 'Classroom deleted' });
}));

// ============= Subjects API =============
router.get('/subjects', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (req, res) => {
  const subjects = await Subject.find();
  res.json(subjects);
}));

router.get('/subjects/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid subject ID' });
  }
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  res.json(subject);
}));

router.post('/subjects', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const subject = new Subject({
    ...req.body,
    createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined
  });
  await subject.save();
  res.status(201).json(subject);
}));

router.put('/subjects/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid subject ID' });
  }
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  res.json(subject);
}));

router.delete('/subjects/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid subject ID' });
  }
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found' });
  }
  res.json({ message: 'Subject deleted' });
}));

// ============= Attendance API =============
router.get('/attendance', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (req, res) => {
  const attendance = await Attendance.find()
    .populate('studentId', 'firstName lastName studentId')
    .populate('markedBy', 'email');
  res.json(attendance);
}));

// Get attendance for a specific user/student
router.get('/attendance/:user_id', requireAuth, asyncHandler(async (req, res) => {
  const param = req.params.user_id;

  // Resolve to a student document:
  // - If numeric, treat as Student.studentId
  // - If 24-char hex, first try Student by _id, then User by _id -> Student by userId
  let student = null;
  const numId = parseInt(param);
  if (!isNaN(numId) && String(numId) === String(param).trim()) {
    student = await Student.findOne({ studentId: numId });
  } else if (isValidObjectId(param)) {
    student = await Student.findById(param);
    if (!student) {
      const user = await User.findById(param);
      if (user) {
        student = await Student.findOne({ userId: user._id });
      }
    }
  }

  if (!student) return res.status(404).json({ error: 'Student not found' });

  // If requester is a student, only allow access to their own records
  const requesterRole = String(req.user?.role || '').toLowerCase();
  if (requesterRole === 'student') {
    const requesterStudent = await Student.findOne({ userId: req.user.id });
    if (!requesterStudent || String(requesterStudent._id) !== String(student._id)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
  } else if (!['admin', 'head-teacher', 'head_teacher', 'teacher'].includes(requesterRole)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  }

  const attendance = await Attendance.find({ studentId: student._id })
    .lean()
    .sort({ date: -1 });
  res.json(attendance);
}));

router.post('/attendance', requireAuth, requireRole(ROLES.ADMIN, ROLES.TEACHER, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const { studentId, subject, date, status, markedBy, ...rest } = req.body;

  if (!studentId) return res.status(400).json({ error: 'studentId is required' });
  if (!date) return res.status(400).json({ error: 'date is required' });
  if (!status) return res.status(400).json({ error: 'status is required' });

  const student = await findStudentByIdOrStudentId(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Normalize date: parse YYYY-MM-DD format to UTC midnight
  let normalizedDate;
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // If it's a date string like "2026-01-20", parse it as UTC
    const [year, month, day] = date.split('-').map(Number);
    normalizedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  } else {
    // Otherwise, normalize the provided date
    normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
  }

  const payload = {
    ...rest,
    studentId: student._id,
    status,
    date: normalizedDate,
    markedBy: isValidObjectId(markedBy) ? markedBy : undefined
  };

  // Use upsert to update if exists, create if not
  const attendance = await Attendance.findOneAndUpdate(
    { studentId: student._id, date: normalizedDate },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  
  res.status(201).json(attendance);
}));

router.put('/attendance/record/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.TEACHER, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid attendance record ID' });
  }
  
  const update = { ...req.body };

  // Normalize student reference field
  const incomingStudent = req.body.studentId || req.body.student_id;
  if (incomingStudent) {
    const student = await findStudentByIdOrStudentId(incomingStudent);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    update.studentId = student._id;
    delete update.student_id;
  }

  // Validate markedBy if provided
  if (update.markedBy && !isValidObjectId(update.markedBy)) {
    return res.status(400).json({ error: 'Invalid markedBy id' });
  }

  const attendance = await Attendance.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });
  res.json(attendance);
}));

router.delete('/attendance/record/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.TEACHER, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid attendance record ID' });
  }
  const attendance = await Attendance.findByIdAndDelete(req.params.id);
  if (!attendance) {
    return res.status(404).json({ error: 'Attendance record not found' });
  }
  res.json({ message: 'Attendance record deleted' });
}));

// ============= Exams API =============
router.get('/exams', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (req, res) => {
  const exams = await Exam.find();
  res.json(exams);
}));

router.get('/exams/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid exam ID' });
  }
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  res.json(exam);
}));

router.post('/exams', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (req, res) => {
  const exam = new Exam(req.body);
  await exam.save();
  res.status(201).json(exam);
}));

router.put('/exams/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.TEACHER), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid exam ID' });
  }
  const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  res.json(exam);
}));

router.delete('/exams/:id', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid exam ID' });
  }
  const exam = await Exam.findByIdAndDelete(req.params.id);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }
  res.json({ message: 'Exam deleted' });
}));

// ============= Grades/Results API =============
// ============= Exam Results API (NEW - See examResults.js) =============
// Note: /results endpoints are now handled by examResults routes

// Old Grade endpoints (DEPRECATED - kept for backwards compatibility with old student grade system)
// ============= OLD RESULTS/GRADES ENDPOINTS (DEPRECATED) =============
// These have been replaced by the new Exam Results system in examResults.js
// The new system uses MongoDB ExamResult model instead of the legacy Grade model
// Kept commented for reference but not actively used

/* DEPRECATED
router.get('/results/student/:student_id', ...);
router.post('/results', ...);
router.put('/results/:id', ...);
router.delete('/results/:id', ...);
*/

// ============= Fees API =============
router.get('/fees', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const fees = await Fee.find();
  res.json(fees);
}));

router.get('/fees/:id', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id);
  if (!fee) return res.status(404).json({ error: 'Fee not found' });
  res.json(fee);
}));

router.post('/fees', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN), asyncHandler(async (req, res) => {
  const fee = new Fee(req.body);
  await fee.save();
  res.status(201).json(fee);
}));

router.put('/fees/:id', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN), asyncHandler(async (req, res) => {
  const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!fee) return res.status(404).json({ error: 'Fee not found' });
  res.json(fee);
}));

router.delete('/fees/:id', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN), asyncHandler(async (req, res) => {
  await Fee.findByIdAndDelete(req.params.id);
  res.json({ message: 'Fee deleted' });
}));

// ============= Payments API =============
router.get('/payments', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (_req, res) => {
  const payments = await Payment.find().lean();
  res.json(payments.map(toPaymentDto));
}));

router.post('/payments', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { fee_id, amount_paid, method = 'cash', payment_date } = req.body;
  const paymentId = await getNextSequence('paymentId', 1);

  const payment = new Payment({
    paymentId,
    feeId: fee_id,
    amountPaid: amount_paid,
    method,
    paymentDate: payment_date ? new Date(payment_date) : new Date(),
    createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined
  });

  await payment.save();
  res.status(201).json(toPaymentDto(payment.toObject()));
}));

// ============= Expenses API =============
router.get('/expenses', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (_req, res) => {
  const expenses = await Expense.find().lean();
  res.json(expenses.map(toExpenseDto));
}));

router.get('/expenses/:id', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.HEAD_TEACHER), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid expense ID' });
  const expense = await Expense.findById(req.params.id).lean();
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(toExpenseDto(expense));
}));

router.post('/expenses', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { category, description = '', amount, date, status } = req.body;
  const expenseId = await getNextSequence('expenseId', 1);
  const expense = new Expense({
    expenseId,
    category,
    description,
    amount,
    date: date ? new Date(date) : new Date(),
    status: status || 'recorded',
    createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined
  });
  await expense.save();
  res.status(201).json(toExpenseDto(expense.toObject()));
}));

router.put('/expenses/:id', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid expense ID' });
  const expense = await Expense.findById(req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  const { category, description, amount, date, status } = req.body;
  if (category !== undefined) expense.category = category;
  if (description !== undefined) expense.description = description;
  if (amount !== undefined) expense.amount = amount;
  if (date !== undefined) expense.date = new Date(date);
  if (status !== undefined) expense.status = status;

  await expense.save();
  res.json(toExpenseDto(expense.toObject()));
}));

router.delete('/expenses/:id', requireAuth, requireRole(ROLES.ACCOUNTS, ROLES.ADMIN), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid expense ID' });
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json({ message: 'Expense deleted' });
}));


// ============= Issues API =============
router.get('/issues', requireAuth, asyncHandler(async (req, res) => {
  const { status, category, priority, assignedTo } = req.query;
  const filter = {};
  
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  
  const issues = await Issue.find(filter)
    .populate('reportedBy', 'email')
    .populate('assignedTo', 'email')
    .populate('resolvedBy', 'email')
    .sort({ createdAt: -1 })
    .lean();
  res.json(issues);
}));

router.get('/issues/:id', requireAuth, asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .populate('reportedBy', 'email role')
    .populate('assignedTo', 'email role')
    .populate('resolvedBy', 'email')
    .populate('comments.author', 'email')
    .lean();
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  res.json(issue);
}));

router.post('/issues', requireAuth, asyncHandler(async (req, res) => {
  const { title, description, category, priority, tags, dueDate } = req.body;
  
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }
  
  const issue = new Issue({
    title,
    description,
    category,
    priority: priority || 'medium',
    tags,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    reportedBy: req.user.id
  });
  
  await issue.save();
  const populated = await Issue.findById(issue._id)
    .populate('reportedBy', 'email')
    .lean();
  res.status(201).json(populated);
}));

router.put('/issues/:id', requireAuth, asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  
  // Only allow updating if user is reporter, assignee, or admin
  const canUpdate = 
    issue.reportedBy.toString() === req.user.id ||
    (issue.assignedTo && issue.assignedTo.toString() === req.user.id) ||
    req.user.role === 'admin';
  
  if (!canUpdate) {
    return res.status(403).json({ error: 'Not authorized to update this issue' });
  }
  
  const { title, description, category, priority, status, assignedTo, tags, dueDate } = req.body;
  
  if (title !== undefined) issue.title = title;
  if (description !== undefined) issue.description = description;
  if (category !== undefined) issue.category = category;
  if (priority !== undefined) issue.priority = priority;
  if (status !== undefined) issue.status = status;
  if (assignedTo !== undefined) issue.assignedTo = assignedTo;
  if (tags !== undefined) issue.tags = tags;
  if (dueDate !== undefined) issue.dueDate = dueDate ? new Date(dueDate) : null;
  
  await issue.save();
  const populated = await Issue.findById(issue._id)
    .populate('reportedBy', 'email')
    .populate('assignedTo', 'email')
    .lean();
  res.json(populated);
}));

router.put('/issues/:id/resolve', requireAuth, asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  
  const { resolution } = req.body;
  await issue.resolve(req.user.id, resolution);
  
  const populated = await Issue.findById(issue._id)
    .populate('reportedBy', 'email')
    .populate('resolvedBy', 'email')
    .lean();
  res.json(populated);
}));

router.post('/issues/:id/comment', requireAuth, asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text is required' });
  
  await issue.addComment(req.user.id, text);
  
  const populated = await Issue.findById(issue._id)
    .populate('comments.author', 'email')
    .lean();
  res.json(populated);
}));

router.delete('/issues/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const issue = await Issue.findByIdAndDelete(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  res.json({ message: 'Issue deleted' });
}));

// ============= Parents API =============
router.get('/parents', requireAuth, asyncHandler(async (_req, res) => {
  const parents = await Parent.find({}).lean();
  res.json(parents);
}));

// ============= Messages API =============
router.use('/messages', messageRoutes);

// ============= Reports API =============
router.use('/reports', reportRoutes);

// ============= Timetable Management API =============
router.use('/timetable', timetableRoutes);

// ============= Exam Results API =============
router.use('/', examResultsRoutes);

module.exports = router;
