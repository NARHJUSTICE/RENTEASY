const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  idProofDocument: {
    url: { type: String, default: null },
    publicId: { type: String, default: null },
    fileName: { type: String, default: null },
    uploadedAt: { type: Date, default: null }
  },
  idStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'probation'],
    default: 'pending'
  },
  idVerificationNotes: {
    type: String,
    default: ''
  },
  probationEndDate: {
    type: Date,
    default: null
  },
  // Application specific fields
  moveInDate: {
    type: Date,
    default: null
  },
  rentalDuration: {
    type: String,
    default: '6'
  },
  occupation: {
    type: String,
    default: ''
  },
  monthlyIncome: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  // Application review fields
  status: {
    type: String,
    // ✅ ADDED 'withdrawn' to enum
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'withdrawn'],
    default: 'pending'
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Date fields for status changes
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  probationAt: {
    type: Date,
    default: null
  },
  // ✅ ADDED: Withdrawal fields
  withdrawnAt: {
    type: Date,
    default: null
  },
  withdrawnBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
applicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Application', applicationSchema);