/**
 * Migration Script: Fix Empty Term Fields
 * 
 * This script removes empty string values from term and academicYear fields
 * in the grades collection, converting them to undefined (unset in MongoDB).
 * 
 * Usage: node scripts/fix-empty-terms.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Grade } = require('../models/grades');

async function fixEmptyTerms() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find grades with empty string term or academicYear
    const gradesWithEmptyTerms = await Grade.find({
      $or: [
        { term: '' },
        { academicYear: '' }
      ]
    });

    console.log(`Found ${gradesWithEmptyTerms.length} grades with empty term/academicYear fields`);

    if (gradesWithEmptyTerms.length === 0) {
      console.log('No grades to fix. Exiting...');
      await mongoose.connection.close();
      return;
    }

    // Update each grade to unset empty strings
    let fixedCount = 0;
    for (const grade of gradesWithEmptyTerms) {
      const updateFields = {};
      
      if (grade.term === '') {
        updateFields.term = 1; // Will be used with $unset
      }
      
      if (grade.academicYear === '') {
        updateFields.academicYear = 1;
      }

      await Grade.updateOne(
        { _id: grade._id },
        { $unset: updateFields }
      );
      
      fixedCount++;
      
      if (fixedCount % 100 === 0) {
        console.log(`Fixed ${fixedCount}/${gradesWithEmptyTerms.length} grades...`);
      }
    }

    console.log(`✅ Successfully fixed ${fixedCount} grades`);
    console.log('Empty term/academicYear fields have been removed from the database');

    await mongoose.connection.close();
    console.log('Migration complete. Database connection closed.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

// Run the migration
fixEmptyTerms();
