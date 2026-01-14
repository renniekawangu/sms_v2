#!/usr/bin/env node
/**
 * Cleanup old/invalid data from database
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function cleanupData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Fix Students with null email
    console.log('\n=== Cleaning Students ===');
    const studentsWithNullEmail = await db.collection('students').countDocuments({ email: null });
    console.log(`Found ${studentsWithNullEmail} students with null email`);
    
    if (studentsWithNullEmail > 0) {
      // Generate placeholder emails for students with null email
      const nullEmailStudents = await db.collection('students').find({ email: null }).toArray();
      
      for (const student of nullEmailStudents) {
        const placeholderEmail = `student_${student._id}@placeholder.local`;
        await db.collection('students').updateOne(
          { _id: student._id },
          { $set: { email: placeholderEmail } }
        );
        console.log(`✓ Updated student ${student._id} with email: ${placeholderEmail}`);
      }
    }

    // Check for students with duplicate emails
    const duplicateEmails = await db.collection('students').aggregate([
      { $match: { email: { $ne: null } } },
      { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicateEmails.length > 0) {
      console.log(`\nFound ${duplicateEmails.length} duplicate emails:`);
      for (const dup of duplicateEmails) {
        console.log(`  - ${dup._id}: ${dup.count} students`);
        // Keep first, update others
        for (let i = 1; i < dup.ids.length; i++) {
          const newEmail = `${dup._id.split('@')[0]}_${i}@${dup._id.split('@')[1]}`;
          await db.collection('students').updateOne(
            { _id: dup.ids[i] },
            { $set: { email: newEmail } }
          );
          console.log(`    ✓ Updated ${dup.ids[i]} to ${newEmail}`);
        }
      }
    }

    // Fix Classrooms with null classroom_id (if field exists)
    console.log('\n=== Cleaning Classrooms ===');
    const classroomsWithNullId = await db.collection('classrooms').countDocuments({ classroom_id: null });
    console.log(`Found ${classroomsWithNullId} classrooms with null classroom_id`);
    
    if (classroomsWithNullId > 0) {
      await db.collection('classrooms').updateMany(
        { classroom_id: null },
        { $unset: { classroom_id: '' } }
      );
      console.log(`✓ Removed classroom_id field from ${classroomsWithNullId} classrooms`);
    }

    // Remove any documents with studentId: null
    console.log('\n=== Checking Student IDs ===');
    const studentsWithNullStudentId = await db.collection('students').countDocuments({ studentId: null });
    console.log(`Found ${studentsWithNullStudentId} students with null studentId`);
    
    if (studentsWithNullStudentId > 0) {
      await db.collection('students').updateMany(
        { studentId: null },
        { $unset: { studentId: '' } }
      );
      console.log(`✓ Removed studentId field from ${studentsWithNullStudentId} students`);
    }

    // Summary
    console.log('\n✓ Database cleanup completed successfully');
    console.log('\nSummary:');
    console.log(`  - Fixed ${studentsWithNullEmail} students with null email`);
    console.log(`  - Fixed ${duplicateEmails.length} duplicate email groups`);
    console.log(`  - Cleaned ${classroomsWithNullId} classroom records`);
    console.log(`  - Cleaned ${studentsWithNullStudentId} student ID records`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error cleaning data:', error);
    process.exit(1);
  }
}

cleanupData();
