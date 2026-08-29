const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Application = require('../models/Application');
const Property = require('../models/Property');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ✅ Create a review (tenant only)
router.post('/', authenticateToken, requireRole(['student', 'government_worker', 'family']), async (req, res) => {
  try {
    const { applicationId, rating, comment } = req.body;

    // Check if application exists and belongs to this tenant
    const application = await Application.findOne({
      _id: applicationId,
      tenant: req.user._id,
      status: 'approved'
    });

    if (!application) {
      return res.status(404).json({ message: 'Approved application not found' });
    }

    // Check if review already exists for this application
    const existingReview = await Review.findOne({ application: applicationId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this property' });
    }

    const review = new Review({
      property: application.property,
      tenant: req.user._id,
      application: applicationId,
      rating,
      comment
    });

    await review.save();

    // ✅ FIX: Convert propertyId to ObjectId for aggregation
    const propertyId = new mongoose.Types.ObjectId(application.property);

    const result = await Review.aggregate([
      { $match: { property: propertyId } },
      { $group: { 
          _id: '$property', 
          averageRating: { $avg: '$rating' }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const avgRating = result.length > 0 ? parseFloat(result[0].averageRating.toFixed(1)) : 0;
    const reviewCount = result.length > 0 ? result[0].count : 0;

    // ✅ Update property with new average rating and review count
    await Property.findByIdAndUpdate(application.property, {
      averageRating: avgRating,
      reviewCount: reviewCount
    });

    res.status(201).json({
      message: 'Review submitted successfully',
      review,
      averageRating: avgRating,
      reviewCount: reviewCount
    });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ message: 'Error creating review: ' + error.message });
  }
});

// ✅ Get reviews for a property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const reviews = await Review.find({ property: propertyId })
      .populate('tenant', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(20);

    // ✅ FIX: Convert propertyId to ObjectId for aggregation
    const propertyObjectId = new mongoose.Types.ObjectId(propertyId);

    const result = await Review.aggregate([
      { $match: { property: propertyObjectId } },
      { $group: { 
          _id: '$property', 
          averageRating: { $avg: '$rating' }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const avgRating = result.length > 0 ? parseFloat(result[0].averageRating.toFixed(1)) : 0;
    const totalReviews = result.length > 0 ? result[0].count : 0;

    res.json({
      reviews,
      averageRating: avgRating,
      totalReviews: totalReviews
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// ✅ Get reviews by tenant
router.get('/my-reviews', authenticateToken, async (req, res) => {
  try {
    const reviews = await Review.find({ tenant: req.user._id })
      .populate('property', 'title address rentPrice photos')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Fetch my reviews error:', error);
    res.status(500).json({ message: 'Error fetching your reviews' });
  }
});

// ✅ Delete review (admin only)
router.delete('/:reviewId', authenticateToken, requireRole(['landlord']), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is admin or the review owner
    if (review.tenant.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();

    // ✅ FIX: Convert propertyId to ObjectId for aggregation
    const propertyId = new mongoose.Types.ObjectId(review.property);

    const result = await Review.aggregate([
      { $match: { property: propertyId } },
      { $group: { 
          _id: '$property', 
          averageRating: { $avg: '$rating' }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const avgRating = result.length > 0 ? parseFloat(result[0].averageRating.toFixed(1)) : 0;
    const reviewCount = result.length > 0 ? result[0].count : 0;

    await Property.findByIdAndUpdate(review.property, {
      averageRating: avgRating,
      reviewCount: reviewCount
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
});

module.exports = router;