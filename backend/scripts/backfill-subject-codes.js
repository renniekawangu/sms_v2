/**
 * Migration Script: Backfill subject codes
 * Generates unique codes for all existing subjects based on name and level
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Subject } = require('../models/subjects');

async function backfillSubjectCodes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const subjects = await Subject.find({ code: { $exists: false } }).lean();
    
    if (subjects.length === 0) {
      console.log('✓ All subjects already have codes. No backfill needed.');
      await mongoose.disconnect();
      return;
    }

    console.log(`\nFound ${subjects.length} subjects without codes. Generating codes...`);

    let updated = 0;
    let errors = 0;

    for (const subject of subjects) {
      try {
        const nameAbbr = subject.name.substring(0, 3).toUpperCase();
        const levelNum = subject.classLevel ? subject.classLevel.replace(/\D/g, '') : '0';
        let baseCode = `${nameAbbr}${levelNum}`;
        let code = baseCode;
        let counter = 1;

        // Check for uniqueness within the level
        while (await Subject.findOne({ code: code, classLevel: subject.classLevel, _id: { $ne: subject._id } })) {
          code = `${baseCode}-${counter}`;
          counter++;
        }

        await Subject.findByIdAndUpdate(subject._id, { code });
        console.log(`✓ ${subject.name} (${subject.classLevel || 'N/A'}) → ${code}`);
        updated++;
      } catch (err) {
        console.error(`✗ Error updating ${subject.name}:`, err.message);
        errors++;
      }
    }

    console.log(`\nBackfill complete!`);
    console.log(`✓ Updated: ${updated}`);
    console.log(`✗ Errors: ${errors}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  }
}

backfillSubjectCodes();
