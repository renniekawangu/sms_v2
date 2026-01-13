/**
 * Search helper module - handles all search operations
 */
const { Student } = require('../models/student');
const { Grade } = require('../models/grades');
const { Fee } = require('../models/fees');

/**
 * Perform global search across students, grades, and fees
 */
async function globalSearch(query, limit = 20) {
  const results = {
    students: [],
    grades: [],
    fees: []
  };

  if (!query) return results;

  const searchRegex = { $regex: query, $options: 'i' };

  // Search students
  results.students = await Student.find({
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { studentId: searchRegex }
    ]
  }).limit(limit);

  // Search grades by subject
  results.grades = await Grade.find({ subject: searchRegex })
    .populate('studentId')
    .limit(limit);

  // Search fees by status
  results.fees = await Fee.find({ status: searchRegex })
    .populate('studentId')
    .limit(limit);

  return results;
}

/**
 * Filter grades by criteria
 */
async function filterGrades(filters = {}) {
  const query = {};

  if (filters.subject) query.subject = filters.subject;
  if (filters.minGrade) query.grade = { ...query.grade, $gte: parseInt(filters.minGrade) };
  if (filters.maxGrade) query.grade = { ...query.grade, $lte: parseInt(filters.maxGrade) };

  return await Grade.find(query)
    .populate('studentId')
    .limit(50);
}

/**
 * Filter fees by criteria
 */
async function filterFees(filters = {}) {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }

  return await Fee.find(query)
    .populate('studentId')
    .limit(50);
}

module.exports = {
  globalSearch,
  filterGrades,
  filterFees
};
