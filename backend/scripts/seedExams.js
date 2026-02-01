/**
 * Seed script to populate test exam and result data
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Exam } = require('../src/models/exam');
const { ExamResult } = require('../src/models/examResult');
const { Classroom } = require('../src/models/classroom');
const { Student } = require('../src/models/student');
const { User } = require('../src/models/user');

async function seedExams() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/sms';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found');
      process.exit(1);
    }

    const adminId = admin._id;

    // Get classrooms and students
    const classrooms = await Classroom.find().limit(2);
    if (classrooms.length === 0) {
      console.log('No classrooms found. Please create classrooms first.');
      process.exit(0);
    }

    const classroom = classrooms[0];
    console.log(`✓ Using classroom: ${classroom.name}`);

    // Get or create students
    let students = await Student.find({ classroom: classroom._id }).limit(5);
    
    if (students.length === 0) {
      console.log('No students found, creating test students...');
      const timestamp = Date.now();
      const testStudents = [];
      for (let i = 1; i <= 5; i++) {
        testStudents.push({
          firstName: `Test`,
          lastName: `Student ${i}`,
          name: `Test Student ${i}`,
          studentId: parseInt(`${timestamp}${i}`.slice(-4)),
          classroom: classroom._id,
          email: `teststudent${timestamp}${i}@school.com`,
          phone: '0123456789',
          address: 'Test Address',
          dateOfBirth: new Date('2010-01-01'),
          createdBy: adminId,
        });
      }
      students = await Student.create(testStudents);
      console.log(`✓ Created ${students.length} test students`);
    } else {
      console.log(`✓ Found ${students.length} existing students`);
    }

    // Clear existing exams and results
    await Exam.deleteMany({});
    await ExamResult.deleteMany({});
    console.log('✓ Cleared existing exams and results');

    // Create exams
    const exams = await Exam.create([
      {
        name: 'Mathematics Mid-Term',
        title: 'Mathematics Mid-Term',
        academicYear: '2025-2026',
        term: 'Term 1',
        subject: 'Mathematics',
        totalMarks: 100,
        passingMarks: 40,
        examDate: new Date('2026-02-15'),
        description: 'Mid-term exam for Mathematics',
        status: 'published',
        createdBy: adminId,
      },
      {
        name: 'English Mid-Term',
        title: 'English Mid-Term',
        academicYear: '2025-2026',
        term: 'Term 1',
        subject: 'English',
        totalMarks: 100,
        passingMarks: 40,
        examDate: new Date('2026-02-16'),
        description: 'Mid-term exam for English',
        status: 'published',
        createdBy: adminId,
      },
      {
        name: 'Science Final',
        title: 'Science Final',
        academicYear: '2025-2026',
        term: 'Term 1',
        subject: 'Science',
        totalMarks: 100,
        passingMarks: 40,
        examDate: new Date('2026-02-17'),
        description: 'Final exam for Science',
        status: 'draft',
        createdBy: adminId,
      },
    ]);

    console.log(`✓ Created ${exams.length} exams`);

    // Create exam results for first exam
    const mathExam = exams[0];
    const scores = [85, 92, 78, 88, 95];

    const results = await Promise.all(
      students.map((student, index) =>
        ExamResult.create({
          exam: mathExam._id,
          classroom: classroom._id,
          student: student._id,
          studentName: student.name,
          studentId: student.studentId,
          subject: 'Mathematics',
          score: scores[index],
          remarks: index % 2 === 0 ? 'Good performance' : 'Needs improvement',
          status: 'submitted',
          submittedBy: 'teacher',
          submittedAt: new Date(),
        })
      )
    );

    console.log(`✓ Created ${results.length} exam results`);

    // Create results for second exam (English) - draft status
    const englishExam = exams[1];
    const englishResults = await Promise.all(
      students.map((student, index) =>
        ExamResult.create({
          exam: englishExam._id,
          classroom: classroom._id,
          student: student._id,
          studentName: student.name,
          studentId: student.studentId,
          subject: 'English',
          score: scores[index] - 5,
          remarks: 'In progress',
          status: 'draft',
        })
      )
    );

    console.log(`✓ Created ${englishResults.length} English results in draft status`);

    console.log('\n=== SEED DATA CREATED SUCCESSFULLY ===\n');
    console.log('Test Exams:');
    exams.forEach((exam, i) => {
      console.log(`  ${i + 1}. ${exam.title} (${exam.status})`);
    });
    console.log('\nTest Results:');
    console.log(`  - ${results.length} Mathematics results (submitted - waiting for approval)`);
    console.log(`  - ${englishResults.length} English results (draft - ready to submit)`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding data:', error.message);
    process.exit(1);
  }
}

seedExams();
