/**
 * Timetable Model
 * Manages class scheduling and timetable entries
 */
const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  classroom: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Classroom', 
    required: true 
  },
  subject: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject', 
    required: true 
  },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Staff', 
    required: true 
  },
  dayOfWeek: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true, // Format: "HH:MM" e.g., "09:00"
    trim: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM`
    }
  },
  endTime: { 
    type: String, 
    required: true, // Format: "HH:MM" e.g., "10:00"
    trim: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM`
    }
  },
  room: { 
    type: String,
    trim: true
  },
  period: {
    type: Number, // Period number (1, 2, 3, etc.)
    min: 1
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
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
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

// Compound index to prevent double-booking
timetableEntrySchema.index({ 
  classroom: 1, 
  dayOfWeek: 1, 
  startTime: 1 
}, { unique: true });

// Index for teacher schedule queries
timetableEntrySchema.index({ 
  teacher: 1, 
  dayOfWeek: 1 
});

// Index for subject and classroom queries
timetableEntrySchema.index({ 
  subject: 1, 
  classroom: 1 
});

// Virtual to calculate duration in minutes
timetableEntrySchema.virtual('durationMinutes').get(function() {
  if (!this.startTime || !this.endTime) return 0;
  
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;
  
  return endTotalMinutes - startTotalMinutes;
});

// Ensure virtuals are included in JSON/Object serialization
timetableEntrySchema.set('toJSON', { virtuals: true });
timetableEntrySchema.set('toObject', { virtuals: true });

// Method to check for conflicts
timetableEntrySchema.statics.checkConflict = async function(classroom, teacher, dayOfWeek, startTime, endTime, excludeId = null) {
  const query = {
    dayOfWeek,
    isActive: true,
    $or: [
      { classroom },
      { teacher }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingEntries = await this.find(query);
  
  // Check for time overlap
  for (const entry of existingEntries) {
    const existingStart = entry.startTime;
    const existingEnd = entry.endTime;
    
    // Check if times overlap
    const hasOverlap = 
      (startTime >= existingStart && startTime < existingEnd) ||
      (endTime > existingStart && endTime <= existingEnd) ||
      (startTime <= existingStart && endTime >= existingEnd);
    
    if (hasOverlap) {
      return {
        hasConflict: true,
        conflictWith: entry
      };
    }
  }
  
  return { hasConflict: false };
};

const Timetable = mongoose.model('Timetable', timetableEntrySchema);

module.exports = { Timetable };
