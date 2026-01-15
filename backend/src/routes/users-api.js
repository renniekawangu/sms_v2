const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { User } = require('../models/user');
const { Parent } = require('../models/parent');

const router = express.Router();

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, __v, ...rest } = user;
  return rest;
};

const VALID_ROLES = Object.values(ROLES);

// GET /api/users - list users (admin only)
router.get('/', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (_req, res) => {
  const users = await User.find().lean();
  res.json(users.map(sanitizeUser));
}));

// GET /api/users/:id - get user by id
router.get('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  const user = await User.findById(id).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(sanitizeUser(user));
}));

// POST /api/users - create user
router.post('/', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { email, password, role, name, phone, date_of_join, ...rest } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existing) return res.status(400).json({ error: 'Email already in use' });

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ 
    email: email.toLowerCase().trim(), 
    password: hashed, 
    role,
    name,
    phone,
    date_of_join: date_of_join ? new Date(date_of_join) : undefined,
    ...rest 
  });
  await user.save();

  // If role is parent, create a corresponding Parent record
  if (role === ROLES.PARENT) {
    try {
      const [firstName, ...rest] = String(name || '').trim().split(' ');
      const lastName = rest.join(' ') || 'Parent';
      
      const parent = new Parent({
        firstName: firstName || 'Parent',
        lastName,
        email: email.toLowerCase().trim(),
        phone: phone || '',
        relationship: 'Guardian'
      });
      await parent.save();
      
      // Link the parent to the user
      user.parentId = parent._id;
      await user.save();
      console.log(`[PARENT] Created Parent record for ${email}`);
    } catch (error) {
      console.error(`[PARENT] Error creating Parent record for ${email}:`, error.message);
    }
  }

  res.status(201).json(sanitizeUser(user.toObject()));
}));

// PUT /api/users/:id - update user
router.put('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password, role, email, name, phone, date_of_join, ...rest } = req.body;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
    if (duplicate) return res.status(400).json({ error: 'Email already in use' });
    user.email = normalizedEmail;
  }
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (date_of_join) user.date_of_join = new Date(date_of_join);
  if (role) user.role = role;
  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }
  Object.assign(user, rest);
  await user.save();
  res.json(sanitizeUser(user.toObject()));
}));

// DELETE /api/users/:id - delete user
router.delete('/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  const deleted = await User.findByIdAndDelete(id).lean();
  if (!deleted) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User deleted' });
}));

module.exports = router;
