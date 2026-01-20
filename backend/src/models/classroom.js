const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // e.g., "Grade 1A"
  grade: { type: Number, required: true },
  section: { type: String, required: true },
  capacity: { type: Number, default: 30 },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

classroomSchema.index({ grade: 1, section: 1 }, { unique: true });
classroomSchema.index({ name: 1 }, { unique: true });

// Virtual for student count
classroomSchema.virtual('studentCount').get(function() {
  return (this.students || []).length;
});

// Virtual for available slots
classroomSchema.virtual('availableSlots').get(function() {
  return this.capacity - (this.students || []).length;
});

// Ensure virtuals are included in JSON/Object serialization
classroomSchema.set('toJSON', { virtuals: true });
classroomSchema.set('toObject', { virtuals: true });

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = { Classroom };
