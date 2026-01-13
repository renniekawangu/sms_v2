/**
 * Database Indexes Script
 * Adds performance indexes to frequently queried fields
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Load all models first
require('../models/user');
require('../models/student');
require('../models/staff');
require('../models/grades');
require('../models/attendance');
require('../models/fees');
require('../models/subjects');
require('../models/audit-log');

const indexes = [
  // User indexes
  {
    model: 'User',
    indexes: [
      { email: 1 },
      { role: 1 },
      { email: 1, role: 1 }
    ]
  },
  // Student indexes
  {
    model: 'Student',
    indexes: [
      { studentId: 1, unique: true },
      { userId: 1 },
      { classLevel: 1 },
      { stream: 1 },
      { classLevel: 1, stream: 1 }
    ]
  },
  // Staff indexes
  {
    model: 'Staff',
    indexes: [
      { userId: 1 },
      { role: 1 },
      { email: 1 }
    ]
  },
  // Grade indexes
  {
    model: 'Grade',
    indexes: [
      { studentId: 1 },
      { teacherId: 1 },
      { subject: 1 },
      { studentId: 1, subject: 1 },
      { teacherId: 1, subject: 1 },
      { createdAt: -1 },
      { date: -1 },
      { teacherId: 1, createdAt: -1 }
    ]
  },
  // Attendance indexes
  {
    model: 'Attendance',
    indexes: [
      { studentId: 1 },
      { markedBy: 1 },
      { subject: 1 },
      { date: -1 },
      { studentId: 1, date: -1 },
      { markedBy: 1, date: -1 },
      { markedBy: 1, subject: 1 },
      { markedBy: 1, createdAt: -1 }
    ]
  },
  // Fee indexes
  {
    model: 'Fee',
    indexes: [
      { studentId: 1 },
      { status: 1 },
      { dueDate: 1 },
      { studentId: 1, status: 1 }
    ]
  },
  // Subject indexes
  {
    model: 'Subject',
    indexes: [
      { name: 1 },
      { code: 1 },
      { teacherId: 1 },
      { classLevel: 1 },
      { teacherId: 1, classLevel: 1 }
    ]
  },
  // Audit log indexes
  {
    model: 'AuditLog',
    indexes: [
      { actorId: 1 },
      { actorRole: 1 },
      { createdAt: -1 },
      { action: 1, createdAt: -1 },
      { actorRole: 1, createdAt: -1 }
    ]
  },
  // User indexes (additional)
  {
    model: 'User',
    indexes: [
      { teacherId: 1 },
      { createdAt: -1 }
    ]
  }
];

async function addIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const { model, indexes: modelIndexes } of indexes) {
      const Model = mongoose.model(model);
      if (!Model) {
        console.log(`Model ${model} not found, skipping...`);
        continue;
      }

      console.log(`\nAdding indexes to ${model}...`);
      for (const index of modelIndexes) {
        try {
          await Model.collection.createIndex(index);
          console.log(`  ✓ Created index:`, index);
        } catch (err) {
          if (err.code === 85) {
            console.log(`  ⚠ Index already exists:`, index);
          } else {
            console.error(`  ✗ Error creating index:`, index, err.message);
          }
        }
      }
    }

    console.log('\n✓ Index creation complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addIndexes();
