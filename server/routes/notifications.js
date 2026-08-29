const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// ✅ GET notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📢 [NOTIFICATIONS] Fetching for user:', req.user?._id);
    console.log('📢 [NOTIFICATIONS] User role:', req.user?.role);
    
    const userId = req.user._id;
    const userRole = req.user.role;
    
    const notifications = await Notification.find({
      $or: [
        { 'recipients.user': userId },
        { roles: userRole },
        { isGlobal: true }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(20);
    
    console.log('📢 [NOTIFICATIONS] Found:', notifications.length);
    
    const formatted = notifications.map(n => ({
      _id: n._id,
      type: n.type,
      message: n.message,
      link: n.link,
      createdAt: n.createdAt,
      read: n.recipients.some(r => r.user.toString() === userId.toString() && r.read)
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error fetching:', error);
    res.json([]);
  }
});

// ✅ GET unread count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    const notifications = await Notification.find({
      $or: [
        { 'recipients.user': userId },
        { roles: userRole },
        { isGlobal: true }
      ],
      'recipients': {
        $elemMatch: {
          user: userId,
          read: false
        }
      }
    });
    
    res.json({ unreadCount: notifications.length });
  } catch (error) {
    console.error('Error counting notifications:', error);
    res.json({ unreadCount: 0 });
  }
});

// ✅ Mark as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: 'Not found' });
    }
    
    await notification.markAsRead(userId);
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ message: 'Error' });
  }
});

// ✅ Mark all as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    const notifications = await Notification.find({
      $or: [
        { 'recipients.user': userId },
        { roles: userRole },
        { isGlobal: true }
      ],
      'recipients': {
        $elemMatch: {
          user: userId,
          read: false
        }
      }
    });
    
    for (const n of notifications) {
      await n.markAsRead(userId);
    }
    
    res.json({ message: 'All marked as read', count: notifications.length });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Error' });
  }
});

// ✅ CREATE TEST NOTIFICATIONS (Protected - requires authentication)
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    const testNotifications = [
      {
        recipients: [{ user: userId }],
        type: 'welcome',
        message: 'Welcome to RentEasy! Start exploring properties today.',
        link: '/browse',
        priority: 'info',
        data: {}
      },
      {
        recipients: [{ user: userId }],
        type: 'application_update',
        message: 'Your application for PG For Boys is pending review.',
        link: '/my-applications',
        priority: 'info',
        data: { applicationId: 'test123' }
      },
      {
        recipients: [{ user: userId }],
        type: 'property_availability',
        message: 'New property "Beautiful 2-Bed room Apartment" is now available.',
        link: '/browse',
        priority: 'info',
        data: { propertyId: 'test456' }
      },
      {
        recipients: [{ user: userId }],
        type: 'id_verification',
        message: 'Your ID verification has been approved.',
        link: '/profile',
        priority: 'info',
        data: { status: 'approved' }
      }
    ];
    
    const created = await Notification.insertMany(testNotifications);
    res.json({ 
      message: `Created ${created.length} test notifications for user: ${req.user.name}`,
      count: created.length 
    });
  } catch (error) {
    console.error('Error creating test notifications:', error);
    res.status(500).json({ 
      message: 'Error creating test notifications', 
      error: error.message 
    });
  }
});

module.exports = router;