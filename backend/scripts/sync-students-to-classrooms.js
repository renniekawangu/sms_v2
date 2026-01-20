/**
 * Migration script to sync students to classrooms
 * This script updates the Student model with classroomId based on the Classroom.students array
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

// Import models properly
const { Student } = require('../src/models/student');
const { Classroom } = require('../src/models/classroom');

async function syncStudentsToClassrooms() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sms');
    console.log('Connected to MongoDB');

    // Get all classrooms
    const classrooms = await Classroom.find({}).lean();
    console.log(`Found ${classrooms.length} classrooms`);

    let totalUpdated = 0;

    // For each classroom, update all students in its array
    for (const classroom of classrooms) {
      if (!classroom.students || classroom.students.length === 0) {
        console.log(`Classroom ${classroom.grade}-${classroom.section} has no students`);
        continue;
      }

      console.log(`Processing Classroom ${classroom.grade}-${classroom.section} with ${classroom.students.length} students`);

      // Update all students in this classroom
      const result = await Student.updateMany(
        { _id: { $in: classroom.students } },
        { classroomId: classroom._id }
      );

      console.log(`  Updated ${result.modifiedCount} students for this classroom`);
      totalUpdated += result.modifiedCount;
    }

    // Also clear classroomId for students not in any classroom
    const studentsInClassrooms = await Student.find({ classroomId: { $ne: null } }).select('_id').lean();
    const studentsNotInClassrooms = await Student.find({ classroomId: null }).select('_id').lean();
    
    console.log(`\nTotal students with classrooms: ${studentsInClassrooms.length}`);
    console.log(`Total students without classrooms: ${studentsNotInClassrooms.length}`);

    console.log(`\n✅ Sync completed! Updated ${totalUpdated} student records.`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  }
}

// Run the script
syncStudentsToClassrooms();
