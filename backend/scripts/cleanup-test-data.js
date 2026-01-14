#!/usr/bin/env node
/**
 * Cleanup Test Data Script
 * Removes test users and students created during testing
 */

require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms';

console.log('🧹 Cleaning up test data...\n');

mongoose.connect(uri)
  .then(async () => {
    console.log('✓ Connected to MongoDB');
    
    // Define models
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      role: String,
      name: String
    }, { collection: 'users' }));
    
    const Student = mongoose.model('Student', new mongoose.Schema({
      email: String,
      firstName: String,
      lastName: String
    }, { collection: 'students' }));
    
    const Staff = mongoose.model('Staff', new mongoose.Schema({
      email: String,
      firstName: String,
      lastName: String
    }, { collection: 'staff' }));
    
    // Cleanup test users
    console.log('\n📧 Checking for test users...');
    const testUserPatterns = [
      /@example\.com$/,
      /test\.crud/,
      /test\.student\.crud/,
      /crud\.test/
    ];
    
    let totalUsersDeleted = 0;
    for (const pattern of testUserPatterns) {
      const users = await User.find({ email: pattern }).select('email role');
      if (users.length > 0) {
        console.log(`  Found ${users.length} users matching ${pattern}:`);
        users.slice(0, 5).forEach(u => console.log(`    - ${u.email} (${u.role})`));
        if (users.length > 5) console.log(`    ... and ${users.length - 5} more`);
        
        const result = await User.deleteMany({ email: pattern });
        totalUsersDeleted += result.deletedCount;
      }
    }
    
    if (totalUsersDeleted > 0) {
      console.log(`  ✓ Deleted ${totalUsersDeleted} test users`);
    } else {
      console.log('  ✓ No test users found');
    }
    
    // Cleanup test students
    console.log('\n👨‍🎓 Checking for test students...');
    const testStudentPatterns = [
      /@example\.com$/,
      /test\.crud/,
      /test\.student\.crud/
    ];
    
    let totalStudentsDeleted = 0;
    for (const pattern of testStudentPatterns) {
      const students = await Student.find({ email: pattern }).select('email firstName lastName');
      if (students.length > 0) {
        console.log(`  Found ${students.length} students matching ${pattern}:`);
        students.slice(0, 5).forEach(s => console.log(`    - ${s.firstName} ${s.lastName} (${s.email})`));
        if (students.length > 5) console.log(`    ... and ${students.length - 5} more`);
        
        const result = await Student.deleteMany({ email: pattern });
        totalStudentsDeleted += result.deletedCount;
      }
    }
    
    if (totalStudentsDeleted > 0) {
      console.log(`  ✓ Deleted ${totalStudentsDeleted} test students`);
    } else {
      console.log('  ✓ No test students found');
    }
    
    // Cleanup test staff
    console.log('\n👨‍🏫 Checking for test staff...');
    const testStaff = await Staff.find({ email: /@example\.com$|test\.crud|crud\.test/ }).select('email firstName lastName');
    if (testStaff.length > 0) {
      console.log(`  Found ${testStaff.length} test staff members:`);
      testStaff.slice(0, 5).forEach(s => console.log(`    - ${s.firstName} ${s.lastName} (${s.email})`));
      
      const result = await Staff.deleteMany({ email: /@example\.com$|test\.crud|crud\.test/ });
      console.log(`  ✓ Deleted ${result.deletedCount} test staff`);
    } else {
      console.log('  ✓ No test staff found');
    }
    
    console.log('\n✅ Cleanup complete!');
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  });
