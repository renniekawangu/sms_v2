const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/routes/api.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the POST /classrooms endpoint - replace the finalStudents query
const oldCode = `  const finalStudents = validStudentIds.length > 0 ? await Student.find({ _id: { $in: validStudentIds } }).lean() : [];
  res.status(201).json(toClassroomDto(classroom.toObject(), teacherRef ? await Staff.findById(teacherRef).lean() : null, finalStudents));`;

const newCode = `  let finalStudents = [];
  if (validStudentIds.length > 0) {
    finalStudents = finalStudents.concat(await Student.find({ _id: { $in: validStudentIds } }).lean());
  }
  const numericStudentIds = students.filter(id => typeof id === 'number' || (typeof id === 'string' && !mongoose.isValidObjectId(id)));
  if (numericStudentIds.length > 0) {
    const numericValues = numericStudentIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(n => !isNaN(n));
    if (numericValues.length > 0) {
      const numericStudents = await Student.find({ studentId: { $in: numericValues } }).lean();
      finalStudents = finalStudents.concat(numericStudents);
    }
  }
  res.status(201).json(toClassroomDto(classroom.toObject(), teacherRef ? await Staff.findById(teacherRef).lean() : null, finalStudents));`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Fixed POST /classrooms endpoint');
} else {
  console.log('✗ Could not find code to replace');
}
