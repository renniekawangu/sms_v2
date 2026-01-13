const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  subject: { type: String, required: true },
  classLevel: { type: String },
  term: { type: String }, // e.g., "Term 1", "Term 2", "Term 3"
  academicYear: { type: String }, // e.g., "2024", "2024-2025"
  
  // Exam grades
  midTermGrade: { type: Number, min: 0, max: 100 }, // Mid-term exam grade
  endTermGrade: { type: Number, min: 0, max: 100 }, // End-of-term exam grade
  finalGrade: { type: Number, min: 0, max: 100 }, // Calculated final grade
  
  // Legacy grade field (for backward compatibility)
  grade: { type: Number, min: 0, max: 100 },
  
  comments: { type: String },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Auto-calculate final grade before saving (using promise-based approach)
gradeSchema.pre('save', async function() {
  // If both mid-term and end-term grades exist, calculate final grade (average)
  if (this.midTermGrade !== undefined && this.midTermGrade !== null && 
      this.endTermGrade !== undefined && this.endTermGrade !== null) {
    this.finalGrade = Math.round((this.midTermGrade + this.endTermGrade) / 2);
  }
  // If only one exam exists, use it as final grade
  else if (this.midTermGrade !== undefined && this.midTermGrade !== null) {
    this.finalGrade = this.midTermGrade;
  }
  else if (this.endTermGrade !== undefined && this.endTermGrade !== null) {
    this.finalGrade = this.endTermGrade;
  }
  // For backward compatibility with legacy grade field
  else if (this.grade !== undefined && this.grade !== null) {
    this.finalGrade = this.grade;
  }
});

// Indexes for performance
gradeSchema.index({ studentId: 1, subject: 1 });
gradeSchema.index({ classLevel: 1 });
gradeSchema.index({ date: -1 });

const Grade = mongoose.model('Grade', gradeSchema);

async function getAllGrades() {
  return await Grade.find();
}

async function getGradesByStudent(studentId) {
  return await Grade.find({ studentId }).maxTimeMS(3000).lean();
}

async function addGrade(studentId, subject, grade, createdBy, additionalData = {}) {
  // Validate grades
  if (grade !== undefined && grade !== null && (grade < 0 || grade > 100)) {
    throw new Error('Grade must be between 0 and 100');
  }
  if (additionalData.midTermGrade !== undefined && additionalData.midTermGrade !== null && 
      (additionalData.midTermGrade < 0 || additionalData.midTermGrade > 100)) {
    throw new Error('Mid-term grade must be between 0 and 100');
  }
  if (additionalData.endTermGrade !== undefined && additionalData.endTermGrade !== null && 
      (additionalData.endTermGrade < 0 || additionalData.endTermGrade > 100)) {
    throw new Error('End-term grade must be between 0 and 100');
  }
  
  // Auto-fill classLevel from student if not provided
  if (!additionalData.classLevel) {
    const { Student } = require('./student');
    const student = await Student.findById(studentId);
    additionalData.classLevel = student?.classLevel;
  }
  
  // Check if grade already exists for this student, subject, and term
  const query = { studentId, subject };
  if (additionalData.term) {
    query.term = additionalData.term;
  }
  const existingGrade = await Grade.findOne(query);
  
  if (existingGrade) {
    // Update existing grade
    if (grade !== undefined && grade !== null) existingGrade.grade = grade;
    if (additionalData.midTermGrade !== undefined && additionalData.midTermGrade !== null) existingGrade.midTermGrade = additionalData.midTermGrade;
    if (additionalData.endTermGrade !== undefined && additionalData.endTermGrade !== null) existingGrade.endTermGrade = additionalData.endTermGrade;
    existingGrade.createdBy = createdBy;
    if (additionalData.comments) existingGrade.comments = additionalData.comments;
    if (additionalData.teacherId) existingGrade.teacherId = additionalData.teacherId;
    if (additionalData.classLevel) existingGrade.classLevel = additionalData.classLevel;
    if (additionalData.term !== undefined && additionalData.term !== null) existingGrade.term = additionalData.term;
    if (additionalData.academicYear !== undefined && additionalData.academicYear !== null) existingGrade.academicYear = additionalData.academicYear;
    existingGrade.date = new Date();
    return await existingGrade.save();
  } else {
    // Create new grade
    const newGrade = new Grade({ 
      studentId, 
      subject, 
      ...(grade !== undefined && grade !== null && { grade }),
      ...(additionalData.midTermGrade !== undefined && additionalData.midTermGrade !== null && { midTermGrade: additionalData.midTermGrade }),
      ...(additionalData.endTermGrade !== undefined && additionalData.endTermGrade !== null && { endTermGrade: additionalData.endTermGrade }),
      createdBy,
      comments: additionalData.comments,
      teacherId: additionalData.teacherId,
      classLevel: additionalData.classLevel,
      ...(additionalData.term !== undefined && additionalData.term !== null && { term: additionalData.term }),
      ...(additionalData.academicYear !== undefined && additionalData.academicYear !== null && { academicYear: additionalData.academicYear }),
      date: new Date()
    });
    return await newGrade.save();
  }
}

async function updateGrade(id, updates) {
  const grade = await Grade.findById(id);
  if (!grade) {
    throw new Error('Grade not found');
  }
  if (updates.grade !== undefined && (updates.grade < 0 || updates.grade > 100)) {
    throw new Error('Grade must be between 0 and 100');
  }
  Object.assign(grade, updates);
  return await grade.save();
}

async function deleteGrade(id) {
  const grade = await Grade.findByIdAndDelete(id);
  if (!grade) {
    throw new Error('Grade not found');
  }
  return grade;
}

module.exports = { Grade, getAllGrades, getGradesByStudent, addGrade, updateGrade, deleteGrade };