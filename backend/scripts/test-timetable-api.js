/**
 * Quick Test Script for Timetable API
 * Tests basic CRUD operations
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { TimetableSchedule, Instructor, Course } = require('../src/models/timetable-container');
const { Classroom } = require('../src/models/classroom');
const { Staff } = require('../src/models/staff');

async function testTimetableAPI() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected\n');

    // Test 1: Fetch all schedules
    console.log('TEST 1: Fetching all schedules...');
    const schedules = await TimetableSchedule.find()
      .populate('classroomId', 'name grade section')
      .limit(3);
    console.log(`✓ Found ${schedules.length} schedules`);
    if (schedules.length > 0) {
      console.log(`  Sample: ${schedules[0].classroomId?.name} - ${schedules[0].timetable.length} days`);
    }

    // Test 2: Fetch schedule for specific classroom
    console.log('\nTEST 2: Fetching schedule for Grade 1A...');
    const grade1A = await Classroom.findOne({ name: 'Grade 1A' });
    if (grade1A) {
      const schedule = await TimetableSchedule.findOne({ classroomId: grade1A._id })
        .populate('classroomId', 'name grade section')
        .populate('timetable.periods.instructorId', 'firstName lastName');
      
      if (schedule) {
        console.log(`✓ Found schedule for ${schedule.classroomId.name}`);
        console.log(`  Days: ${schedule.timetable.map(d => d.day).join(', ')}`);
        
        // Show Monday's schedule
        const monday = schedule.timetable.find(d => d.day === 'Monday');
        if (monday) {
          console.log(`\n  Monday Schedule:`);
          monday.periods.forEach(p => {
            console.log(`    Period ${p.period} (${p.time}): ${p.subject} - ${p.instructorId.firstName} ${p.instructorId.lastName}`);
          });
        }
      } else {
        console.log('⚠ No schedule found for Grade 1A');
      }
    }

    // Test 3: Fetch all instructors
    console.log('\nTEST 3: Fetching all instructors...');
    const instructors = await Instructor.find()
      .populate('staffId', 'firstName lastName email');
    console.log(`✓ Found ${instructors.length} instructors`);
    instructors.forEach(i => {
      console.log(`  - ${i.staffId.firstName} ${i.staffId.lastName}: ${i.subjects.join(', ')}`);
    });

    // Test 4: Fetch all courses
    console.log('\nTEST 4: Fetching all courses...');
    const courses = await Course.find()
      .populate('classroomId', 'name grade section')
      .limit(3);
    console.log(`✓ Found ${courses.length} courses`);
    if (courses.length > 0) {
      courses.forEach(c => {
        console.log(`  ${c.classroomId.name}: ${c.subjects.length} subjects`);
      });
    }

    // Test 5: Check schedule methods
    console.log('\nTEST 5: Testing schedule methods...');
    if (schedules.length > 0) {
      const testSchedule = schedules[0];
      
      // Test getDaySchedule
      const mondaySchedule = testSchedule.getDaySchedule('Monday');
      if (mondaySchedule) {
        console.log(`✓ getDaySchedule('Monday'): ${mondaySchedule.periods.length} periods`);
      }
      
      // Test getInstructorSchedule
      if (mondaySchedule && mondaySchedule.periods.length > 0) {
        const instructorId = mondaySchedule.periods[0].instructorId;
        const instructorSchedule = testSchedule.getInstructorSchedule(instructorId);
        console.log(`✓ getInstructorSchedule: ${instructorSchedule.length} periods for instructor`);
      }
      
      // Test hasConflict
      if (mondaySchedule && mondaySchedule.periods.length > 0) {
        const conflict = testSchedule.hasConflict('Monday', 1, mondaySchedule.periods[0].instructorId);
        console.log(`✓ hasConflict: ${conflict ? 'Conflict detected' : 'No conflict'}`);
      }
    }

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run tests
testTimetableAPI()
  .then(() => {
    console.log('\n🎉 Testing complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Testing failed:', err);
    process.exit(1);
  });
