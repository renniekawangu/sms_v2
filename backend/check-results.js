const mongoose = require('mongoose');
const { ExamResult } = require('./src/models/examResult');

mongoose.connect('mongodb://localhost:27017/sms').then(() => {
  ExamResult.find({}).sort({ createdAt: -1 }).limit(10).then(results => {
    console.log(`Found ${results.length} results:`);
    results.forEach(r => {
      console.log(`- ID: ${r._id}, Student: ${r.student}, Status: ${r.status}, Score: ${r.score}`);
    });
    process.exit(0);
  });
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
