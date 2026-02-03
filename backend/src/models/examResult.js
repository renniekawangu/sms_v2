const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam is required']
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required']
    },

    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Classroom is required']
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required']
    },

    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100']
    },

    maxMarks: {
      type: Number,
      default: 100,
      min: [1, 'Max marks must be at least 1'],
      max: [1000, 'Max marks cannot exceed 1000']
    },

    percentage: {
      type: Number,
      computed: true
    },

    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
      required: true
    },

    remarks: {
      type: String,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitted by user is required']
    },

    submittedAt: {
      type: Date
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    approvedAt: {
      type: Date
    },

    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    publishedAt: {
      type: Date
    },

    rejectionReason: {
      type: String,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    },

    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'published', 'rejected'],
      default: 'draft'
    },

    isDeleted: {
      type: Boolean,
      default: false,
      select: false
    }
  },
  {
    timestamps: true,
    collection: 'exam_results'
  }
);

// Compound unique index - one result per student per subject per exam
examResultSchema.index(
  { exam: 1, student: 1, subject: 1, classroom: 1 },
  { unique: true, sparse: true }
);

// Other indexes for queries
examResultSchema.index({ student: 1, exam: 1 });
examResultSchema.index({ classroom: 1, exam: 1 });
examResultSchema.index({ exam: 1, status: 1 });
examResultSchema.index({ status: 1, submittedAt: -1 });
examResultSchema.index({ student: 1, 'createdAt': -1 });

// Pre-save: Calculate grade from score
examResultSchema.pre('save', function(next) {
  if (this.score !== undefined && this.score !== null) {
    const percentage = (this.score / this.maxMarks) * 100;
    this.percentage = Math.round(percentage);

    // Calculate grade
    if (percentage >= 80) this.grade = 'A';
    else if (percentage >= 60) this.grade = 'B';
    else if (percentage >= 40) this.grade = 'C';
    else if (percentage >= 20) this.grade = 'D';
    else this.grade = 'F';
  }
  next();
});

// Pre-save: Validate status transitions
examResultSchema.pre('save', async function(next) {
  if (!this.isNew) {
    const original = await mongoose.model('ExamResult').findById(this._id);
    if (original) {
      // Validate status transitions only if status is being changed
      if (this.isModified('status')) {
        const validTransitions = {
          'draft': ['submitted', 'deleted'],
          'submitted': ['approved', 'rejected', 'draft'],
          'approved': ['published', 'rejected'],
          'published': [],
          'rejected': ['draft']
        };

        const currentStatus = original.status;
        const newStatus = this.status;

        if (!validTransitions[currentStatus]?.includes(newStatus)) {
          throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
        }

        // Set timestamps for status changes
        if (newStatus === 'submitted' && !this.submittedAt) {
          this.submittedAt = new Date();
        }
        if (newStatus === 'approved' && !this.approvedAt) {
          this.approvedAt = new Date();
        }
        if (newStatus === 'published' && !this.publishedAt) {
          this.publishedAt = new Date();
        }
      }
    }
  }
  next();
});

// Method: Submit for approval
examResultSchema.methods.submit = async function(userId) {
  if (this.status !== 'draft') {
    throw new Error('Only draft results can be submitted');
  }
  this.status = 'submitted';
  this.submittedBy = userId;
  this.submittedAt = new Date();
  return await this.save();
};

// Method: Approve result
examResultSchema.methods.approve = async function(userId, comment = '') {
  if (this.status !== 'submitted') {
    throw new Error('Only submitted results can be approved');
  }
  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  return await this.save();
};

// Method: Publish result
examResultSchema.methods.publish = async function(userId) {
  if (this.status !== 'approved') {
    throw new Error('Only approved results can be published');
  }
  this.status = 'published';
  this.publishedBy = userId;
  this.publishedAt = new Date();
  return await this.save();
};

// Method: Reject result
examResultSchema.methods.reject = async function(userId, reason = '') {
  if (!['submitted', 'approved'].includes(this.status)) {
    throw new Error('Only submitted or approved results can be rejected');
  }
  this.status = 'rejected';
  this.rejectionReason = reason;
  return await this.save();
};

// Static: Get results for classroom exam
examResultSchema.statics.getClassroomExamResults = async function(examId, classroomId) {
  const results = await this.find({
    exam: examId,
    classroom: classroomId,
    isDeleted: false
  })
    .populate({
      path: 'student',
      select: 'studentId firstName lastName email',
      options: { lean: false }
    })
    .populate({
      path: 'subject',
      select: 'name code'
    })
    .sort({ student: 1 });
  
  // Convert to plain objects and ensure student name is computed
  return results.map(result => {
    const resultObj = result.toObject({ virtuals: true });
    // Explicitly compute name if not present
    if (resultObj.student && !resultObj.student.name) {
      resultObj.student.name = `${resultObj.student.firstName || ''} ${resultObj.student.lastName || ''}`.trim();
    }
    return resultObj;
  });
};

// Static: Get pending results for approval
examResultSchema.statics.getPendingResults = async function(filters = {}) {
  const query = {
    status: 'submitted',
    isDeleted: false
  };

  if (filters.classroom) query.classroom = filters.classroom;
  if (filters.exam) query.exam = filters.exam;

  return await this.find(query)
    .populate('exam', 'name examType term academicYear')
    .populate('student', 'studentId name email')
    .populate('classroom', 'name level')
    .populate('subject', 'name code')
    .populate('submittedBy', 'name email')
    .sort({ submittedAt: 1 });
};

// Static: Get student results
examResultSchema.statics.getStudentResults = async function(studentId, filters = {}) {
  const query = {
    student: studentId,
    status: 'published',
    isDeleted: false
  };

  if (filters.academicYear) {
    // Populate exam to check academicYear
    const results = await this.find(query).populate('exam');
    return results.filter(r => r.exam.academicYear === filters.academicYear);
  }

  return await this.find(query)
    .populate('exam', 'name examType term academicYear')
    .populate('subject', 'name code')
    .sort({ 'exam.createdAt': -1 });
};

// Static: Get statistics for exam
examResultSchema.statics.getExamStatistics = async function(examId, classroomId = null) {
  const matchStage = {
    exam: mongoose.Types.ObjectId(examId),
    status: 'published'
  };

  if (classroomId) {
    matchStage.classroom = mongoose.Types.ObjectId(classroomId);
  }

  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalResults: { $sum: 1 },
        averageScore: { $avg: '$score' },
        highestScore: { $max: '$score' },
        lowestScore: { $min: '$score' },
        gradeDistribution: {
          $push: '$grade'
        }
      }
    },
    {
      $addFields: {
        gradeStats: {
          A: {
            $size: {
              $filter: {
                input: '$gradeDistribution',
                as: 'grade',
                cond: { $eq: ['$$grade', 'A'] }
              }
            }
          },
          B: {
            $size: {
              $filter: {
                input: '$gradeDistribution',
                as: 'grade',
                cond: { $eq: ['$$grade', 'B'] }
              }
            }
          },
          C: {
            $size: {
              $filter: {
                input: '$gradeDistribution',
                as: 'grade',
                cond: { $eq: ['$$grade', 'C'] }
              }
            }
          },
          D: {
            $size: {
              $filter: {
                input: '$gradeDistribution',
                as: 'grade',
                cond: { $eq: ['$$grade', 'D'] }
              }
            }
          },
          F: {
            $size: {
              $filter: {
                input: '$gradeDistribution',
                as: 'grade',
                cond: { $eq: ['$$grade', 'F'] }
              }
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalResults: 1,
        averageScore: { $round: ['$averageScore', 2] },
        highestScore: 1,
        lowestScore: 1,
        gradeStats: 1
      }
    }
  ]);
};

const ExamResult = mongoose.model('ExamResult', examResultSchema);

module.exports = { ExamResult };
