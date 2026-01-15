const mongoose = require('mongoose');

const CLASS_LEVELS = [
  'Baby Class',
  'Nursery',
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7'
];

const studentSchema = new mongoose.Schema({
  studentId: { type: Number, unique: true }, // Custom sequential ID starting from 25000000
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to User account (optional)
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, sparse: true }, // Unique email for students
  dateOfBirth: { type: Date, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  enrollmentDate: { type: Date, default: Date.now },
  role: { type: String, default: 'student' },
  classLevel: { type: String, enum: CLASS_LEVELS, default: 'Grade 1' },
  stream: { type: String },
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }], // Link to Parent documents
  gender: { type: String, enum: ['Male', 'Female'], required: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Virtual field for full name
studentSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included when converting to JSON
studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

const Student = mongoose.model('Student', studentSchema);

async function getAllStudents(filters = {}) {
  return await Student.find(filters);
}

async function getStudentById(id) {
  return await Student.findById(id).maxTimeMS(2000).lean();
}

async function createStudent(studentData) {
  // Atomic sequential studentId starting from 25000000
  const { getNextSequence } = require('./counter');
  const seq = await getNextSequence('studentId', 25000);
  const student = new Student({
    ...studentData,
    studentId: seq
  });
  return await student.save();
}

async function updateStudent(id, updates) {
  const student = await Student.findById(id);
  if (!student) {
    throw new Error('Student not found');
  }
  // Don't allow updating createdBy
  const allowedUpdates = { ...updates };
  delete allowedUpdates.createdBy;
  Object.assign(student, allowedUpdates);
  return await student.save();
}

async function deleteStudent(id) {
  const student = await Student.findByIdAndDelete(id);
  if (!student) {
    throw new Error('Student not found');
  }
  return student;
}

module.exports = { Student, CLASS_LEVELS, getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent };