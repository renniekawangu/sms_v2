/**
 * Auth API Routes for Frontend SPA
 * Provides JSON-based authentication endpoints
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/user');
const { Student } = require('../models/student');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * POST /api/auth/login
 * JSON-based login endpoint for frontend SPA
 */
router.post('/login', authRateLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    let user;
    const input = String(email).trim();

    // Check if input is a number (student ID)
    if (/^\d+$/.test(input)) {
      const sid = parseInt(input, 10);
      const student = await Student.findOne({ studentId: sid });
      
      if (student && student.userId) {
        user = await User.findById(student.userId);
      }
    } else {
      // Login with email (case-insensitive)
      user = await User.findOne({ email: input.toLowerCase() }).select('+password');
      if (!user) {
        user = await User.findOne({ email: input }).collation({ locale: 'en', strength: 2 }).select('+password');
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);

    // Get user details
    let userDetails = {
      user_id: user._id,
      email: user.email,
      role: user.role,
      name: user.name || user.email.split('@')[0],
      phone: user.phone,
      date_of_join: user.date_of_join
    };

    // Enhance user details with profile information
    if (user.role === 'student') {
      const student = await Student.findOne({ userId: user._id });
      if (student) {
        if (!user.name) userDetails.name = `${student.firstName} ${student.lastName}`;
        userDetails.student_id = student._id;
      }
    } else if (user.role === 'teacher' || user.role === 'staff') {
      const { Staff } = require('../models/staff');
      const staff = await Staff.findOne({ userId: user._id });
      if (staff) {
        if (!user.name) userDetails.name = `${staff.firstName} ${staff.lastName}`;
        userDetails.staff_id = staff._id;
      }
    }

    res.json({
      token,
      user_id: userDetails.user_id,
      email: userDetails.email,
      role: userDetails.role,
      name: userDetails.name,
      phone: userDetails.phone,
      date_of_join: userDetails.date_of_join
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
}));

/**
 * POST /api/auth/logout
 * Logout endpoint (mainly for cleanup on client side)
 */
router.post('/logout', asyncHandler(async (req, res) => {
  res.json({ message: 'Logged out successfully' });
}));

/**
 * GET /api/auth/me
 * Get current user info from token
 */
router.get('/me', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let userDetails = {
      user_id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      date_of_join: user.date_of_join
    };

    if (user.role === 'student' && !user.name) {
      const student = await Student.findOne({ userId: user._id });
      if (student) {
        userDetails.name = `${student.firstName} ${student.lastName}`;
      }
    }

    res.json(userDetails);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}));

module.exports = router;
