#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./src/models/user');
const { Parent } = require('./src/models/parent');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check parent users
    const parentUsers = await User.find({ role: 'parent' }).lean();
    console.log('Parent users in database:', parentUsers.length);
    parentUsers.forEach(u => {
      console.log(`  User: ${u.name} (${u.email})`);
    });
    
    console.log('');
    
    // Check parent records
    const parents = await Parent.find({}).lean();
    console.log('Parent records in database:', parents.length);
    
    // Find unmatched - parent users without Parent records
    console.log('');
    console.log('Checking for unmatched users:');
    let unmatched = 0;
    for (const user of parentUsers) {
      const parentRecord = await Parent.findOne({ email: user.email.toLowerCase() });
      if (!parentRecord) {
        console.log(`  ❌ ${user.name} (${user.email}) - NO Parent record`);
        unmatched++;
      }
    }
    
    if (unmatched === 0) {
      console.log('  ✅ All parent users have matching Parent records!');
    }
    
    await mongoose.disconnect();
  } catch(err) {
    console.error('Error:', err.message);
  }
})();
