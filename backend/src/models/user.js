/**
 * User Model
 * Handles user authentication and role-based access
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true,
    sparse: true,
    required: function() {
      return this.role !== 'student'; // students can log in with studentId only
    }
  },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'student', 'teacher', 'head-teacher', 'accounts', 'parent']
  },
  name: { type: String },
  phone: { type: String },
  date_of_join: { type: Date },
  profilePicture: { type: String, default: '/uploads/profiles/default.svg' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  headTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'HeadTeacher' },
  accountsId: { type: mongoose.Schema.Types.ObjectId, ref: 'Accounts' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

/**
 * Get all users
 */
async function getAllUsers() {
  return await User.find();
}

/**
 * Get user by ID
 */
async function getUserById(id) {
  return await User.findById(id).maxTimeMS(2000).lean();
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  return await User.findOne({ email }).maxTimeMS(2000).lean();
}

/**
 * Create new user
 */
async function createUser(userData) {
  const normalized = {
    ...userData
  };
  if (userData.email) {
    normalized.email = userData.email.toLowerCase().trim();
  }
  const user = new User(normalized);
  return await user.save();
}

/**
 * Update user
 */
async function updateUser(id, updates) {
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  const normalizedUpdates = { ...updates };
  if (updates.email) {
    normalizedUpdates.email = updates.email.toLowerCase().trim();
  }
  Object.assign(user, normalizedUpdates);
  return await user.save();
}

/**
 * Delete user
 */
async function deleteUser(id) {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

/**
 * Get users by role
 */
async function getUsersByRole(role) {
  return await User.find({ role });
}

module.exports = { User, getAllUsers, getUserById, getUserByEmail, createUser, updateUser, deleteUser, getUsersByRole };