/**
 * Migration: Link existing parent users to Parent records
 * Matches parents by email address
 */
const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms';

mongoose.connect(mongoUrl);

const db = mongoose.connection;
db.on('error', (err) => {
  console.error('Connection error:', err);
  process.exit(1);
});

db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    const { User } = require('../src/models/user');
    const { Parent } = require('../src/models/parent');

    // Find all parent users without parentId
    const parentUsersWithoutId = await User.find({ 
      role: 'parent',
      $or: [
        { parentId: { $exists: false } },
        { parentId: null }
      ]
    }).maxTimeMS(5000);

    console.log(`Found ${parentUsersWithoutId.length} parent users without parentId`);

    let linked = 0;
    let notFound = 0;

    // Link each one by email
    for (const user of parentUsersWithoutId) {
      const parent = await Parent.findOne({ email: user.email }).maxTimeMS(3000);
      
      if (parent) {
        user.parentId = parent._id;
        await user.save();
        console.log(`✓ Linked ${user.email} to parent ${parent._id}`);
        linked++;
      } else {
        console.log(`✗ No parent found for ${user.email}`);
        notFound++;
      }
    }

    console.log(`\nMigration complete: ${linked} linked, ${notFound} not found`);
    setTimeout(() => {
      db.close();
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('Migration error:', error.message);
    db.close();
    process.exit(1);
  }
});
