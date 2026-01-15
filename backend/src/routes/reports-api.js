const express = require('express')
const { asyncHandler } = require('../middleware/errorHandler')
const { requireAuth } = require('../middleware/rbac')
const ReportGenerator = require('../services/reportGenerator')
const { Attendance } = require('../models/attendance')
const { Grade } = require('../models/grades')
const { Fee } = require('../models/fees')
const { Student } = require('../models/student')
const { Staff } = require('../models/staff')
const { Classroom } = require('../models/classroom')
const { Subject } = require('../models/subjects')
const { Payment } = require('../models/payment')

const router = express.Router()

// Generate attendance report
router.get('/attendance', requireAuth, asyncHandler(async (req, res) => {
  const { studentId, classId, startDate, endDate } = req.query
  
  console.log('[REPORT] Generating attendance report:', { studentId, classId, startDate, endDate })

  // Build filter
  const filter = {}
  if (studentId) filter.studentId = studentId
  if (classId) filter.classLevel = classId
  if (startDate || endDate) {
    filter.date = {}
    if (startDate) filter.date.$gte = new Date(startDate)
    if (endDate) filter.date.$lte = new Date(endDate)
  }

  const attendanceRecords = await Attendance.find(filter)
    .populate('studentId', 'firstName lastName')
    .sort({ date: -1 })
    .lean()

  console.log('[REPORT] Found attendance records:', attendanceRecords.length)

  // Get student and class details
  let studentName = 'All Students'
  let className = 'All Classes'

  if (studentId) {
    const student = await Student.findById(studentId).select('firstName lastName').lean()
    if (student) {
      studentName = `${student.firstName} ${student.lastName}`
    }
  }

  if (classId) {
    const cls = await Classroom.findById(classId).select('className').lean()
    if (cls) className = cls.className
  }

  // Generate PDF
  const doc = await ReportGenerator.generateAttendanceReport(attendanceRecords, {
    studentName,
    className,
    startDate: startDate || new Date(new Date().getFullYear(), 0, 1),
    endDate: endDate || new Date(),
    school: 'School Management System'
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${Date.now()}.pdf"`)
  doc.pipe(res)
}))

// Generate grade report
router.get('/grades', requireAuth, asyncHandler(async (req, res) => {
  const { studentId, classId, term } = req.query

  console.log('[REPORT] Generating grade report:', { studentId, classId, term })

  const filter = {}
  if (studentId) filter.studentId = studentId
  if (classId) filter.classLevel = classId
  if (term) filter.term = term

  const gradeRecords = await Grade.find(filter)
    .populate('studentId', 'firstName lastName')
    .lean()

  console.log('[REPORT] Found grade records:', gradeRecords.length)

  // Transform to report format
  const formattedGrades = gradeRecords.map(g => ({
    subject: g.subject || '-',
    marksObtained: g.finalGrade || g.midTermGrade || g.endTermGrade || 0,
    totalMarks: 100,
    percentage: g.finalGrade || g.midTermGrade || g.endTermGrade || 0
  }))

  // Get student and class details
  let studentName = 'All Students'
  let className = 'All Classes'

  if (studentId) {
    const student = await Student.findById(studentId).select('firstName lastName').lean()
    if (student) {
      studentName = `${student.firstName} ${student.lastName}`
    }
  }

  if (classId) {
    const cls = await Classroom.findById(classId).select('className').lean()
    if (cls) className = cls.className
  }

  const doc = await ReportGenerator.generateGradeReport(formattedGrades, {
    studentName,
    className,
    term: term || 'Current',
    school: 'School Management System'
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="grades-report-${Date.now()}.pdf"`)
  doc.pipe(res)
}))

// Generate fee statement
router.get('/fees', requireAuth, asyncHandler(async (req, res) => {
  const { studentId } = req.query

  console.log('[REPORT] Generating fee statement:', { studentId })

  if (!studentId) {
    return res.status(400).json({ error: 'studentId is required for fee statement' })
  }

  // Get student info
  const student = await Student.findById(studentId).select('firstName lastName classLevel').lean()
  if (!student) {
    return res.status(404).json({ error: 'Student not found' })
  }

  const className = student.classLevel || '-'

  // Get all fees for student
  const fees = await Fee.find({ studentId })
    .select('feeName amount amountPaid paymentStatus dueDate')
    .lean()

  console.log('[REPORT] Found fees:', fees.length)

  const feeData = {
    fees: fees.map(f => ({
      type: f.feeName || 'Fee',
      amount: f.amount || 0,
      amountPaid: f.amountPaid || 0,
      paymentStatus: f.paymentStatus || 'Pending'
    }))
  }

  const doc = await ReportGenerator.generateFeeStatement(feeData, {
    studentName: `${student.firstName} ${student.lastName}`,
    className,
    academicYear: new Date().getFullYear(),
    school: 'School Management System'
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="fee-statement-${Date.now()}.pdf"`)
  doc.pipe(res)
}))

// Generate analytics report (admin only)
router.get('/analytics', requireAuth, asyncHandler(async (req, res) => {
  const { period } = req.query

  console.log('[REPORT] Generating analytics report:', { period })

  // Check if user is admin
  const userRole = req.user?.role || 'user'
  if (!['admin', 'head-teacher'].includes(userRole)) {
    return res.status(403).json({ error: 'Unauthorized - Admin access required' })
  }

  // Get overall statistics
  const [totalStudents, totalStaff, totalClasses, totalSubjects] = await Promise.all([
    Student.countDocuments(),
    Staff.countDocuments(),
    Classroom.countDocuments(),
    Subject.countDocuments()
  ])

  // Get class statistics
  const classStats = await Classroom.find()
    .select('className')
    .lean()
    .then(classes => Promise.all(classes.map(async (cls) => {
      const studentCount = await Student.countDocuments({ classId: cls._id })
      const teacherCount = await Staff.countDocuments({ classId: cls._id, role: 'teacher' })
      
      // Calculate average attendance
      const attendanceRecords = await Attendance.find({ classId: cls._id })
      const avgAttendance = attendanceRecords.length > 0
        ? (attendanceRecords.filter(a => a.status === 'present').length / attendanceRecords.length) * 100
        : 0

      return {
        className: cls.className,
        studentCount,
        teacherCount,
        avgAttendance
      }
    })))

  // Get attendance summary
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayAttendance = await Attendance.find({ date: today }).lean()
  
  const attendanceSummary = {
    presentToday: todayAttendance.filter(a => a.status === 'present').length,
    absentToday: todayAttendance.filter(a => a.status === 'absent').length,
    average: 85
  }

  // Get finance summary
  const allFees = await Fee.find().lean()
  const totalCollected = allFees.reduce((sum, f) => sum + (f.amountPaid || 0), 0)
  const totalAmount = allFees.reduce((sum, f) => sum + (f.amount || 0), 0)
  const outstanding = totalAmount - totalCollected
  const collectionRate = totalAmount > 0 ? (totalCollected / totalAmount) * 100 : 0

  const financeSummary = {
    totalCollected,
    outstanding,
    collectionRate
  }

  const analyticsData = {
    overview: {
      totalStudents,
      totalStaff,
      totalClasses,
      totalSubjects
    },
    classstats: classStats,
    attendance: attendanceSummary,
    finance: financeSummary
  }

  console.log('[REPORT] Analytics data:', analyticsData)

  const doc = await ReportGenerator.generateAnalyticsReport(analyticsData, {
    school: 'School Management System',
    period: period || 'Current Session'
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${Date.now()}.pdf"`)
  doc.pipe(res)
}))

// Get available report types and parameters
router.get('/available', requireAuth, asyncHandler(async (req, res) => {
  const classes = await Classroom.find().select('_id className').lean()
  const students = await Student.find().select('_id firstName lastName classId').lean()
  const subjects = await Subject.find().select('_id subjectName').lean()

  res.json({
    success: true,
    reportTypes: [
      { id: 'attendance', name: 'Attendance Report', description: 'Generate attendance records' },
      { id: 'grades', name: 'Grade Report', description: 'Generate student grades and results' },
      { id: 'fees', name: 'Fee Statement', description: 'Generate student fee statements' },
      { id: 'analytics', name: 'Analytics Report', description: 'School-wide analytics (Admin only)' }
    ],
    parameters: {
      classes: classes.map(c => ({ id: c._id, name: c.className })),
      students: students.map(s => ({ id: s._id, name: `${s.firstName} ${s.lastName}`, classId: s.classId })),
      subjects: subjects.map(s => ({ id: s._id, name: s.subjectName }))
    }
  })
}))

module.exports = router
