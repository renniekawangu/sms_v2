const mongoose = require('mongoose');

/**
 * Timetable Schema - Container for a class's weekly schedule for a specific term
 * One timetable per classroom per term
 */
const timetableSchema = new mongoose.Schema({
  // Reference to the classroom
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true,
  },
  
  // Academic year
  academicYear: {
    type: String,
    required: true,
  },
  
  // Term/semester
  term: {
    type: String,
    required: true,
    enum: ['Term 1', 'Term 2', 'Term 3', 'Semester 1', 'Semester 2'],
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Notes about this timetable
  notes: {
    type: String,
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Compound unique index: One active timetable per classroom per term
timetableSchema.index({ classroom: 1, academicYear: 1, term: 1 }, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

// Index for querying by classroom
timetableSchema.index({ classroom: 1, isActive: 1 });

// Index for querying by academic year and term
timetableSchema.index({ academicYear: 1, term: 1 });

/**
 * Find or create a timetable for a classroom/term
 */
timetableSchema.statics.findOrCreate = async function(classroom, academicYear, term, userId) {
  let timetable = await this.findOne({
    classroom,
    academicYear,
    term,
    isActive: true,
  });
  
  if (!timetable) {
    timetable = await this.create({
      classroom,
      academicYear,
      term,
      isActive: true,
      createdBy: userId,
    });
  }
  
  return timetable;
};

/**
 * Get timetable with all entries populated
 */
timetableSchema.methods.getWithEntries = async function() {
  const TimetableEntry = mongoose.model('TimetableEntry');
  
  const entries = await TimetableEntry.find({ 
    timetable: this._id,
    isActive: true 
  })
    .populate('subject', 'name code')
    .populate('teacher', 'firstName lastName email')
    .populate('room')
    .sort({ dayOfWeek: 1, startTime: 1 });
  
  return {
    timetable: this.toObject(),
    entries,
  };
};

const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;
