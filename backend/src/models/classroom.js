const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  classroomId: { type: Number, unique: true },
  grade: { type: Number, required: true },
  section: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

classroomSchema.index({ grade: 1, section: 1 }, { unique: true });

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = { Classroom };
