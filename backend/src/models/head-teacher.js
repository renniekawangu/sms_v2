const mongoose = require('mongoose');

const headTeacherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to User account
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  role: { type: String, default: 'head-teacher' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Virtual field for full name
headTeacherSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included when converting to JSON
headTeacherSchema.set('toJSON', { virtuals: true });
headTeacherSchema.set('toObject', { virtuals: true });

const HeadTeacher = mongoose.model('HeadTeacher', headTeacherSchema);

async function getAllHeadTeachers() {
  return await HeadTeacher.find();
}

async function getHeadTeacherById(id) {
  return await HeadTeacher.findById(id);
}

async function getHeadTeacherByEmail(email) {
  return await HeadTeacher.findOne({ email });
}

async function createHeadTeacher(headTeacherData) {
  const headTeacher = new HeadTeacher(headTeacherData);
  return await headTeacher.save();
}

async function updateHeadTeacher(id, updates) {
  const headTeacher = await HeadTeacher.findById(id);
  if (!headTeacher) {
    throw new Error('Head teacher not found');
  }
  Object.assign(headTeacher, updates);
  return await headTeacher.save();
}

async function deleteHeadTeacher(id) {
  const headTeacher = await HeadTeacher.findByIdAndDelete(id);
  if (!headTeacher) {
    throw new Error('Head teacher not found');
  }
  return headTeacher;
}

module.exports = { HeadTeacher, getAllHeadTeachers, getHeadTeacherById, getHeadTeacherByEmail, createHeadTeacher, updateHeadTeacher, deleteHeadTeacher };