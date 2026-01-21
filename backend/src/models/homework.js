const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: ['pending', 'assigned', 'completed'],
      default: 'pending'
    },
    submissions: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student'
        },
        submissionDate: Date,
        attachments: [
          {
            name: String,
            url: String
          }
        ],
        status: {
          type: String,
          enum: ['not-submitted', 'submitted', 'graded'],
          default: 'not-submitted'
        },
        grade: Number,
        feedback: String,
        gradedAt: Date,
        gradedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Staff'
        }
      }
    ],
    academicYear: {
      type: String,
      required: true
    },
    term: {
      type: String,
      enum: ['General', 'First', 'Second', 'Third'],
      default: 'General'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    }
  },
  { timestamps: true }
);

// Index for efficient queries
homeworkSchema.index({ classroomId: 1, academicYear: 1, term: 1 });
homeworkSchema.index({ dueDate: 1 });
homeworkSchema.index({ teacher: 1 });

const Homework = mongoose.model('Homework', homeworkSchema);

module.exports = { Homework };
