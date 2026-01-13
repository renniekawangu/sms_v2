// One-off migration to convert legacy attendance documents to the new shape.
// Usage: MONGO_URL="mongodb://localhost/sms" node scripts/migrate-attendance-shape.js

const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost/sms';

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, required: true, enum: ['present', 'absent', 'late', 'excused'] },
  date: { type: Date, required: true },
  subject: { type: String, required: true },
  notes: { type: String },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, strict: false });

const Attendance = mongoose.model('Attendance', attendanceSchema, 'attendances');

const toDateOnly = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

(async () => {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB at', MONGO_URL);

  let flattened = 0;
  let converted = 0;
  let duplicates = 0;

  // 1) Flatten documents that still use the old `attendance` array field
  const withAttendanceArray = await Attendance.find({ attendance: { $exists: true, $type: 'array', $ne: [] } });
  for (const doc of withAttendanceArray) {
    for (const item of doc.attendance) {
      try {
        const payload = {
          studentId: item.studentId,
          status: item.status,
          date: toDateOnly(doc.date || item.date || new Date()),
          subject: doc.subject || item.subject || 'Unknown',
          notes: doc.notes || item.notes,
          markedBy: doc.markedBy
        };

        await Attendance.findOneAndUpdate(
          { studentId: payload.studentId, date: payload.date, subject: payload.subject },
          { $set: payload },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        flattened += 1;
      } catch (err) {
        console.error('Flatten error', doc._id, err.message);
      }
    }
    await Attendance.deleteOne({ _id: doc._id });
  }

  // 2) Fix docs where studentId is stored as an array
  const withArrayId = await Attendance.find({ studentId: { $type: 'array' } });
  for (const doc of withArrayId) {
    const firstId = Array.isArray(doc.studentId) ? doc.studentId[0] : null;
    if (!firstId) continue;

    const payload = {
      studentId: firstId,
      status: doc.status,
      date: toDateOnly(doc.date),
      subject: doc.subject,
      notes: doc.notes,
      markedBy: doc.markedBy
    };

    try {
      await Attendance.findOneAndUpdate(
        { studentId: payload.studentId, date: payload.date, subject: payload.subject },
        { $set: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (String(doc._id) !== String(payload._id)) {
        await Attendance.deleteOne({ _id: doc._id });
      }
      converted += 1;
    } catch (err) {
      if (err.code === 11000) {
        duplicates += 1;
        await Attendance.deleteOne({ _id: doc._id });
      } else {
        console.error('Array studentId fix error', doc._id, err.message);
      }
    }
  }

  console.log({ flattened, converted, duplicates });
  await mongoose.disconnect();
  console.log('Migration complete');
})();
