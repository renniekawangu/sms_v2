const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, required: true, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

async function getNextSequence(key, startAt = 1) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  if (doc.seq < startAt) {
    doc.seq = startAt;
    await doc.save();
  }
  return doc.seq;
}

module.exports = { Counter, getNextSequence };
