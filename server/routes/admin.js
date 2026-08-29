// server/routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');
const Application = require('../models/Application');
const Booking = require('../models/Booking');
const { authenticateToken } = require('../middleware/auth');

// ✅ Admin middleware - check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin status' });
  }
};

// ✅ Get dashboard stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const totalApplications = await Application.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    // Get revenue from bookings (total price sum)
    const bookings = await Booking.find();
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    // Get recent users
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    
    // Get recent properties
    const recentProperties = await Property.find().sort({ createdAt: -1 }).limit(5);
    
    res.json({
      stats: {
        totalUsers,
        totalProperties,
        totalApplications,
        totalBookings,
        totalRevenue
      },
      recentUsers,
      recentProperties
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// ✅ Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// ✅ Update user (suspend/activate/delete)
router.patch('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { subscriptionStatus, isAdmin, role } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (subscriptionStatus) user.subscriptionStatus = subscriptionStatus;
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    if (role) user.role = role;
    
    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// ✅ Delete user
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// ✅ Get all properties
router.get('/properties', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const properties = await Property.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Admin properties error:', error);
    res.status(500).json({ message: 'Error fetching properties' });
  }
});

// ✅ Delete property
router.delete('/properties/:propertyId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { propertyId } = req.params;
    await Property.findByIdAndDelete(propertyId);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Admin delete property error:', error);
    res.status(500).json({ message: 'Error deleting property' });
  }
});

// ✅ Get all applications
router.get('/applications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('property', 'title')
      .populate('tenant', 'name email')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Admin applications error:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
});

module.exports = router;