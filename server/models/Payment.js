const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  subscriptionType: {
    type: String,
    enum: ['first_time', 'monthly_renewal'],
    required: true
  },
  stripePaymentIntentId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  subscriptionPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);