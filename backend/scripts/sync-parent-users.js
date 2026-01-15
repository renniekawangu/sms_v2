#!/usr/bin/env node
/**
 * Sync parent users to Parent records
 * Run this to create Parent records for any parent users that don't have them yet
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { User } = require('../src/models/user');
const { Parent } = require('../src/models/parent');

async function syncParentUsers() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms';
    console.log(`Connecting to MongoDB...`);
    
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB\n');

    // Find all parent users
    const parentUsers = await User.find({ role: 'parent' });
    console.log(`Found ${parentUsers.length} parent user(s):\n`);
    
    let createdCount = 0;
    let skippedCount = 0;

    for (const user of parentUsers) {
      console.log(`  Checking: ${user.name} (${user.email})`);
      
      // Check if Parent record exists
      const existingParent = await Parent.findOne({ email: user.email.toLowerCase() });
      if (existingParent) {
        console.log(`    ✓ Parent record already exists\n`);
        skippedCount++;
      } else {
        console.log(`    ✗ Creating Parent record...`);
        const [firstName, ...rest] = String(user.name || '').trim().split(' ');
        const lastName = rest.join(' ') || 'Parent';
        
        const parent = new Parent({
          firstName: firstName || 'Parent',
          lastName,
          email: user.email.toLowerCase(),
          phone: user.phone || '',
          relationship: 'Guardian'
        });
        await parent.save();
        console.log(`    ✓ Parent record created\n`);
        createdCount++;
      }
    }

    console.log(`Summary:`);
    console.log(`  Created: ${createdCount}`);
    console.log(`  Already existed: ${skippedCount}`);
    
    // Show all parents now
    const allParents = await Parent.find({}).lean();
    console.log(`\nTotal parents in database: ${allParents.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Sync complete!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

syncParentUsers();
