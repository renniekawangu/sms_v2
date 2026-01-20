#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in environment');
  process.exit(1);
}

async function fixIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('attendances');

    // List all indexes
    const indexes = await collection.listIndexes().toArray();
    console.log('\nCurrent indexes:');
    indexes.forEach((idx, i) => {
      console.log(`${i}: ${JSON.stringify(idx)}`);
    });

    // Drop the old compound index if it exists
    try {
      await collection.dropIndex('studentId_1_date_1_subject_1');
      console.log('\n✓ Dropped old unique index: studentId_1_date_1_subject_1');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('\nOld index studentId_1_date_1_subject_1 not found');
      } else {
        console.error('Error dropping index:', err.message);
      }
    }

    // Drop the legacy user_id index if it exists
    try {
      await collection.dropIndex('user_id_1_date_1');
      console.log('✓ Dropped legacy index: user_id_1_date_1');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('Legacy index user_id_1_date_1 not found');
      } else {
        console.error('Error dropping legacy index:', err.message);
      }
    }

    // Ensure the new index exists
    await collection.createIndex(
      { studentId: 1, date: 1 },
      { unique: true, sparse: false }
    );
    console.log('✓ Created new unique index: studentId_1_date_1');

    // List updated indexes
    const updatedIndexes = await collection.listIndexes().toArray();
    console.log('\nUpdated indexes:');
    updatedIndexes.forEach((idx, i) => {
      console.log(`${i}: ${JSON.stringify(idx)}`);
    });

    console.log('\nIndex fix completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixIndexes();
