/**
 * Accounts API Routes for Frontend SPA
 * Provides JSON API endpoints for accounts/finance dashboard
 */
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { User } = require('../models/user');
const { Fee } = require('../models/fees');
const { Payment } = require('../models/payment');
const { Expense } = require('../models/expense');
const { getCurrentAcademicYear, getFeeStructure } = require('../models/school-settings');

const router = express.Router();

// ============= Accounts Dashboard =============
/**
 * GET /api/accounts/dashboard
 * Get accounts dashboard data
 */
router.get('/dashboard', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const currentYear = await getCurrentAcademicYear();

  // Get all fees
  const fees = await Fee.find().lean();

  // Calculate fee statistics
  const totalFees = fees.length;
  const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaidAmount = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const totalBalance = Math.max(0, totalAmount - totalPaidAmount);

  const paidFees = fees.filter(f => f.status === 'paid');
  const unpaidFees = fees.filter(f => f.status === 'unpaid');
  const pendingFees = fees.filter(f => f.status === 'pending');

  const totalPaid = paidFees.reduce((sum, f) => sum + (f.amountPaid || f.amount), 0);
  const totalUnpaid = unpaidFees.reduce((sum, f) => sum + Math.max(0, f.amount - (f.amountPaid || 0)), 0);
  const totalPending = pendingFees.reduce((sum, f) => sum + Math.max(0, f.amount - (f.amountPaid || 0)), 0);

  // Overdue fees
  const now = new Date();
  const overdueFees = unpaidFees.filter(f => f.dueDate && new Date(f.dueDate) < now);
  const totalOverdue = overdueFees.reduce((sum, f) => sum + Math.max(0, f.amount - (f.amountPaid || 0)), 0);

  // Get payments
  const payments = await Payment.find().lean();
  const totalPayments = payments.length;

  // Get expenses
  const expenses = await Expense.find().lean();
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Fee breakdown by status
  const feesByStatus = await Fee.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }
    }
  ]);

  res.json({
    currentYear,
    stats: {
      totalFees,
      totalAmount,
      totalPaidAmount,
      totalBalance,
      totalPaid,
      totalUnpaid,
      totalPending,
      totalOverdue,
      overdueFeeCount: overdueFees.length,
      totalPayments,
      totalExpenseAmount,
      expenseCount: expenses.length
    },
    feesByStatus: Object.fromEntries(feesByStatus.map(f => [f._id || 'unknown', { count: f.count, amount: f.amount }])),
    recentPayments: payments.slice(0, 10),
    recentExpenses: expenses.slice(0, 10)
  });
}));

// ============= Fees Management =============
/**
 * GET /api/accounts/fees
 * Get all fees with filters
 */
router.get('/fees', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.status = status;

  const fees = await Fee.find(filter)
    .populate('studentId', 'firstName lastName studentId')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ dueDate: -1 })
    .lean();

  const total = await Fee.countDocuments(filter);

  res.json({
    fees,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * POST /api/accounts/fees
 * Create new fee
 */
router.post('/fees', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { studentId, amount, description, dueDate, type } = req.body;

  if (!studentId || !amount || !dueDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const fee = new Fee({
    studentId,
    amount,
    description,
    dueDate: new Date(dueDate),
    type,
    status: 'unpaid',
    createdBy: req.user.id
  });

  await fee.save();
  res.status(201).json({ message: 'Fee created', fee });
}));

/**
 * PUT /api/accounts/fees/:id
 * Update fee
 */
router.put('/fees/:id', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { amount, description, dueDate, status } = req.body;
  const fee = await Fee.findById(req.params.id);

  if (!fee) return res.status(404).json({ error: 'Fee not found' });

  if (amount !== undefined) fee.amount = amount;
  if (description !== undefined) fee.description = description;
  if (dueDate !== undefined) fee.dueDate = new Date(dueDate);
  if (status !== undefined) fee.status = status;

  await fee.save();
  res.json({ message: 'Fee updated', fee });
}));

/**
 * DELETE /api/accounts/fees/:id
 * Delete fee
 */
router.delete('/fees/:id', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const fee = await Fee.findByIdAndDelete(req.params.id);
  if (!fee) return res.status(404).json({ error: 'Fee not found' });
  res.json({ message: 'Fee deleted' });
}));

// ============= Payments Management =============
/**
 * GET /api/accounts/payments
 * Get all payments
 */
router.get('/payments', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const payments = await Payment.find()
    .populate('feeId')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ paymentDate: -1 })
    .lean();

  const total = await Payment.countDocuments();

  res.json({
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * POST /api/accounts/payments
 * Create new payment
 */
router.post('/payments', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { feeId, amount, method = 'cash', paymentDate } = req.body;

  if (!feeId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Update fee record
  const fee = await Fee.findById(feeId);
  if (!fee) return res.status(404).json({ error: 'Fee not found' });

  fee.amountPaid = (fee.amountPaid || 0) + amount;
  if (fee.amountPaid >= fee.amount) {
    fee.status = 'paid';
  } else if (fee.amountPaid > 0) {
    fee.status = 'pending';
  }
  await fee.save();

  // Create payment record
  const payment = new Payment({
    feeId,
    amountPaid: amount,
    method,
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    createdBy: req.user.id
  });

  await payment.save();
  res.status(201).json({ message: 'Payment recorded', payment });
}));

// ============= Expenses Management =============
/**
 * GET /api/accounts/expenses
 * Get all expenses
 */
router.get('/expenses', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (category) filter.category = category;

  const expenses = await Expense.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ date: -1 })
    .lean();

  const total = await Expense.countDocuments(filter);

  res.json({
    expenses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * POST /api/accounts/expenses
 * Create new expense
 */
router.post('/expenses', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { category, description = '', amount, date, status = 'recorded' } = req.body;

  if (!category || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const expense = new Expense({
    category,
    description,
    amount,
    date: date ? new Date(date) : new Date(),
    status,
    createdBy: req.user.id
  });

  await expense.save();
  res.status(201).json({ message: 'Expense created', expense });
}));

/**
 * PUT /api/accounts/expenses/:id
 * Update expense
 */
router.put('/expenses/:id', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { category, description, amount, date, status } = req.body;
  const expense = await Expense.findById(req.params.id);

  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  if (category !== undefined) expense.category = category;
  if (description !== undefined) expense.description = description;
  if (amount !== undefined) expense.amount = amount;
  if (date !== undefined) expense.date = new Date(date);
  if (status !== undefined) expense.status = status;

  await expense.save();
  res.json({ message: 'Expense updated', expense });
}));

/**
 * DELETE /api/accounts/expenses/:id
 * Delete expense
 */
router.delete('/expenses/:id', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json({ message: 'Expense deleted' });
}));

module.exports = router;
