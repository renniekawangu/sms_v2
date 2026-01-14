const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  grade: { type: Number, required: true },
  section: { type: String, required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
});

classroomSchema.index({ grade: 1, section: 1 }, { unique: true });

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = { Classroom };
