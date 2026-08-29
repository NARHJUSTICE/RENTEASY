const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
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

// Ensure one review per application
reviewSchema.index({ application: 1 }, { unique: true });

// Update updatedAt on save
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate average rating for a property
reviewSchema.statics.getAverageRating = async function(propertyId) {
  const result = await this.aggregate([
    { $match: { property: propertyId } },
    { $group: { _id: '$property', averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  return result.length > 0 ? {
    average: parseFloat(result[0].averageRating.toFixed(1)),
    count: result[0].count
  } : { average: 0, count: 0 };
};

module.exports = mongoose.model('Review', reviewSchema);