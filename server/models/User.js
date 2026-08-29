const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'government_worker', 'family', 'landlord'],
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['inactive', 'active', 'expired'],
    default: 'inactive'
  },
  subscriptionExpiryDate: {
    type: Date,
    default: null
  },
  firstTimePayment: {
    type: Boolean,
    default: true
  },
  idProofDocument: {
    type: String,
    default: null
  },
  // Enhanced ID proof fields
  idProofDetails: {
    url: { type: String, default: null },
    publicId: { type: String, default: null },
    fileName: { type: String, default: null },
    uploadedAt: { type: Date, default: null }
  },
  idVerificationStatus: {
    type: String,
    enum: ['not_uploaded', 'pending', 'verified', 'rejected', 'probation', 'expired', 'approved'],
    default: 'not_uploaded'
  },
  idVerificationNotes: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: null
  },
  // ✅ NEW: Password reset fields
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // ✅ NEW: Admin field
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);