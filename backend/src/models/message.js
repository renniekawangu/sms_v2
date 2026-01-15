const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    sender: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      userType: {
        type: String, // 'teacher', 'parent', 'admin', etc.
        required: true
      },
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      }
    },
    recipient: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      userType: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      }
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    attachments: [{
      fileName: String,
      fileUrl: String,
      uploadedAt: Date
    }],
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    category: {
      type: String,
      enum: ['attendance', 'grades', 'behavior', 'fees', 'general'],
      default: 'general'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

// Index for efficient queries
messageSchema.index({ 'recipient.id': 1, createdAt: -1 })
messageSchema.index({ 'sender.id': 1, createdAt: -1 })
messageSchema.index({ isRead: 1 })

module.exports = mongoose.model('Message', messageSchema)
