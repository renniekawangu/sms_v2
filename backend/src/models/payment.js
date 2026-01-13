const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: Number, unique: true },
  feeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee', required: true },
  amountPaid: { type: Number, required: true },
  method: { type: String, default: 'cash' },
  paymentDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

paymentSchema.index({ paymentDate: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = { Payment };
