const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Teacher = mongoose.model('Teacher', teacherSchema);

async function getAllTeachers() {
  return await Teacher.find();
}

async function getTeacherById(id) {
  return await Teacher.findById(id);
}

async function getTeacherByEmail(email) {
  return await Teacher.findOne({ email });
}

async function createTeacher(teacherData) {
  const teacher = new Teacher(teacherData);
  return await teacher.save();
}

async function updateTeacher(id, updates) {
  const teacher = await Teacher.findById(id);
  if (!teacher) {
    throw new Error('Teacher not found');
  }
  Object.assign(teacher, updates);
  return await teacher.save();
}

async function deleteTeacher(id) {
  const teacher = await Teacher.findByIdAndDelete(id);
  if (!teacher) {
    throw new Error('Teacher not found');
  }
  return teacher;
}

module.exports = { Teacher, getAllTeachers, getTeacherById, getTeacherByEmail, createTeacher, updateTeacher, deleteTeacher };