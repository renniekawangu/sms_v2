const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  feeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee', required: true },
  amountPaid: { type: Number, required: true },
  method: { type: String, default: 'cash' },
  paymentDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true });

paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ feeId: 1 });

// Clean up old indexes before creating model
paymentSchema.pre('init', async function() {
  try {
    // Remove the old paymentId unique index if it exists
    const indexes = await this.collection?.getIndexes?.();
    if (indexes && indexes['paymentId_1']) {
      await this.collection?.dropIndex?.('paymentId_1');
    }
  } catch (err) {
    // Ignore index cleanup errors
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = { Payment };
