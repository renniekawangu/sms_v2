/**
 * Seed script to add classrooms/subjects to exams and create sample exam results
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Exam } = require('../src/models/exam');
const { ExamResult } = require('../src/models/examResult');
const { Classroom } = require('../src/models/classroom');
const { Student } = require('../src/models/student');
const { Subject } = require('../src/models/subjects');
const { User } = require('../src/models/user');

async function seedExamResults() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Get admin user for creating records
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin user found');
      process.exit(1);
    }

    // Get classrooms
    const classrooms = await Classroom.find().limit(3);
    if (classrooms.length === 0) {
      console.log('❌ No classrooms found. Please create classrooms first.');
      process.exit(1);
    }
    console.log(`✓ Found ${classrooms.length} classrooms`);

    // Get subjects
    const subjects = await Subject.find().limit(5);
    if (subjects.length === 0) {
      console.log('❌ No subjects found. Please create subjects first.');
      process.exit(1);
    }
    console.log(`✓ Found ${subjects.length} subjects`);

    // Get or create students for each classroom
    const studentsByClassroom = {};
    for (const classroom of classrooms) {
      let students = await Student.find({ classroomId: classroom._id });
      if (students.length === 0) {
        console.log(`⚠️  No students in ${classroom.name}, creating test students...`);
        const testStudents = [];
        for (let i = 1; i <= 3; i++) {
          testStudents.push({
            firstName: `Test`,
            lastName: `Student ${i}`,
            name: `Test Student ${i}`,
            studentId: Math.floor(Math.random() * 100000),
            classroomId: classroom._id,
            email: `teststudent${classroom._id}${i}@school.com`,
            phone: '0123456789',
            address: 'Test Address',
            dateOfBirth: new Date('2010-01-01'),
            createdBy: admin._id
          });
        }
        students = await Student.create(testStudents);
        console.log(`  ✓ Created ${students.length} test students for ${classroom.name}`);
      }
      studentsByClassroom[classroom._id] = students;
    }

    // Get existing exams
    const exams = await Exam.find();
    if (exams.length === 0) {
      console.log('❌ No exams found');
      process.exit(1);
    }
    console.log(`✓ Found ${exams.length} exams to update`);

    // Update exams with classrooms and subjects
    let updatedCount = 0;
    for (const exam of exams) {
      const examSubjects = subjects.slice(0, 3);
      const examClassrooms = classrooms;

      const updated = await Exam.findByIdAndUpdate(
        exam._id,
        {
          classrooms: examClassrooms.map(c => c._id),
          subjects: examSubjects.map(s => s._id)
        },
        { new: true }
      );
      updatedCount++;
      console.log(`  ✓ Updated: ${exam.name} with ${examClassrooms.length} classrooms and ${examSubjects.length} subjects`);
    }

    // Create sample exam results
    console.log('\n📝 Creating sample exam results...');
    const examSubjects = subjects.slice(0, 3);
    let resultsCreated = 0;

    for (const exam of exams) {
      for (const classroom of classrooms) {
        const classroomStudents = studentsByClassroom[classroom._id] || [];
        
        for (const subject of examSubjects) {
          for (const student of classroomStudents) {
            // Generate random score between 0 and 100
            const score = Math.floor(Math.random() * 101);
            let grade = 'F';
            if (score >= 80) grade = 'A';
            else if (score >= 60) grade = 'B';
            else if (score >= 40) grade = 'C';
            else if (score >= 20) grade = 'D';

            const remarks = grade === 'A' ? 'Excellent' : grade === 'B' ? 'Good' : grade === 'C' ? 'Satisfactory' : 'Needs Improvement';

            const result = new ExamResult({
              exam: exam._id,
              student: student._id,
              classroom: classroom._id,
              subject: subject._id,
              score,
              maxMarks: 100,
              grade,
              remarks,
              submittedBy: admin._id,
              status: 'published',
              submittedAt: new Date(),
              approvedBy: admin._id,
              approvedAt: new Date(),
              publishedBy: admin._id,
              publishedAt: new Date()
            });

            await result.save();
            resultsCreated++;
          }
        }
      }
    }

    console.log(`✓ Created ${resultsCreated} sample exam results`);
    console.log('\n✅ Seeding completed successfully!');
    console.log('\nYou can now test the endpoint:');
    console.log(`GET /api/results/classroom/{classroomId}/exam/{examId}`);
    console.log('\nExample with first classroom and exam:');
    const firstClassroom = classrooms[0];
    const firstExam = exams[0];
    console.log(`GET /api/results/classroom/${firstClassroom._id}/exam/${firstExam._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedExamResults();
