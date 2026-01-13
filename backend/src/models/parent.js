const mongoose = require('mongoose');

// Parent Schema
const parentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  alternativePhone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  occupation: {
    type: String,
    trim: true
  },
  nationalId: {
    type: String,
    trim: true
  },
  relationship: {
    type: String,
    enum: ['Father', 'Mother', 'Guardian', 'Sibling', 'Other'],
    default: 'Guardian'
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  isPrimaryContact: {
    type: Boolean,
    default: false
  },
  emergencyContact: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual for full name
parentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
parentSchema.set('toJSON', { virtuals: true });
parentSchema.set('toObject', { virtuals: true });

const Parent = mongoose.model('Parent', parentSchema);

// CRUD Functions

/**
 * Get all parents with optional filters
 * @param {Object} filters - Optional filters (search, relationship, etc.)
 * @param {Number} page - Page number for pagination
 * @param {Number} limit - Items per page
 * @returns {Promise<Object>} - Parents and pagination info
 */
async function getAllParents(filters = {}, page = 1, limit = 50) {
  const query = {};

  // Search by name, email, or phone
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ];
  }

  // Filter by relationship
  if (filters.relationship) {
    query.relationship = filters.relationship;
  }

  const skip = (page - 1) * limit;
  const total = await Parent.countDocuments(query);
  const parents = await Parent.find(query)
    .populate('students', 'firstName lastName studentId classLevel')
    .sort({ lastName: 1, firstName: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    parents,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}

/**
 * Get a parent by ID
 * @param {String} parentId - Parent ID
 * @returns {Promise<Object>} - Parent document
 */
async function getParentById(parentId) {
  return await Parent.findById(parentId)
    .populate('students', 'firstName lastName studentId classLevel gender dateOfBirth')
    .lean();
}

/**
 * Get parents for a specific student
 * @param {String} studentId - Student ID
 * @returns {Promise<Array>} - Array of parent documents
 */
async function getParentsByStudent(studentId) {
  return await Parent.find({ students: studentId })
    .sort({ isPrimaryContact: -1, relationship: 1 })
    .lean();
}

/**
 * Create a new parent
 * @param {Object} parentData - Parent data
 * @returns {Promise<Object>} - Created parent document
 */
async function createParent(parentData) {
  const parent = new Parent(parentData);
  return await parent.save();
}

/**
 * Update a parent
 * @param {String} parentId - Parent ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated parent document
 */
async function updateParent(parentId, updateData) {
  return await Parent.findByIdAndUpdate(
    parentId,
    { $set: updateData },
    { new: true, runValidators: true }
  );
}

/**
 * Delete a parent
 * @param {String} parentId - Parent ID
 * @returns {Promise<Object>} - Deleted parent document
 */
async function deleteParent(parentId) {
  return await Parent.findByIdAndDelete(parentId);
}

/**
 * Link a parent to a student
 * @param {String} parentId - Parent ID
 * @param {String} studentId - Student ID
 * @returns {Promise<Object>} - Updated parent document
 */
async function linkParentToStudent(parentId, studentId) {
  return await Parent.findByIdAndUpdate(
    parentId,
    { $addToSet: { students: studentId } },
    { new: true }
  );
}

/**
 * Unlink a parent from a student
 * @param {String} parentId - Parent ID
 * @param {String} studentId - Student ID
 * @returns {Promise<Object>} - Updated parent document
 */
async function unlinkParentFromStudent(parentId, studentId) {
  return await Parent.findByIdAndUpdate(
    parentId,
    { $pull: { students: studentId } },
    { new: true }
  );
}

/**
 * Get parent statistics
 * @returns {Promise<Object>} - Statistics object
 */
async function getParentStats() {
  const total = await Parent.countDocuments();
  const byRelationship = await Parent.aggregate([
    { $group: { _id: '$relationship', count: { $sum: 1 } } }
  ]);
  const primaryContacts = await Parent.countDocuments({ isPrimaryContact: true });
  const emergencyContacts = await Parent.countDocuments({ emergencyContact: true });

  return {
    total,
    byRelationship: byRelationship.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    primaryContacts,
    emergencyContacts
  };
}

module.exports = {
  Parent,
  getAllParents,
  getParentById,
  getParentsByStudent,
  createParent,
  updateParent,
  deleteParent,
  linkParentToStudent,
  unlinkParentFromStudent,
  getParentStats
};
