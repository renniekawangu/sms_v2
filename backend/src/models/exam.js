const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
      maxlength: [100, 'Exam name cannot exceed 100 characters']
    },

    examType: {
      type: String,
      enum: ['unit-test', 'midterm', 'endterm', 'final', 'diagnostic', 'formative'],
      default: 'unit-test'
    },

    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },

    term: {
      type: String,
      required: [true, 'Term is required'],
      enum: ['Term 1', 'Term 2', 'Term 3'],
      trim: true
    },

    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true
    },

    classrooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom'
      }
    ],

    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],

    totalMarks: {
      type: Number,
      default: 100,
      min: [1, 'Total marks must be at least 1'],
      max: [1000, 'Total marks cannot exceed 1000']
    },

    scheduledDate: {
      type: Date,
      validate: {
        validator: function(value) {
          if (!value) return true;
          return value > new Date();
        },
        message: 'Scheduled date must be in the future'
      }
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'cancelled'],
      default: 'draft'
    },

    publishedDate: {
      type: Date,
      validate: {
        validator: function(value) {
          if (!value) return true;
          return value <= new Date();
        },
        message: 'Published date cannot be in the future'
      }
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required']
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    passingMarks: {
      type: Number,
      default: 40,
      min: 0,
      max: 100
    },

    gradeScale: {
      type: Map,
      of: String,
      default: new Map([
        ['A', '80-100'],
        ['B', '60-79'],
        ['C', '40-59'],
        ['D', '20-39'],
        ['F', '0-19']
      ])
    },

    remarks: {
      type: String,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    },

    isDeleted: {
      type: Boolean,
      default: false,
      select: false
    }
  },
  {
    timestamps: true,
    collection: 'exams'
  }
);

// Indexes
examSchema.index({ academicYear: 1, term: 1, status: 1 });
examSchema.index({ createdBy: 1, createdAt: -1 });
examSchema.index({ classrooms: 1 });
examSchema.index({ 'academicYear': 1, 'term': 1, '_id': 1 });

// Pre-save: Validate exam is not being updated if it's closed
examSchema.pre('save', async function(next) {
  if (!this.isNew && this.status === 'closed') {
    const original = await mongoose.model('Exam').findById(this._id);
    if (original && original.status === 'closed') {
      throw new Error('Cannot modify a closed exam');
    }
  }
  next();
});

// Method: Get total results entered for this exam
examSchema.methods.getResultsCount = async function() {
  const ExamResult = require('./examResult');
  return await ExamResult.countDocuments({ exam: this._id });
};

// Method: Get pending results for this exam
examSchema.methods.getPendingResults = async function() {
  const ExamResult = require('./examResult');
  return await ExamResult.find({
    exam: this._id,
    status: { $in: ['draft', 'submitted'] }
  });
};

// Method: Publish exam
examSchema.methods.publish = async function() {
  if (this.status !== 'draft') {
    throw new Error('Only draft exams can be published');
  }
  this.status = 'published';
  this.publishedDate = new Date();
  return await this.save();
};

// Method: Close exam (no more results can be entered)
examSchema.methods.close = async function() {
  if (this.status === 'closed') {
    throw new Error('Exam is already closed');
  }
  this.status = 'closed';
  return await this.save();
};

// Static: Calculate grade from marks
examSchema.statics.calculateGrade = function(marks, maxMarks = 100) {
  if (marks === undefined || marks === null) return null;
  const percentage = (marks / maxMarks) * 100;
  
  if (percentage >= 80) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 40) return 'C';
  if (percentage >= 20) return 'D';
  return 'F';
};

// Static: Get all active exams for academic year
examSchema.statics.getActiveExams = async function(academicYear) {
  return await this.find({
    academicYear,
    status: { $in: ['draft', 'published'] },
    isDeleted: false
  }).sort({ createdAt: -1 });
};

const Exam = mongoose.model('Exam', examSchema);

module.exports = { Exam };
