/**
 * Timetable Management Model
 * Comprehensive timetable system following the prototype structure
 */
const mongoose = require('mongoose');

/**
 * Period Schema - Represents a single period in a day
 */
const periodSchema = new mongoose.Schema({
  period: { type: Number, required: true },
  subject: { type: String, required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  time: { type: String, required: true } // Format: "09:00-10:00"
}, { _id: false });

/**
 * Day Schema - Represents a single day with multiple periods
 */
const daySchema = new mongoose.Schema({
  day: { 
    type: String, 
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  periods: [periodSchema]
}, { _id: false });

/**
 * Timetable Schedule Schema - Main timetable for a classroom
 */
const timetableScheduleSchema = new mongoose.Schema({
  classroomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Classroom', 
    required: true 
  },
  timetable: [daySchema],
  academicYear: { type: String, default: () => new Date().getFullYear().toString() },
  term: { 
    type: String, 
    enum: ['Term 1', 'Term 2', 'Term 3', 'Semester 1', 'Semester 2'],
    default: 'Term 1'
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for efficient queries
timetableScheduleSchema.index({ classroomId: 1, academicYear: 1, term: 1 }, { unique: true });
timetableScheduleSchema.index({ classroomId: 1, isActive: 1 });
timetableScheduleSchema.index({ academicYear: 1, term: 1 });

/**
 * Get timetable for a specific day
 */
timetableScheduleSchema.methods.getDaySchedule = function(dayName) {
  return this.timetable.find(d => d.day === dayName);
};

/**
 * Get all periods for a specific instructor
 */
timetableScheduleSchema.methods.getInstructorSchedule = function(instructorId) {
  const schedule = [];
  this.timetable.forEach(day => {
    day.periods.forEach(period => {
      if (period.instructorId.equals(instructorId)) {
        schedule.push({
          day: day.day,
          period: period.period,
          subject: period.subject,
          time: period.time
        });
      }
    });
  });
  return schedule;
};

/**
 * Check for scheduling conflicts
 */
timetableScheduleSchema.methods.hasConflict = function(day, period, instructorId) {
  const daySchedule = this.getDaySchedule(day);
  if (!daySchedule) return false;
  
  return daySchedule.periods.some(p => 
    p.period === period && p.instructorId.equals(instructorId)
  );
};

/**
 * Instructor Schema - Teachers and their subjects they can teach
 */
const instructorSchema = new mongoose.Schema({
  staffId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Staff', 
    required: true,
    unique: true
  },
  subjects: [{ type: String, required: true }], // List of subjects the instructor can teach
  maxHoursPerWeek: { type: Number, default: 40 },
  availability: [{
    day: { 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    periods: [{ type: Number }]
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

/**
 * Course Schema - Links classrooms to subjects
 */
const courseSchema = new mongoose.Schema({
  classroomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Classroom', 
    required: true 
  },
  subjects: [{
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    name: { type: String, required: true },
    code: { type: String, required: true },
    hoursPerWeek: { type: Number, default: 3 }
  }],
  academicYear: { type: String, default: () => new Date().getFullYear().toString() },
  term: { 
    type: String, 
    enum: ['Term 1', 'Term 2', 'Term 3', 'Semester 1', 'Semester 2'],
    default: 'Term 1'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

courseSchema.index({ classroomId: 1, academicYear: 1, term: 1 }, { unique: true });

const TimetableSchedule = mongoose.model('TimetableSchedule', timetableScheduleSchema);
const Instructor = mongoose.model('Instructor', instructorSchema);
const Course = mongoose.model('Course', courseSchema);

module.exports = { 
  TimetableSchedule, 
  Instructor, 
  Course 
};
