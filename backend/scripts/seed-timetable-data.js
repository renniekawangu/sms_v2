/**
 * Seed Timetable Data Script
 * Creates sample data following the prototype structure
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Classroom } = require('../src/models/classroom');
const { Staff } = require('../src/models/staff');
const { Subject } = require('../src/models/subjects');
const { TimetableSchedule, Instructor, Course } = require('../src/models/timetable-container');
const { User } = require('../src/models/user');

async function seedTimetableData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Get admin user for createdBy field
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('⚠ No admin user found. Creating default admin...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = new User({
        email: 'admin@school.com',
        password: hashedPassword,
        role: 'admin',
        name: 'System Admin'
      });
      await newAdmin.save();
      admin = newAdmin;
    }

    // Clear existing timetable data
    console.log('\nClearing existing timetable data...');
    await TimetableSchedule.deleteMany({});
    await Instructor.deleteMany({});
    await Course.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create or update classrooms with new structure
    console.log('\nUpdating classrooms...');
    const classroomData = [
      { name: 'Grade 1A', grade: 1, section: 'A', capacity: 30 },
      { name: 'Grade 2A', grade: 2, section: 'A', capacity: 30 },
      { name: 'Grade 3A', grade: 3, section: 'A', capacity: 30 },
      { name: 'Grade 4A', grade: 4, section: 'A', capacity: 30 },
      { name: 'Grade 5A', grade: 5, section: 'A', capacity: 30 },
      { name: 'Grade 6A', grade: 6, section: 'A', capacity: 30 },
      { name: 'Grade 7A', grade: 7, section: 'A', capacity: 30 },
    ];

    const classrooms = [];
    for (const data of classroomData) {
      let classroom = await Classroom.findOne({ grade: data.grade, section: data.section });
      if (!classroom) {
        classroom = new Classroom({ ...data, createdBy: admin._id });
        await classroom.save();
      } else {
        // Update existing classroom with new fields
        classroom.name = data.name;
        classroom.capacity = data.capacity;
        if (!classroom.createdBy) classroom.createdBy = admin._id;
        await classroom.save();
      }
      classrooms.push(classroom);
      console.log(`  ✓ ${classroom.name}`);
    }

    // Create or find instructors (staff)
    console.log('\nCreating instructors...');
    const instructorData = [
      { firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@school.com', subjects: ['Mathematics', 'Science'] },
      { firstName: 'Bob', lastName: 'Smith', email: 'bob.smith@school.com', subjects: ['English'] },
      { firstName: 'Catherine', lastName: 'Lee', email: 'catherine.lee@school.com', subjects: ['Mathematics'] },
      { firstName: 'David', lastName: 'Brown', email: 'david.brown@school.com', subjects: ['Science'] },
      { firstName: 'Eva', lastName: 'Green', email: 'eva.green@school.com', subjects: ['English', 'Mathematics'] },
    ];

    const staffMembers = [];
    for (const data of instructorData) {
      let staff = await Staff.findOne({ email: data.email });
      if (!staff) {
        staff = new Staff({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: '+260 XXX XXX XXX',
          address: 'School Address',
          role: 'teacher',
          createdBy: admin._id
        });
        await staff.save();
      }
      
      // Create instructor profile
      let instructor = await Instructor.findOne({ staffId: staff._id });
      if (!instructor) {
        instructor = new Instructor({
          staffId: staff._id,
          subjects: data.subjects,
          maxHoursPerWeek: 40,
          createdBy: admin._id
        });
        await instructor.save();
      }
      
      staffMembers.push(staff);
      console.log(`  ✓ ${staff.firstName} ${staff.lastName} (${data.subjects.join(', ')})`);
    }

    // Create subjects for each classroom
    console.log('\nCreating subjects...');
    const subjectsByGrade = [
      { grade: 1, subjects: [
        { name: 'Mathematics', code: 'MATH101' },
        { name: 'English', code: 'ENG101' },
        { name: 'Science', code: 'SCI101' }
      ]},
      { grade: 2, subjects: [
        { name: 'Mathematics', code: 'MATH201' },
        { name: 'English', code: 'ENG201' },
        { name: 'Science', code: 'SCI201' }
      ]},
      { grade: 3, subjects: [
        { name: 'Mathematics', code: 'MATH301' },
        { name: 'English', code: 'ENG301' },
        { name: 'Science', code: 'SCI301' }
      ]},
      { grade: 4, subjects: [
        { name: 'Mathematics', code: 'MATH401' },
        { name: 'English', code: 'ENG401' },
        { name: 'Science', code: 'SCI401' }
      ]},
      { grade: 5, subjects: [
        { name: 'Mathematics', code: 'MATH501' },
        { name: 'English', code: 'ENG501' },
        { name: 'Science', code: 'SCI501' }
      ]},
      { grade: 6, subjects: [
        { name: 'Mathematics', code: 'MATH601' },
        { name: 'English', code: 'ENG601' },
        { name: 'Science', code: 'SCI601' }
      ]},
      { grade: 7, subjects: [
        { name: 'Mathematics', code: 'MATH701' },
        { name: 'English', code: 'ENG701' },
        { name: 'Science', code: 'SCI701' }
      ]},
    ];

    const subjectsByClassroom = {};
    for (const gradeData of subjectsByGrade) {
      const classLevel = `Grade ${gradeData.grade}`;
      const subjectsForGrade = [];
      
      for (const subData of gradeData.subjects) {
        let subject = await Subject.findOne({ code: subData.code, classLevel });
        if (!subject) {
          subject = new Subject({
            name: subData.name,
            code: subData.code,
            classLevel: classLevel,
            createdBy: admin._id
          });
          await subject.save();
        }
        subjectsForGrade.push(subject);
      }
      
      subjectsByClassroom[gradeData.grade] = subjectsForGrade;
      console.log(`  ✓ Grade ${gradeData.grade}: ${subjectsForGrade.length} subjects`);
    }

    // Create courses for each classroom
    console.log('\nCreating courses...');
    for (const classroom of classrooms) {
      const subjects = subjectsByClassroom[classroom.grade] || [];
      if (subjects.length === 0) continue;

      const course = new Course({
        classroomId: classroom._id,
        subjects: subjects.map(s => ({
          id: s._id,
          name: s.name,
          code: s.code,
          hoursPerWeek: 3
        })),
        academicYear: new Date().getFullYear().toString(),
        term: 'Term 1',
        createdBy: admin._id
      });
      await course.save();
      console.log(`  ✓ ${classroom.name}: ${subjects.length} subjects`);
    }

    // Create sample timetable schedules for first 3 classrooms
    console.log('\nCreating timetable schedules...');
    
    const sampleSchedules = [
      {
        classroom: classrooms[0], // Grade 1A
        timetable: [
          { day: 'Monday', periods: [
            { period: 1, subject: 'Mathematics', instructorId: staffMembers[0]._id, time: '09:00-10:00' },
            { period: 2, subject: 'English', instructorId: staffMembers[1]._id, time: '10:15-11:15' },
            { period: 3, subject: 'Science', instructorId: staffMembers[3]._id, time: '11:30-12:30' }
          ]},
          { day: 'Tuesday', periods: [
            { period: 1, subject: 'Science', instructorId: staffMembers[3]._id, time: '09:00-10:00' },
            { period: 2, subject: 'Mathematics', instructorId: staffMembers[0]._id, time: '10:15-11:15' },
            { period: 3, subject: 'English', instructorId: staffMembers[1]._id, time: '11:30-12:30' }
          ]},
          { day: 'Wednesday', periods: [
            { period: 1, subject: 'English', instructorId: staffMembers[1]._id, time: '09:00-10:00' },
            { period: 2, subject: 'Science', instructorId: staffMembers[3]._id, time: '10:15-11:15' },
            { period: 3, subject: 'Mathematics', instructorId: staffMembers[0]._id, time: '11:30-12:30' }
          ]},
          { day: 'Thursday', periods: [
            { period: 1, subject: 'Mathematics', instructorId: staffMembers[0]._id, time: '09:00-10:00' },
            { period: 2, subject: 'English', instructorId: staffMembers[1]._id, time: '10:15-11:15' },
            { period: 3, subject: 'Science', instructorId: staffMembers[3]._id, time: '11:30-12:30' }
          ]},
          { day: 'Friday', periods: [
            { period: 1, subject: 'Science', instructorId: staffMembers[3]._id, time: '09:00-10:00' },
            { period: 2, subject: 'Mathematics', instructorId: staffMembers[0]._id, time: '10:15-11:15' },
            { period: 3, subject: 'English', instructorId: staffMembers[1]._id, time: '11:30-12:30' }
          ]}
        ]
      },
      {
        classroom: classrooms[1], // Grade 2A
        timetable: [
          { day: 'Monday', periods: [
            { period: 1, subject: 'Mathematics', instructorId: staffMembers[2]._id, time: '09:00-10:00' },
            { period: 2, subject: 'English', instructorId: staffMembers[4]._id, time: '10:15-11:15' },
            { period: 3, subject: 'Science', instructorId: staffMembers[3]._id, time: '11:30-12:30' }
          ]},
          { day: 'Tuesday', periods: [
            { period: 1, subject: 'English', instructorId: staffMembers[4]._id, time: '09:00-10:00' },
            { period: 2, subject: 'Science', instructorId: staffMembers[3]._id, time: '10:15-11:15' },
            { period: 3, subject: 'Mathematics', instructorId: staffMembers[2]._id, time: '11:30-12:30' }
          ]},
          { day: 'Wednesday', periods: [
            { period: 1, subject: 'English', instructorId: staffMembers[4]._id, time: '09:00-10:00' },
            { period: 2, subject: 'Science', instructorId: staffMembers[3]._id, time: '10:15-11:15' },
            { period: 3, subject: 'Mathematics', instructorId: staffMembers[2]._id, time: '11:30-12:30' }
          ]},
          { day: 'Thursday', periods: [
            { period: 1, subject: 'Mathematics', instructorId: staffMembers[2]._id, time: '09:00-10:00' },
            { period: 2, subject: 'English', instructorId: staffMembers[4]._id, time: '10:15-11:15' },
            { period: 3, subject: 'Science', instructorId: staffMembers[3]._id, time: '11:30-12:30' }
          ]},
          { day: 'Friday', periods: [
            { period: 1, subject: 'Science', instructorId: staffMembers[3]._id, time: '09:00-10:00' },
            { period: 2, subject: 'Mathematics', instructorId: staffMembers[2]._id, time: '10:15-11:15' },
            { period: 3, subject: 'English', instructorId: staffMembers[4]._id, time: '11:30-12:30' }
          ]}
        ]
      },
      {
        classroom: classrooms[2], // Grade 3A
        timetable: [
          { day: 'Monday', periods: [
            { period: 1, subject: 'Mathematics', instructorId: staffMembers[2]._id, time: '09:00-10:00' },
            { period: 2, subject: 'English', instructorId: staffMembers[4]._id, time: '10:15-11:15' },
            { period: 3, subject: 'Science', instructorId: staffMembers[3]._id, time: '11:30-12:30' }
          ]},
          { day: 'Tuesday', periods: [
            { period: 1, subject: 'English', instructorId: staffMembers[4]._id, time: '09:00-10:00' },
            { period: 2, subject: 'Science', instructorId: staffMembers[3]._id, time: '10:15-11:15' },
            { period: 3, subject: 'Mathematics', instructorId: staffMembers[2]._id, time: '11:30-12:30' }
          ]},
          { day: 'Wednesday', periods: [
            { period: 1, subject: 'Science', instructorId: staffMembers[3]._id, time: '09:00-10:00' },
            { period: 2, subject: 'Mathematics', instructorId: staffMembers[2]._id, time: '10:15-11:15' },
            { period: 3, subject: 'English', instructorId: staffMembers[4]._id, time: '11:30-12:30' }
          ]},
          { day: 'Thursday', periods: [
            { period: 1, subject: 'Mathematics', instructorId: staffMembers[2]._id, time: '09:00-10:00' },
            { period: 2, subject: 'English', instructorId: staffMembers[4]._id, time: '10:15-11:15' },
            { period: 3, subject: 'Science', instructorId: staffMembers[3]._id, time: '11:30-12:30' }
          ]},
          { day: 'Friday', periods: [
            { period: 1, subject: 'Science', instructorId: staffMembers[3]._id, time: '09:00-10:00' },
            { period: 2, subject: 'Mathematics', instructorId: staffMembers[2]._id, time: '10:15-11:15' },
            { period: 3, subject: 'English', instructorId: staffMembers[4]._id, time: '11:30-12:30' }
          ]}
        ]
      }
    ];

    for (const scheduleData of sampleSchedules) {
      const schedule = new TimetableSchedule({
        classroomId: scheduleData.classroom._id,
        timetable: scheduleData.timetable,
        academicYear: new Date().getFullYear().toString(),
        term: 'Term 1',
        isActive: true,
        createdBy: admin._id
      });
      await schedule.save();
      console.log(`  ✓ ${scheduleData.classroom.name}: ${scheduleData.timetable.length} days`);
    }

    console.log('\n✅ Timetable data seeded successfully!');
    console.log('\nSummary:');
    console.log(`  - Classrooms: ${classrooms.length}`);
    console.log(`  - Instructors: ${staffMembers.length}`);
    console.log(`  - Courses: ${classrooms.length}`);
    console.log(`  - Timetable Schedules: ${sampleSchedules.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding timetable data:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run the seeder
seedTimetableData()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Failed:', err);
    process.exit(1);
  });
