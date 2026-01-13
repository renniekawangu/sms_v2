/**
 * Application Constants
 */
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your_secret_key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ROLES: {
    ADMIN: 'admin',
    STUDENT: 'student',
    TEACHER: 'teacher',
    HEAD_TEACHER: 'head-teacher',
    ACCOUNTS: 'accounts'
  }
};
