const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  teacherId: { type: Number, unique: true, sparse: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  role: { type: String, required: true },
  classroomIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Virtual field for full name
staffSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included when converting to JSON
staffSchema.set('toJSON', { virtuals: true });
staffSchema.set('toObject', { virtuals: true });

const Staff = mongoose.model('Staff', staffSchema);

async function getAllStaff() {
  return await Staff.find();
}

async function getStaffById(id) {
  return await Staff.findById(id);
}

async function getStaffByEmail(email) {
  return await Staff.findOne({ email });
}

async function getStaffByRole(role) {
  return await Staff.find({ role });
}

async function createStaff(staffData) {
  const staff = new Staff(staffData);
  return await staff.save();
}

async function updateStaff(id, updates) {
  const staff = await Staff.findById(id);
  if (!staff) {
    throw new Error('Staff member not found');
  }
  Object.assign(staff, updates);
  return await staff.save();
}

async function deleteStaff(id) {
  const staff = await Staff.findByIdAndDelete(id);
  if (!staff) {
    throw new Error('Staff member not found');
  }
  return staff;
}

module.exports = { Staff, getAllStaff, getStaffById, getStaffByEmail, getStaffByRole, createStaff, updateStaff, deleteStaff };