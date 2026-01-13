// Backfill classLevel and stream for students; map legacy numeric level to primary classes
// Usage: MONGO_URL="mongodb+srv://..." node scripts/backfill-student-classlevel.js

const mongoose = require('mongoose');
const { Student } = require('../models/student');

const uri = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost/sms';

const parseClassLevel = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).trim();
  const num = parseInt(raw, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= 7) return `Grade ${num}`;
  const lower = raw.toLowerCase();
  if (lower.includes('baby')) return 'Baby Class';
  if (lower.includes('nursery')) return 'Nursery';
  if (lower.includes('pp1')) return 'PP1';
  if (lower.includes('pp2')) return 'PP2';
  if (lower.startsWith('grade')) return raw.replace(/\bgrade\b/i, 'Grade').trim();
  return raw;
};

(async () => {
  await mongoose.connect(uri);
  console.log('Connected to', uri);

  const students = await Student.find({ $or: [ { classLevel: { $exists: false } }, { classLevel: null }, { classLevel: '' } ] });
  let updated = 0;

  for (const s of students) {
    const mapped = parseClassLevel(s.level ?? s.classLevel);
    const classLevel = mapped || 'Grade 1';
    await Student.updateOne({ _id: s._id }, { $set: { classLevel }, $unset: { level: '' } });
    updated += 1;
  }

  console.log({ updated });
  await mongoose.disconnect();
  console.log('Done');
})();
