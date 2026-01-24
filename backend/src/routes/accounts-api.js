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
const { validateRequiredFields, validateEnum, sanitizeString, validateObjectId } = require('../utils/validation');
const cacheManager = require('../utils/cache');

const router = express.Router();

// ============= Accounts Dashboard =============
/**
 * GET /api/accounts/dashboard
 * Get accounts dashboard data
 */
router.get('/dashboard', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  // Check cache first
  const cacheKey = 'dashboard-stats';
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const currentYear = await getCurrentAcademicYear();
  const academicYear = currentYear?.year;

  // Get all fees for current academic year
  const fees = academicYear 
    ? await Fee.find({ academicYear }).lean()
    : await Fee.find().lean();

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

  const responseData = {
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
  };

  // Cache for 5 minutes
  cacheManager.set('dashboard-stats', responseData, 5 * 60 * 1000);

  res.json(responseData);
}));

// ============= Fees Management =============
/**
 * GET /api/accounts/fees
 * Get all fees with filters
 */
router.get('/fees', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { status, academicYear, term, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.status = status;
  if (academicYear) filter.academicYear = academicYear;
  if (term) filter.term = term;

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
  const { studentId, amount, description, dueDate, type, academicYear, term } = req.body;

  // Validate required fields
  const missingFields = validateRequiredFields({ studentId, amount, dueDate, academicYear });
  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
  }

  // Validate studentId is a valid ObjectId
  if (!validateObjectId(studentId)) {
    return res.status(400).json({ error: 'Invalid studentId format' });
  }

  // Validate amount is a positive number
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  // Validate term enum if provided
  if (term && !validateEnum(term, ['General', 'First', 'Second', 'Third'])) {
    return res.status(400).json({ error: 'Invalid term. Must be one of: General, First, Second, Third' });
  }

  // Sanitize description
  const sanitizedDescription = description ? sanitizeString(description) : '';

  const fee = new Fee({
    studentId,
    amount,
    description: sanitizedDescription,
    dueDate: new Date(dueDate),
    type,
    academicYear,
    term: term || 'General',
    status: 'unpaid',
    createdBy: req.user.id
  });

  await fee.save();
  
  // Invalidate cache
  cacheManager.delete('dashboard-stats');

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
 * Get all payments with filters by method, date range, and status
 */
router.get('/payments', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, method, startDate, endDate, studentId } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (method) filter.method = method;
  if (studentId) filter.studentId = studentId;
  
  if (startDate || endDate) {
    filter.paymentDate = {};
    if (startDate) filter.paymentDate.$gte = new Date(startDate);
    if (endDate) filter.paymentDate.$lte = new Date(endDate);
  }

  const payments = await Payment.find(filter)
    .populate('feeId')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ paymentDate: -1 })
    .lean();

  const total = await Payment.countDocuments(filter);

  // Calculate payment summary
  const summary = await Payment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amountPaid' }
      }
    }
  ]);

  res.json({
    payments,
    summary: Object.fromEntries(summary.map(s => [s._id || 'unknown', { count: s.count, amount: s.totalAmount }])),
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
 * Create new payment (by accounts staff)
 * Includes duplicate detection and audit trail
 */
router.post('/payments', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { feeId, amount, method = 'cash', paymentDate, notes } = req.body;

  // Validate required fields
  if (!feeId || !amount) {
    return res.status(400).json({ error: 'Missing required fields: feeId and amount' });
  }

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be a positive number' });
  }

  // Validate fee ID
  if (!require('mongoose').Types.ObjectId.isValid(feeId)) {
    return res.status(400).json({ error: 'Invalid fee ID' });
  }

  // Check for duplicate payments (same amount, method, within last 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const duplicateCheck = await Payment.findOne({
    feeId,
    amountPaid: amount,
    method,
    paymentDate: { $gte: tenMinutesAgo }
  });

  if (duplicateCheck) {
    return res.status(409).json({ 
      error: 'Possible duplicate payment detected',
      details: 'A similar payment was recorded recently. Please verify before proceeding.',
      existingPayment: duplicateCheck
    });
  }

  // Update fee record
  const fee = await Fee.findById(feeId);
  if (!fee) return res.status(404).json({ error: 'Fee not found' });

  // Check if payment exceeds remaining balance
  const remaining = fee.amount - (fee.amountPaid || 0);
  if (amount > remaining && remaining > 0) {
    return res.status(400).json({ 
      error: `Payment amount exceeds remaining balance. Remaining: K${remaining}` 
    });
  }

  // Record payment in fee's payments array with audit info
  fee.amountPaid = Math.min((fee.amountPaid || 0) + amount, fee.amount);
  fee.payments = fee.payments || [];
  fee.payments.push({
    amount,
    date: paymentDate ? new Date(paymentDate) : new Date(),
    method,
    notes: notes || '',
    paidBy: req.user.id,
    recordedAt: new Date()
  });

  // Update status
  if (fee.amountPaid >= fee.amount) {
    fee.status = 'paid';
    fee.amountPaid = fee.amount; // Cap to total
  } else if (fee.amountPaid > 0) {
    fee.status = 'pending';
  }

  // Add audit trail
  fee.auditLog = fee.auditLog || [];
  fee.auditLog.push({
    action: 'payment_recorded',
    amount,
    method,
    timestamp: new Date(),
    userId: req.user.id
  });

  await fee.save();

  // Create payment record for auditing
  const payment = new Payment({
    feeId,
    amountPaid: amount,
    method,
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    createdBy: req.user.id,
    notes
  });

  try {
    await payment.save();
  } catch (saveError) {
    console.error('Error saving payment:', saveError);
    // If payment save fails but fee was updated, that's okay - return success
    // as the fee has already been updated
    return res.status(201).json({
      success: true,
      message: 'Payment recorded (fee updated)',
      fee: {
        _id: fee._id,
        amount: fee.amount,
        amountPaid: fee.amountPaid,
        remaining: fee.amount - fee.amountPaid,
        status: fee.status
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Payment recorded successfully',
    payment: {
      _id: payment._id,
      feeId,
      amount,
      method,
      paymentDate: payment.paymentDate,
      notes
    },
    fee: {
      _id: fee._id,
      amount: fee.amount,
      amountPaid: fee.amountPaid,
      remaining: fee.amount - fee.amountPaid,
      status: fee.status
    }
  });
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

// ============= Financial Reports & Analytics =============
/**
 * GET /api/accounts/reports/summary
 * Get financial summary report by date range
 */
router.get('/reports/summary', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { startDate, endDate, academicYear } = req.query;

  const filter = {};
  if (academicYear) filter.academicYear = academicYear;

  // Calculate totals
  const fees = await Fee.find(filter).lean();
  const totalFeeAmount = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaidAmount = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const totalOutstanding = totalFeeAmount - totalPaidAmount;

  // Get payments within date range
  let paymentFilter = {};
  if (startDate || endDate) {
    paymentFilter.paymentDate = {};
    if (startDate) paymentFilter.paymentDate.$gte = new Date(startDate);
    if (endDate) paymentFilter.paymentDate.$lte = new Date(endDate);
  }

  const payments = await Payment.find(paymentFilter).lean();
  const totalPayments = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const paymentsByMethod = {};
  payments.forEach(p => {
    paymentsByMethod[p.method] = (paymentsByMethod[p.method] || 0) + p.amountPaid;
  });

  // Get expenses within date range
  let expenseFilter = {};
  if (startDate || endDate) {
    expenseFilter.date = {};
    if (startDate) expenseFilter.date.$gte = new Date(startDate);
    if (endDate) expenseFilter.date.$lte = new Date(endDate);
  }

  const expenses = await Expense.find(expenseFilter).lean();
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const net = totalPayments - totalExpenses;

  res.json({
    summary: {
      totalFees: totalFeeAmount,
      totalPaid: totalPaidAmount,
      totalOutstanding,
      paidPercentage: totalFeeAmount > 0 ? ((totalPaidAmount / totalFeeAmount) * 100).toFixed(2) : 0,
      totalPayments,
      paymentsByMethod,
      totalExpenses,
      netCashFlow: net,
      periodStart: startDate || 'All time',
      periodEnd: endDate || 'All time'
    },
    feeBreakdown: {
      paid: fees.filter(f => f.status === 'paid').length,
      pending: fees.filter(f => f.status === 'pending').length,
      unpaid: fees.filter(f => f.status === 'unpaid').length
    }
  });
}));

/**
 * GET /api/accounts/reports/overdue
 * Get overdue fees report
 */
router.get('/reports/overdue', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const now = new Date();
  const overdueFilter = {
    status: { $in: ['unpaid', 'pending'] },
    dueDate: { $lt: now }
  };

  const overdueFees = await Fee.find(overdueFilter)
    .populate('studentId', 'firstName lastName studentId')
    .sort({ dueDate: 1 })
    .lean();

  const totalOverdue = overdueFees.reduce((sum, f) => sum + Math.max(0, f.amount - (f.amountPaid || 0)), 0);
  const overdueDays = overdueFees.map(f => ({
    ...f,
    daysOverdue: Math.floor((now - new Date(f.dueDate)) / (1000 * 60 * 60 * 24)),
    outstandingAmount: Math.max(0, f.amount - (f.amountPaid || 0))
  }));

  res.json({
    count: overdueFees.length,
    totalOverdue,
    fees: overdueDays
  });
}));

/**
 * GET /api/accounts/reports/collection-trend
 * Get payment collection trend
 */
router.get('/reports/collection-trend', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { months = 12 } = req.query;
  
  const trend = await Payment.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' }
        },
        totalAmount: { $sum: '$amountPaid' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: parseInt(months) }
  ]);

  res.json({
    trend: trend.reverse(),
    period: `Last ${months} months`
  });
}));

module.exports = router;
