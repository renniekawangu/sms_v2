#!/usr/bin/env node
/**
 * Fix database indexes - remove obsolete indexes
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Fix Students collection
    try {
      const studentIndexes = await db.collection('students').indexes();
      console.log('\nStudents indexes:', studentIndexes.map(i => i.name).join(', '));
      
      // Drop the old student_id_1 index if it exists
      const hasStudentIdIndex = studentIndexes.some(idx => idx.name === 'student_id_1');
      if (hasStudentIdIndex) {
        await db.collection('students').dropIndex('student_id_1');
        console.log('✓ Dropped obsolete student_id_1 index');
      }
    } catch (err) {
      console.log('Students index fix:', err.message);
    }

    // Fix Classrooms collection
    try {
      const classroomIndexes = await db.collection('classrooms').indexes();
      console.log('\nClassrooms indexes:', classroomIndexes.map(i => i.name).join(', '));
      
      // Drop the old classroom_id_1 index if it exists
      const hasClassroomIdIndex = classroomIndexes.some(idx => idx.name === 'classroom_id_1');
      if (hasClassroomIdIndex) {
        await db.collection('classrooms').dropIndex('classroom_id_1');
        console.log('✓ Dropped obsolete classroom_id_1 index');
      }
    } catch (err) {
      console.log('Classrooms index fix:', err.message);
    }

    // Fix Subjects collection
    try {
      const subjectIndexes = await db.collection('subjects').indexes();
      console.log('\nSubjects indexes:', subjectIndexes.map(i => i.name).join(', '));
      
      // Drop the old subject_id_1 index if it exists
      const hasSubjectIdIndex = subjectIndexes.some(idx => idx.name === 'subject_id_1');
      if (hasSubjectIdIndex) {
        await db.collection('subjects').dropIndex('subject_id_1');
        console.log('✓ Dropped obsolete subject_id_1 index');
      }
    } catch (err) {
      console.log('Subjects index fix:', err.message);
    }

    console.log('\n✓ Database indexes fixed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error fixing indexes:', error);
    process.exit(1);
  }
}

fixIndexes();
