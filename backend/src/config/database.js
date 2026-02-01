/**
 * Database Configuration
 */
module.exports = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sms',
  options: {
    // useNewUrlParser and useUnifiedTopology are deprecated in MongoDB driver 4.0.0+
    // These options have no effect and will be removed in next major version
  }
};
