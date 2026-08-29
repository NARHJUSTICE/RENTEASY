const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Property = require('../models/Property');
const Application = require('../models/Application');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Favorite = require('../models/Favorite');

// ✅ Get dashboard stats for tenant
router.get('/tenant', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get applications
    const applications = await Application.find({ tenant: userId });
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(a => a.status === 'pending').length;
    const approvedApplications = applications.filter(a => a.status === 'approved').length;
    const rejectedApplications = applications.filter(a => a.status === 'rejected').length;

    // Get favorites
    const favorites = await Favorite.find({ user: userId });
    const totalFavorites = favorites.length;

    // Get reviews
    const reviews = await Review.find({ tenant: userId });
    const totalReviews = reviews.length;
    const averageRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    // Get bookings
    const bookings = await Booking.find({ tenant: userId });
    const totalBookings = bookings.length;
    const upcomingBookings = bookings.filter(b => new Date(b.checkIn) > new Date()).length;

    // Get recent applications (last 5)
    const recentApplications = await Application.find({ tenant: userId })
      .populate('property', 'title address rentPrice photos')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalFavorites,
        totalReviews,
        averageRating: parseFloat(averageRating),
        totalBookings,
        upcomingBookings
      },
      recentApplications,
      recentActivity: recentApplications.map(app => ({
        id: app._id,
        type: 'application',
        title: app.property?.title || 'Unknown Property',
        status: app.status,
        date: app.createdAt,
        propertyId: app.property?._id
      }))
    });
  } catch (error) {
    console.error('Error fetching tenant dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// ✅ Get dashboard stats for landlord
router.get('/landlord', authenticateToken, requireRole(['landlord']), async (req, res) => {
  try {
    const userId = req.user._id;

    // Get properties owned by landlord
    const properties = await Property.find({ owner: userId });
    const totalProperties = properties.length;
    const availableProperties = properties.filter(p => p.availability === 'available').length;
    const rentedProperties = properties.filter(p => p.availability === 'rented').length;
    const maintenanceProperties = properties.filter(p => p.availability === 'maintenance').length;

    // Get total rooms
    const totalRooms = properties.reduce((sum, p) => sum + (p.totalRooms || 0), 0);
    const occupiedRooms = properties.reduce((sum, p) => sum + (p.occupiedRooms || 0), 0);
    const availableRooms = totalRooms - occupiedRooms;

    // Get applications for landlord's properties
    const propertyIds = properties.map(p => p._id);
    const applications = await Application.find({ property: { $in: propertyIds } });
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(a => a.status === 'pending').length;
    const approvedApplications = applications.filter(a => a.status === 'approved').length;
    const rejectedApplications = applications.filter(a => a.status === 'rejected').length;

    // Get total revenue (sum of rent prices for rented properties)
    const totalRevenue = properties
      .filter(p => p.availability === 'rented')
      .reduce((sum, p) => sum + (p.rentPrice || 0), 0);

    // Get reviews for properties
    const reviews = await Review.find({ property: { $in: propertyIds } });
    const totalReviews = reviews.length;
    const averageRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    // Get recent applications
    const recentApplications = await Application.find({ property: { $in: propertyIds } })
      .populate('tenant', 'name email')
      .populate('property', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent properties
    const recentProperties = properties
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      stats: {
        totalProperties,
        availableProperties,
        rentedProperties,
        maintenanceProperties,
        totalRooms,
        occupiedRooms,
        availableRooms,
        occupancyRate: totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalRevenue,
        totalReviews,
        averageRating: parseFloat(averageRating)
      },
      recentApplications,
      recentProperties
    });
  } catch (error) {
    console.error('Error fetching landlord dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// ✅ Get admin dashboard stats
router.get('/admin', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get all users
    const totalUsers = await User.countDocuments();
    const totalLandlords = await User.countDocuments({ role: 'landlord' });
    const totalTenants = await User.countDocuments({ 
      role: { $in: ['student', 'government_worker', 'family'] } 
    });

    // Get all properties
    const totalProperties = await Property.countDocuments();
    const availableProperties = await Property.countDocuments({ availability: 'available' });
    const rentedProperties = await Property.countDocuments({ availability: 'rented' });
    const maintenanceProperties = await Property.countDocuments({ availability: 'maintenance' });

    // Get all applications
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const approvedApplications = await Application.countDocuments({ status: 'approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });

    // Get total revenue from all properties
    const allProperties = await Property.find();
    const totalRevenue = allProperties
      .filter(p => p.availability === 'rented')
      .reduce((sum, p) => sum + (p.rentPrice || 0), 0);

    // Get total rooms
    const totalRooms = allProperties.reduce((sum, p) => sum + (p.totalRooms || 0), 0);
    const occupiedRooms = allProperties.reduce((sum, p) => sum + (p.occupiedRooms || 0), 0);

    // Get all reviews
    const totalReviews = await Review.countDocuments();
    const avgRatingResult = await Review.aggregate([
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);
    const averageRating = avgRatingResult.length > 0 ? parseFloat(avgRatingResult[0].average.toFixed(1)) : 0;

    // Get recent users
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent properties
    const recentProperties = await Property.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent applications
    const recentApplications = await Application.find()
      .populate('tenant', 'name email')
      .populate('property', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get monthly stats (last 6 months)
    const monthlyStats = await getMonthlyStats();

    res.json({
      stats: {
        totalUsers,
        totalLandlords,
        totalTenants,
        totalProperties,
        availableProperties,
        rentedProperties,
        maintenanceProperties,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalRevenue,
        totalRooms,
        occupiedRooms,
        occupancyRate: totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0,
        totalReviews,
        averageRating
      },
      recentUsers,
      recentProperties,
      recentApplications,
      monthlyStats
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// ✅ Helper function: Get monthly stats
async function getMonthlyStats() {
  const months = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    
    const users = await User.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    });
    
    const properties = await Property.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    });
    
    const applications = await Application.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    });
    
    months.push({
      month: monthName,
      users,
      properties,
      applications
    });
  }
  
  return months;
}

module.exports = router;