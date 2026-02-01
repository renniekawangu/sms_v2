/**
 * School Management System - Main Server
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const compression = require('compression');
const { securityHeaders, sanitizeInput } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { authRateLimiter } = require('./middleware/rateLimiter');
const formatters = require('./utils/formatters');
const accessLogger = require('./middleware/accessLog');

console.log('[SERVER] Starting SMS backend server...');
console.log('[SERVER] NODE_ENV:', process.env.NODE_ENV);
console.log('[SERVER] Port:', process.env.PORT);
console.log('[SERVER] Connecting to MongoDB...');

// Database Connection with proper timeout and retry options
const mongoOptions = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  retryReads: true,
};

// Start MongoDB connection in background (non-blocking)
mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(async () => {
    console.log('[DB] ✓ Connected to MongoDB');
    logger.info('✓ Connected to MongoDB');
    try {
      const { initializeDefaultRoles } = require('./models/role');
      await initializeDefaultRoles();
    } catch (err) {
      logger.error('Error initializing roles:', err.message);
    }
  })
  .catch(err => {
    console.error('[DB] ✗ MongoDB connection error:', err.message);
    logger.error('✗ MongoDB connection error: %s', err.message);
  });

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

// Express Setup
const app = express();
app.set('trust proxy', 1);

// Middleware
// Compression (gzip)
app.use(compression());

// CORS Configuration for frontend React app
const cors = require('cors');
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

// JSON body parser for API requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use(securityHeaders);

// Input sanitization
app.use(sanitizeInput);

// Structured access logging
app.use(accessLogger);

// Static file serving for uploads (with proper Content-Type headers)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  setHeaders: (res, filePath, stat) => {
    // Set appropriate Content-Type for different file types
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=' + path.basename(filePath));
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));

// API Route Imports
console.log('[SERVER] About to load API routes...');
const authApiRoutes = require('./routes/auth-api');
console.log('[SERVER] auth-api loaded, loading main api...');
const apiRoutes = require('./routes/api');
console.log('[SERVER] apiRoutes loaded successfully');
const adminApiRoutes = require('./routes/admin-api');
const teacherApiRoutes = require('./routes/teacher-api');
const studentApiRoutes = require('./routes/student-api');
const accountsApiRoutes = require('./routes/accounts-api');
const headTeacherApiRoutes = require('./routes/head-teacher-api');
const settingsApiRoutes = require('./routes/settings-api');
const parentsApiRoutes = require('./routes/parents-api');
const rolesApiRoutes = require('./routes/roles-api');
const usersApiRoutes = require('./routes/users-api');
const homeworkApiRoutes = require('./routes/homework-api');

// API Routes for Frontend SPA
app.use('/api/auth', authApiRoutes);
app.use('/api', apiRoutes);
app.use('/api/admin', adminApiRoutes);
app.use('/api/teacher', teacherApiRoutes);
app.use('/api/student', studentApiRoutes);
app.use('/api/accounts', accountsApiRoutes);
app.use('/api/head-teacher', headTeacherApiRoutes);
app.use('/api/settings', settingsApiRoutes);
app.use('/api/parents', parentsApiRoutes);
app.use('/api/admin/roles', rolesApiRoutes);
app.use('/api/roles', rolesApiRoutes);
app.use('/api/users', usersApiRoutes);
app.use('/api/homework', homeworkApiRoutes);

// Health check for uptime/monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Root Route - API info
app.get('/', (req, res) => {
  res.json({
    name: 'School Management System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      api: '/api',
      health: '/health'
    }
  });
});

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception: %s', err.stack || err.message);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection: %s', (reason && reason.stack) || reason);
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});