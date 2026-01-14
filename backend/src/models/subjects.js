const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, sparse: true }, // Subject code unique per level
  classLevel: { type: String },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Who assigned the teacher
}, { timestamps: true });

subjectSchema.index({ classLevel: 1 });
subjectSchema.index({ name: 1, classLevel: 1 }, { unique: true });
subjectSchema.index({ code: 1, classLevel: 1 }, { unique: true });

// Virtual for teacher name
subjectSchema.virtual('teacherName').get(function() {
  return this.populate ? this.teacherId?.name : undefined;
});

// Virtual for student count
subjectSchema.virtual('studentCount').get(function() {
  return (this.students || []).length;
});

// Ensure virtuals are included in JSON/Object serialization
subjectSchema.set('toJSON', { virtuals: true });
subjectSchema.set('toObject', { virtuals: true });

// Pre-save middleware to generate code if not provided
subjectSchema.pre('save', async function(next) {
  if (!this.code) {
    // Generate code: 3-letter abbreviation of name + level number
    const nameAbbr = this.name.substring(0, 3).toUpperCase();
    const levelNum = this.classLevel ? this.classLevel.replace(/\D/g, '') : '0';
    let baseCode = `${nameAbbr}${levelNum}`;
    let code = baseCode;
    let counter = 1;
    
    // Check for uniqueness within the level
    while (await mongoose.model('Subject').findOne({ code: code, classLevel: this.classLevel })) {
      code = `${baseCode}-${counter}`;
      counter++;
    }
    
    this.code = code;
  }
  next();
});

const Subject = mongoose.model('Subject', subjectSchema);

async function getAllSubjects() {
  return await Subject.find().populate('teacherId').populate('students');
}

async function getSubjectById(id) {
  return await Subject.findById(id).populate('teacherId').populate('students');
}

async function getSubjectByName(name) {
  return await Subject.findOne({ name }).populate('teacherId').populate('students');
}

async function createSubject(subjectData) {
  const subject = new Subject(subjectData);
  return await subject.save();
}

async function updateSubject(id, updates) {
  const subject = await Subject.findById(id);
  if (!subject) {
    throw new Error('Subject not found');
  }
  Object.assign(subject, updates);
  return await subject.save();
}

async function deleteSubject(id) {
  const subject = await Subject.findByIdAndDelete(id);
  if (!subject) {
    throw new Error('Subject not found');
  }
  return subject;
}

async function assignTeacherToSubject(subjectId, teacherId) {
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new Error('Subject not found');
  }
  subject.teacherId = teacherId;
  return await subject.save();
}

async function addStudentToSubject(subjectId, studentId) {
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new Error('Subject not found');
  }
  if (!subject.students.includes(studentId)) {
    subject.students.push(studentId);
  }
  return await subject.save();
}

async function removeStudentFromSubject(subjectId, studentId) {
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new Error('Subject not found');
  }
  subject.students = subject.students.filter(id => !id.equals(studentId));
  return await subject.save();
}

module.exports = { Subject, getAllSubjects, getSubjectById, getSubjectByName, createSubject, updateSubject, deleteSubject, assignTeacherToSubject, addStudentToSubject, removeStudentFromSubject };