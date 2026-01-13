/**
 * Attendance Model
 * Tracks student attendance records
 */
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// Each document represents a single student's attendance for a given date/subject
const attendanceSchema = new mongoose.Schema({
  studentId: { type: ObjectId, ref: 'Student', required: true },
  status: { type: String, required: true, enum: ['present', 'absent', 'late', 'excused'] },
  date: { type: Date, required: true },
  subject: { type: String, required: true },
  classLevel: { type: String },
  notes: { type: String },
  markedBy: { type: ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Prevent duplicate attendance per student/date/subject
attendanceSchema.index({ studentId: 1, date: 1, subject: 1 }, { unique: true });
attendanceSchema.index({ classLevel: 1, date: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Normalize any date-like input to the start of the day (midnight)
const toDateOnly = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get all attendance records
 */
async function getAllAttendance(filters = {}) {
  return await Attendance.find(filters)
    .populate('studentId', 'firstName lastName studentId')
    .populate('markedBy', 'email')
    .sort({ date: -1 });
}

/**
 * Get attendance by ID
 */
async function getAttendanceById(id) {
  return await Attendance.findById(id)
    .populate('studentId')
    .populate('markedBy');
}

/**
 * Get attendance by student
 */
async function getAttendanceByStudent(studentId, startDate, endDate) {
  const query = { studentId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.date.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }
  return await Attendance.find(query)
    .maxTimeMS(3000)
    .lean()
    .sort({ date: -1 });
}

/**
 * Get attendance by date
 */
async function getAttendanceByDate(date, subject = null) {
  const start = new Date(date);
  const end = new Date(date);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const query = { date: { $gte: start, $lt: end } };
  if (subject) query.subject = subject;
  
  return await Attendance.find(query)
    .populate('studentId', 'firstName lastName studentId')
    .sort({ 'studentId.firstName': 1 });
}

/**
 * Create attendance record
 */
async function createAttendance(attendanceData) {
  let classLevel = attendanceData.classLevel;
  if (!classLevel && attendanceData.studentId) {
    const { Student } = require('./student');
    const student = await Student.findById(attendanceData.studentId, { classLevel: 1 });
    classLevel = student?.classLevel;
  }

  const attendance = new Attendance({
    ...attendanceData,
    classLevel,
    date: toDateOnly(attendanceData.date)
  });
  return await attendance.save();
}

/**
 * Mark bulk attendance
 */
async function markBulkAttendance(attendanceRecords) {
  const results = { success: [], errors: [] };

  // Preload class levels for students to avoid N+1 fetches
  const uniqueStudentIds = [...new Set(attendanceRecords.map(r => String(r.studentId)))];
  const studentClassMap = {};
  if (uniqueStudentIds.length) {
    const { Student } = require('./student');
    const students = await Student.find({ _id: { $in: uniqueStudentIds } }, { classLevel: 1 });
    students.forEach(s => { studentClassMap[String(s._id)] = s.classLevel; });
  }

  for (const record of attendanceRecords) {
    try {
      const payload = { ...record, date: toDateOnly(record.date) };

      if (!payload.subject) {
        throw new Error('subject is required for attendance');
      }

      if (!payload.classLevel) {
        payload.classLevel = studentClassMap[String(payload.studentId)] || null;
      }

      const attendance = await Attendance.findOneAndUpdate(
        { studentId: payload.studentId, date: payload.date, subject: payload.subject },
        { $set: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      results.success.push(attendance);
    } catch (err) {
      results.errors.push({ error: err.message, record });
    }
  }

  return results;
}

/**
 * Convenience helper to mark attendance for one subject on a given date.
 * records: [{ studentId, status, notes? }]
 */
async function markSubjectAttendance({ subject, date, records, markedBy }) {
  if (!subject || !date || !Array.isArray(records)) {
    throw new Error('subject, date, and records are required');
  }

  const shaped = records.map(r => ({
    studentId: r.studentId,
    status: r.status,
    notes: r.notes,
    date,
    subject,
    markedBy
  }));

  return markBulkAttendance(shaped);
}

/**
 * Update attendance
 */
async function updateAttendance(id, updates) {
  if (updates.date) {
    updates.date = toDateOnly(updates.date);
  }
  return await Attendance.findByIdAndUpdate(id, updates, { new: true });
}

/**
 * Delete attendance
 */
async function deleteAttendance(id) {
  return await Attendance.findByIdAndDelete(id);
}

/**
 * Get attendance statistics for a student
 */
async function getStudentAttendanceStats(studentId, startDate, endDate) {
  const query = { studentId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.date.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const stats = await Attendance.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  result.attendanceRate = result.total > 0 
    ? ((result.present + result.excused) / result.total * 100).toFixed(2)
    : 0;

  return result;
}

module.exports = {
  Attendance,
  getAllAttendance,
  getAttendanceById,
  getAttendanceByStudent,
  getAttendanceByDate,
  createAttendance,
  markBulkAttendance,
  markSubjectAttendance,
  updateAttendance,
  deleteAttendance,
  getStudentAttendanceStats
};
