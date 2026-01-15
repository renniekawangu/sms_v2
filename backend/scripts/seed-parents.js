#!/usr/bin/env node
/**
 * Seed test parents into the database
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { Parent } = require('../src/models/parent');

const testParents = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0101',
    alternativePhone: '555-0102',
    address: '123 Main St, Springfield',
    occupation: 'Software Engineer',
    nationalId: 'ID123456',
    relationship: 'Father'
  },
  {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '555-0103',
    alternativePhone: '555-0104',
    address: '123 Main St, Springfield',
    occupation: 'Doctor',
    nationalId: 'ID123457',
    relationship: 'Mother'
  },
  {
    firstName: 'Michael',
    lastName: 'Smith',
    email: 'michael.smith@example.com',
    phone: '555-0105',
    alternativePhone: '555-0106',
    address: '456 Oak Ave, Springfield',
    occupation: 'Teacher',
    nationalId: 'ID123458',
    relationship: 'Father'
  },
  {
    firstName: 'Sarah',
    lastName: 'Smith',
    email: 'sarah.smith@example.com',
    phone: '555-0107',
    alternativePhone: '555-0108',
    address: '456 Oak Ave, Springfield',
    occupation: 'Nurse',
    nationalId: 'ID123459',
    relationship: 'Mother'
  },
  {
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.johnson@example.com',
    phone: '555-0109',
    alternativePhone: '555-0110',
    address: '789 Pine Rd, Springfield',
    occupation: 'Business Manager',
    nationalId: 'ID123460',
    relationship: 'Guardian'
  },
  {
    firstName: 'Emily',
    lastName: 'Wilson',
    email: 'emily.wilson@example.com',
    phone: '555-0111',
    alternativePhone: '555-0112',
    address: '321 Elm St, Springfield',
    occupation: 'Accountant',
    nationalId: 'ID123461',
    relationship: 'Mother'
  }
];

async function seedParents() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms';
    console.log(`Connecting to MongoDB at ${mongoUrl}...`);
    
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Check if parents already exist
    const existingCount = await Parent.countDocuments();
    console.log(`Found ${existingCount} existing parents`);

    if (existingCount === 0) {
      console.log('Seeding test parents...');
      const created = await Parent.insertMany(testParents);
      console.log(`✅ Created ${created.length} test parents:`);
      created.forEach(p => {
        console.log(`   - ${p.firstName} ${p.lastName} (${p.email})`);
      });
    } else {
      console.log('Parents already exist, skipping seed');
      const parents = await Parent.find({}).limit(6).lean();
      console.log('\nExisting parents:');
      parents.forEach(p => {
        console.log(`   - ${p.firstName} ${p.lastName} (${p.email})`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error seeding parents:', error.message);
    process.exit(1);
  }
}

seedParents();
