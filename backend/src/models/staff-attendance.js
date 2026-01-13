/**
 * Staff Attendance Model
 * Tracks attendance for teachers and accountants
 */
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const staffAttendanceSchema = new mongoose.Schema({
  staffId: { type: ObjectId, ref: 'Staff', required: true },
  status: { type: String, required: true, enum: ['present', 'absent', 'late', 'excused'] },
  date: { type: Date, required: true },
  notes: { type: String },
  markedBy: { type: ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Prevent duplicate attendance per staff/date
staffAttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });
staffAttendanceSchema.index({ date: -1 });

const StaffAttendance = mongoose.model('StaffAttendance', staffAttendanceSchema);

// Normalize date to start of day
const toDateOnly = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get staff attendance by date
 */
async function getStaffAttendanceByDate(date, filters = {}) {
  const dateOnly = toDateOnly(date);
  return await StaffAttendance.find({ date: dateOnly, ...filters })
    .populate('staffId', 'firstName lastName email role')
    .populate('markedBy', 'email')
    .sort({ 'staffId.lastName': 1 });
}

/**
 * Get staff attendance for a specific staff member
 */
async function getAttendanceByStaff(staffId, startDate, endDate) {
  const query = { staffId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = toDateOnly(startDate);
    if (endDate) query.date.$lte = toDateOnly(endDate);
  }
  return await StaffAttendance.find(query)
    .populate('markedBy', 'email')
    .sort({ date: -1 });
}

/**
 * Mark bulk staff attendance
 */
async function markBulkStaffAttendance(attendanceRecords, markedBy) {
  const results = { success: [], failed: [] };
  
  for (const record of attendanceRecords) {
    try {
      const { staffId, status, date, notes } = record;
      const dateOnly = toDateOnly(date);
      
      const attendance = await StaffAttendance.findOneAndUpdate(
        { staffId, date: dateOnly },
        { status, notes, markedBy },
        { upsert: true, new: true }
      );
      
      results.success.push(attendance);
    } catch (err) {
      results.failed.push({ record, error: err.message });
    }
  }
  
  return results;
}

/**
 * Get staff attendance statistics
 */
async function getStaffAttendanceStats(staffId, startDate, endDate) {
  const match = { staffId };
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = toDateOnly(startDate);
    if (endDate) match.date.$lte = toDateOnly(endDate);
  }
  
  const stats = await StaffAttendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$staffId',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
}

/**
 * Delete staff attendance record
 */
async function deleteStaffAttendance(id) {
  return await StaffAttendance.findByIdAndDelete(id);
}

module.exports = {
  StaffAttendance,
  getStaffAttendanceByDate,
  getAttendanceByStaff,
  markBulkStaffAttendance,
  getStaffAttendanceStats,
  deleteStaffAttendance
};
