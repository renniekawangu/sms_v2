const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: 'School Fee' },
  status: { type: String, required: true, enum: ['paid', 'unpaid', 'pending'], default: 'unpaid' },
  dueDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amountPaid: { type: Number, default: 0 },
  payments: [
    {
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      method: { type: String },
      notes: { type: String }
    }
  ],
  latePenaltyApplied: { type: Boolean, default: false }
}, { timestamps: true });

// Virtual for remaining balance
feeSchema.virtual('balance').get(function() {
  return Math.max(0, this.amount - (this.amountPaid || 0));
});

// Virtual for payment percentage
feeSchema.virtual('paidPercentage').get(function() {
  return this.amount > 0 ? Math.round(((this.amountPaid || 0) / this.amount) * 100) : 0;
});

// Ensure virtuals are included in JSON/Object serialization
feeSchema.set('toJSON', { virtuals: true });
feeSchema.set('toObject', { virtuals: true });

const Fee = mongoose.model('Fee', feeSchema);

async function getAllFees() {
  return await Fee.find().populate('studentId');
}

async function getFeeById(id) {
  return await Fee.findById(id).populate('studentId');
}

async function getFeesByStudent(studentId) {
  return await Fee.find({ studentId }).populate('studentId');
}

async function createFee(feeData) {
  const fee = new Fee(feeData);
  return await fee.save();
}

async function updateFee(id, updates) {
  const fee = await Fee.findById(id);
  if (!fee) {
    throw new Error('Fee not found');
  }
  Object.assign(fee, updates);
  return await fee.save();
}

async function deleteFee(id) {
  const fee = await Fee.findByIdAndDelete(id);
  if (!fee) {
    throw new Error('Fee not found');
  }
  return fee;
}

async function markFeeAsPaid(id) {
  const fee = await Fee.findById(id);
  if (!fee) {
    throw new Error('Fee not found');
  }
  fee.status = 'paid';
  fee.amountPaid = fee.amount;
  return await fee.save();
}

async function addPartialPayment(id, amount, meta = {}) {
  const fee = await Fee.findById(id);
  if (!fee) {
    throw new Error('Fee not found');
  }
  if (!amount || amount <= 0) {
    throw new Error('Invalid payment amount');
  }
  fee.amountPaid = (fee.amountPaid || 0) + amount;
  fee.payments = fee.payments || [];
  fee.payments.push({ amount, date: new Date(), method: meta.method || '', notes: meta.notes || '' });
  // Update status based on amountPaid vs amount
  if (fee.amountPaid >= fee.amount) {
    fee.status = 'paid';
    fee.amountPaid = fee.amount; // cap to total
  } else {
    fee.status = 'pending';
  }
  return await fee.save();
}

async function getUnpaidFees() {
  return await Fee.find({ status: 'unpaid' }).populate('studentId');
}

async function getPaidFees() {
  return await Fee.find({ status: 'paid' }).populate('studentId');
}

module.exports = { Fee, getAllFees, getFeeById, getFeesByStudent, createFee, updateFee, deleteFee, markFeeAsPaid, getUnpaidFees, getPaidFees, addPartialPayment };