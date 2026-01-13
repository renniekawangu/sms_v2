/**
 * Database Seeding Script
 * Creates sample teachers, students, and subjects for testing
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Add parent directory to require path
const models = path.join(__dirname, '../models');
const { User } = require(`${models}/user`);
const { Staff } = require(`${models}/staff`);
const { Student } = require(`${models}/student`);
const { Subject } = require(`${models}/subjects`);

const CLASS_LEVELS_TO_USE = [
  'Baby Class',
  'Nursery',
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7'
];

// Sample first and last names for variation
const FIRST_NAMES_TEACHER = ['Samuel', 'Grace', 'Victor', 'Margaret', 'David', 'Elizabeth', 'Peter', 'Susan', 'James', 'Catherine'];
const LAST_NAMES = ['Mwamba', 'Banda', 'Kapila', 'Chirwa', 'Phiri', 'Kasonda', 'Zulu', 'Kabala', 'Lungile', 'Simfukwe'];
const FIRST_NAMES_STUDENT = ['Michael', 'Sarah', 'John', 'Emily', 'Robert', 'Jessica', 'William', 'Sophie', 'Joseph', 'Lisa', 'Thomas', 'Rachel', 'Charles', 'Megan', 'Daniel'];
const STREAMS = ['North', 'South', 'East', 'Blue', 'Green'];

// Sample subject names
const SUBJECT_NAMES = [
  'Computer Science',
  'Visual Arts',
  'Physical Education',
  'Music',
  'Social Studies',
  'Environmental Science',
  'Agricultural Science',
  'Business Studies',
  'Geography',
  'Economics'
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get admin user (we'll use as createdBy)
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('✗ No admin user found. Please create an admin first.');
      try {
        await mongoose.disconnect();
      } catch (e) {
        // ignore
      }
      throw new Error('No admin user found. Please create an admin first.');
    }
    console.log(`✓ Using admin user: ${adminUser.email}\n`);

    // ==================== CREATE TEACHERS ====================
    console.log('📚 Creating 5 teachers...');
    const teacherCount = 5;
    const teacherIds = [];
    const timestamp = Date.now();

    for (let i = 0; i < teacherCount; i++) {
      const firstName = FIRST_NAMES_TEACHER[i];
      const lastName = LAST_NAMES[i];
      const email = `teacher${i + 1}_${timestamp}@sms.com`;
      const password = await bcrypt.hash('password123', 10);

      // Check if user already exists
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          password,
          role: 'teacher'
        });
      }

      // Check if staff already exists for this user
      let staff = await Staff.findOne({ userId: user._id });
      if (!staff) {
        staff = await Staff.create({
          userId: user._id,
          firstName,
          lastName,
          email,
          phone: `097${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
          address: `Address ${i + 1}, Lusaka`,
          role: 'teacher',
          createdBy: adminUser._id
        });

        user.teacherId = staff._id;
        await user.save();
      }

      teacherIds.push(staff._id);
      console.log(`  ✓ Created teacher: ${firstName} ${lastName} (${email})`);
    }
    console.log();

    // ==================== CREATE STUDENTS ====================
    console.log('👥 Creating 5 students per class level...');
    const studentIds = [];

    // Get the highest existing studentId to avoid duplicates
    const lastStudent = await Student.findOne().sort({ studentId: -1 });
    let nextStudentId = (lastStudent?.studentId || 24999999) + 1;

    for (const classLevel of CLASS_LEVELS_TO_USE) {
      for (let i = 0; i < 5; i++) {
        const firstName = FIRST_NAMES_STUDENT[Math.floor(Math.random() * FIRST_NAMES_STUDENT.length)];
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const stream = STREAMS[Math.floor(Math.random() * STREAMS.length)];
        const studentEmail = `student_${nextStudentId}@sms.com`;
        const password = await bcrypt.hash('password123', 10);

        // Create User account
        const user = await User.create({
          email: studentEmail,
          password,
          role: 'student'
        });

        // Create Student record with manual studentId to avoid counter issues
        const student = await Student.create({
          studentId: nextStudentId,
          userId: user._id,
          firstName,
          lastName,
          email: studentEmail,
          dateOfBirth: new Date(2010 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          address: `Address, Lusaka`,
          phone: `097${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
          classLevel,
          stream,
          createdBy: adminUser._id
        });

        user.studentId = student._id;
        await user.save();

        studentIds.push(student._id);
        console.log(`  ✓ Created student: ${firstName} ${lastName} - ${classLevel} (${stream}) [ID: ${nextStudentId}]`);
        nextStudentId++;
      }
    }
    console.log();

    // ==================== CREATE SUBJECTS ====================
    console.log('📖 Creating 5 new subjects...');
    const subjectsToCreate = SUBJECT_NAMES.slice(0, 5);
    
    for (const subjectName of subjectsToCreate) {
      const classLevel = CLASS_LEVELS_TO_USE[Math.floor(Math.random() * CLASS_LEVELS_TO_USE.length)];
      const teacherId = teacherIds[Math.floor(Math.random() * teacherIds.length)];
      const streamNum = Math.floor(Math.random() * 2);

      const subject = await Subject.create({
        name: subjectName,
        classLevel,
        stream: streamNum === 0 ? 'North' : 'South',
        teacherId,
        createdBy: adminUser._id,
        students: studentIds.slice(0, 10) // Assign first 10 students
      });

      console.log(`  ✓ Created subject: ${subject.name} (${classLevel})`);
    }
    console.log();

    // ==================== SUMMARY ====================
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Teachers created: ${teacherCount}`);
    console.log(`   • Students created: ${studentIds.length}`);
    console.log(`   • Subjects created: ${subjectsToCreate.length}`);
    console.log('\n🔑 Test Credentials:');
    console.log('   Teachers: teacher1@sms.com - teacher5@sms.com (password: password123)');
    console.log('   Students: student_<class>_<number>@sms.com (password: password123)');
    console.log('   Admin: admin@sms.com (password: your existing admin password)');

    await mongoose.disconnect();
    return;
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // ignore
    }
    throw err;
  }
}

// Run the seeding
seedDatabase();
