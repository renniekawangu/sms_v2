const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sms');
    console.log('Connected to MongoDB');

    const { Grade } = require('./src/models/grades');
    const User = require('./src/models/user');
    const Student = require('./src/models/student');

    // Get all users with parent role
    const parents = await User.find({ role: 'parent' }).limit(1);
    console.log('\n--- Parents in System ---');
    if (parents.length > 0) {
      const parent = parents[0];
      console.log(`Parent: ${parent.firstName} ${parent.lastName} (${parent.email})`);
      console.log(`User ID: ${parent._id}`);

      // Check if parent has parentId
      if (parent.parentId) {
        const Parent = require('./src/models/parent');
        const parentDoc = await Parent.findById(parent.parentId);
        console.log(`Parent Students: ${parentDoc?.students?.map(s => s.toString()).join(', ')}`);

        // Get grades for those students
        if (parentDoc?.students?.length > 0) {
          for (const studentId of parentDoc.students) {
            const grades = await Grade.find({ studentId }).lean();
            const student = await Student.findById(studentId);
            console.log(`\n  Student: ${student?.firstName} ${student?.lastName} (${studentId})`);
            console.log(`  Grades Count: ${grades.length}`);
            if (grades.length > 0) {
              grades.slice(0, 3).forEach(g => {
                console.log(`    - ${g.subject}: ${g.finalGrade || g.grade || g.endTermGrade || 'N/A'}`);
              });
            }
          }
        }
      }
    }

    // Show total grades in system
    const totalGrades = await Grade.countDocuments();
    console.log(`\nTotal Grades in System: ${totalGrades}`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

connectDB();
