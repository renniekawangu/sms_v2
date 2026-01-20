const mongoose = require('mongoose')

const examResultSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true
    },
    academicYear: {
      type: String,
      required: true,
      default: new Date().getFullYear().toString()
    },
    term: {
      type: String,
      enum: ['term1', 'term2', 'term3'],
      required: true
    },
    
    // Subject-wise results
    subjectResults: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true
        },
        score: {
          type: Number,
          required: true,
          min: 0
        },
        maxMarks: {
          type: Number,
          default: 100,
          min: 1
        },
        percentage: {
          type: Number,
          min: 0,
          max: 100
        },
        grade: {
          type: String,
          enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'NA'],
          default: 'NA'
        },
        remarks: String
      }
    ],
    
    // Aggregate scores
    totalScore: {
      type: Number,
      required: true
    },
    totalMaxMarks: {
      type: Number,
      required: true,
      default: 100
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    overallGrade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'NA'],
      default: 'NA'
    },
    
    // Metadata
    status: {
      type: String,
      enum: ['draft', 'submitted', 'published', 'approved'],
      default: 'draft'
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: String,
    
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
    submittedAt: Date,
    approvedAt: Date,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

// Indexes for fast queries
examResultSchema.index({ student: 1, academicYear: 1, term: 1 })
examResultSchema.index({ exam: 1 })
examResultSchema.index({ classroom: 1, term: 1, academicYear: 1 })
examResultSchema.index({ student: 1, exam: 1 }, { unique: true })
examResultSchema.index({ academicYear: 1, term: 1 })

// Calculate percentage and grade
examResultSchema.methods.calculateGrade = function() {
  if (this.totalMaxMarks === 0) return 'NA'
  
  this.percentage = (this.totalScore / this.totalMaxMarks) * 100
  
  // Grade scale
  if (this.percentage >= 95) this.overallGrade = 'A+'
  else if (this.percentage >= 90) this.overallGrade = 'A'
  else if (this.percentage >= 85) this.overallGrade = 'B+'
  else if (this.percentage >= 80) this.overallGrade = 'B'
  else if (this.percentage >= 75) this.overallGrade = 'C+'
  else if (this.percentage >= 70) this.overallGrade = 'C'
  else if (this.percentage >= 60) this.overallGrade = 'D'
  else this.overallGrade = 'F'
  
  // Calculate subject grades
  this.subjectResults.forEach(result => {
    if (result.maxMarks) {
      result.percentage = (result.score / result.maxMarks) * 100
      
      if (result.percentage >= 95) result.grade = 'A+'
      else if (result.percentage >= 90) result.grade = 'A'
      else if (result.percentage >= 85) result.grade = 'B+'
      else if (result.percentage >= 80) result.grade = 'B'
      else if (result.percentage >= 75) result.grade = 'C+'
      else if (result.percentage >= 70) result.grade = 'C'
      else if (result.percentage >= 60) result.grade = 'D'
      else result.grade = 'F'
    }
  })
}

// Pre-save hook
examResultSchema.pre('save', function(next) {
  this.calculateGrade()
  next()
})

module.exports = mongoose.model('ExamResult', examResultSchema)
