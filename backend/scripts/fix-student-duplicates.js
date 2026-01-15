require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../src/models/student').Student;
const User = require('../src/models/user').User;

async function fixStudentDuplicates() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms';
    console.log(`Connecting to: ${mongoUri.replace(/\/\/.*:.*@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find students with null or duplicate emails
    const allStudents = await Student.find();
    console.log(`Total students: ${allStudents.length}`);

    // Remove students with null email
    const nullEmailResult = await Student.deleteMany({ email: { $in: [null, ''] } });
    console.log(`Deleted ${nullEmailResult.deletedCount} students with null/empty email`);

    // Find and remove duplicate emails, keeping only the first one
    const students = await Student.find().sort({ createdAt: 1 });
    const emailMap = new Map();
    const duplicates = [];

    for (const student of students) {
      if (student.email) {
        if (emailMap.has(student.email)) {
          duplicates.push(student._id);
        } else {
          emailMap.set(student.email, student._id);
        }
      }
    }

    if (duplicates.length > 0) {
      const deleteResult = await Student.deleteMany({ _id: { $in: duplicates } });
      console.log(`Deleted ${deleteResult.deletedCount} duplicate student records`);
    }

    // Also clean up orphaned User records that were created for students
    const studentsWithUserId = await Student.find({ userId: { $exists: true, $ne: null } });
    console.log(`Found ${studentsWithUserId.length} students with userId references`);
    // These can stay as they are linked

    console.log('✅ Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixStudentDuplicates();
