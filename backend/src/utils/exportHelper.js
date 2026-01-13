/**
 * Export helper module - handles export operations in various formats
 */
const ExcelJS = require('exceljs');
const { Student } = require('../models/student');
const { Grade } = require('../models/grades');
const { Fee } = require('../models/fees');

/**
 * Export students to CSV or Excel
 */
async function exportStudents(format = 'csv') {
  const students = await Student.find();

  if (format === 'csv') {
    return generateStudentsCSV(students);
  } else if (format === 'excel') {
    return generateStudentsExcel(students);
  }

  throw new Error('Invalid format. Use "csv" or "excel"');
}

/**
 * Export grades to CSV or Excel
 */
async function exportGrades(format = 'csv') {
  const grades = await Grade.find().populate('studentId');

  if (format === 'csv') {
    return generateGradesCSV(grades);
  } else if (format === 'excel') {
    return generateGradesExcel(grades);
  }

  throw new Error('Invalid format. Use "csv" or "excel"');
}

/**
 * Export fees to CSV or Excel
 */
async function exportFees(format = 'csv') {
  const fees = await Fee.find().populate('studentId');

  if (format === 'csv') {
    return generateFeesCSV(fees);
  } else if (format === 'excel') {
    return generateFeesExcel(fees);
  }

  throw new Error('Invalid format. Use "csv" or "excel"');
}

// Helper functions for CSV generation
function generateStudentsCSV(students) {
  const headers = ['Student ID', 'Name', 'Email'];
  const rows = students.map(s => [s.studentId, s.name, s.email]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateGradesCSV(grades) {
  const headers = ['Student', 'Subject', 'Grade'];
  const rows = grades.map(g => [
    g.studentId?.name || 'Unknown',
    g.subject,
    g.grade
  ]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateFeesCSV(fees) {
  const headers = ['Student', 'Amount', 'Status'];
  const rows = fees.map(f => [
    f.studentId?.name || 'Unknown',
    f.amount,
    f.status
  ]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Helper functions for Excel generation
async function generateStudentsExcel(students) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students');

  worksheet.columns = [
    { header: 'Student ID', key: 'studentId', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 25 }
  ];

  students.forEach(student => {
    worksheet.addRow({
      studentId: student.studentId,
      name: student.name,
      email: student.email
    });
  });

  return workbook;
}

async function generateGradesExcel(grades) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Grades');

  worksheet.columns = [
    { header: 'Student', key: 'student', width: 25 },
    { header: 'Subject', key: 'subject', width: 20 },
    { header: 'Grade', key: 'grade', width: 10 }
  ];

  grades.forEach(grade => {
    worksheet.addRow({
      student: grade.studentId?.name || 'Unknown',
      subject: grade.subject,
      grade: grade.grade
    });
  });

  return workbook;
}

async function generateFeesExcel(fees) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Fees');

  worksheet.columns = [
    { header: 'Student', key: 'student', width: 25 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  fees.forEach(fee => {
    worksheet.addRow({
      student: fee.studentId?.name || 'Unknown',
      amount: fee.amount,
      status: fee.status
    });
  });

  return workbook;
}

module.exports = {
  exportStudents,
  exportGrades,
  exportFees
};
