/**
 * Issue/Support Ticket Model
 * Manages issue tracking and support system
 */
const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  category: { 
    type: String, 
    enum: [
      'technical',      // IT/System issues
      'academic',       // Academic-related issues
      'administrative', // Admin/paperwork issues
      'facility',       // Building/facility issues
      'financial',      // Fee/payment issues
      'discipline',     // Student discipline
      'other'           // Other issues
    ], 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['open', 'in-progress', 'resolved', 'closed', 'on-hold'], 
    default: 'open' 
  },
  reportedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Student', 'Staff', 'Classroom', 'Subject', 'Fee', null]
    },
    id: mongoose.Schema.Types.ObjectId
  },
  resolution: { 
    type: String,
    trim: true
  },
  resolvedAt: { 
    type: Date 
  },
  resolvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  closedAt: {
    type: Date
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: [{
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    text: { 
      type: String, 
      required: true,
      trim: true
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  dueDate: {
    type: Date
  },
  estimatedTime: {
    type: Number, // in hours
    min: 0
  },
  actualTime: {
    type: Number, // in hours
    min: 0
  }
}, { 
  timestamps: true 
});

// Indexes for performance
issueSchema.index({ status: 1, priority: 1 });
issueSchema.index({ reportedBy: 1, status: 1 });
issueSchema.index({ assignedTo: 1, status: 1 });
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ createdAt: -1 });

// Virtual for checking if issue is overdue
issueSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return this.dueDate < new Date() && this.status !== 'resolved' && this.status !== 'closed';
});

// Virtual for time to resolution (in days)
issueSchema.virtual('resolutionTime').get(function() {
  if (!this.resolvedAt) return null;
  const diffMs = this.resolvedAt - this.createdAt;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to add a comment
issueSchema.methods.addComment = function(userId, text) {
  this.comments.push({
    author: userId,
    text: text,
    createdAt: new Date()
  });
  return this.save();
};

// Method to assign to user
issueSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  if (this.status === 'open') {
    this.status = 'in-progress';
  }
  return this.save();
};

// Method to resolve issue
issueSchema.methods.resolve = function(userId, resolution) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  this.resolution = resolution;
  return this.save();
};

// Method to close issue
issueSchema.methods.close = function(userId) {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedBy = userId;
  return this.save();
};

// Static method to get statistics
issueSchema.statics.getStatistics = async function(filters = {}) {
  const stats = await this.aggregate([
    { $match: filters },
    {
      $facet: {
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        byCategory: [
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ],
        byPriority: [
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ],
        avgResolutionTime: [
          { $match: { resolvedAt: { $exists: true } } },
          {
            $project: {
              resolutionTime: {
                $divide: [
                  { $subtract: ['$resolvedAt', '$createdAt'] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              avgDays: { $avg: '$resolutionTime' }
            }
          }
        ]
      }
    }
  ]);
  
  return stats[0];
};

const Issue = mongoose.model('Issue', issueSchema);

module.exports = { Issue };
