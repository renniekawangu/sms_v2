/**
 * Exam Model
 * Manages exam scheduling and configuration
 */
const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  examType: { 
    type: String, 
    enum: ['midterm', 'final', 'quiz', 'test', 'practical', 'assignment'], 
    required: true,
    default: 'test'
  },
  subject: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject', 
    required: true 
  },
  classroom: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Classroom' 
  },
  date: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, // Format: "HH:MM" e.g., "09:00"
    trim: true
  },
  endTime: { 
    type: String, // Format: "HH:MM" e.g., "11:00"
    trim: true
  },
  duration: { 
    type: Number, // in minutes
    min: 0
  },
  totalMarks: { 
    type: Number, 
    required: true,
    min: 0
  },
  passingMarks: { 
    type: Number,
    min: 0
  },
  academicYear: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SchoolSettings.academicYears' 
  },
  term: { 
    type: String,
    enum: ['Term 1', 'Term 2', 'Term 3', 'Semester 1', 'Semester 2'],
    trim: true
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'], 
    default: 'scheduled' 
  },
  room: {
    type: String,
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true 
});

// Indexes for performance
examSchema.index({ date: 1, status: 1 });
examSchema.index({ subject: 1, classroom: 1 });
examSchema.index({ academicYear: 1, term: 1 });

// Virtual for checking if exam is upcoming
examSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date() && this.status === 'scheduled';
});

// Virtual for checking if exam is past
examSchema.virtual('isPast').get(function() {
  return this.date < new Date();
});

// Ensure virtuals are included in JSON/Object serialization
examSchema.set('toJSON', { virtuals: true });
examSchema.set('toObject', { virtuals: true });

const Exam = mongoose.model('Exam', examSchema);

module.exports = { Exam };
