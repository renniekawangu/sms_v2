/**
 * Database Configuration
 */
module.exports = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sms',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
};
