// Rebuild subject indexes to support per-class uniqueness
// Usage: MONGO_URL="mongodb+srv://..." node scripts/reindex-subjects.js

const mongoose = require('mongoose');

const uri = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost/sms';

(async () => {
  await mongoose.connect(uri);
  console.log('Connected to', uri);

  const col = mongoose.connection.db.collection('subjects');

  try {
    await col.dropIndexes();
    console.log('Dropped existing indexes');
  } catch (err) {
    if (err.codeName !== 'IndexNotFound') {
      throw err;
    }
    console.log('No indexes to drop');
  }

  await col.createIndex({ classLevel: 1 });
  await col.createIndex({ name: 1, classLevel: 1 }, { unique: true });

  console.log('Current indexes:', await col.indexes());
  await mongoose.disconnect();
  console.log('Done');
})();
