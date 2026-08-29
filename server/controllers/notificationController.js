const Notification = require('../models/Notification');
const User = require('../models/User');

// Get notifications for current user
exports.getNotifications = async (req, res) => {
  try {
    // ✅ Handle case where user is not authenticated (for testing)
    if (!req.user) {
      // Return empty array for testing
      return res.json([]);
    }
    
    const userId = req.user._id;
    const userRole = req.user.role;
    const { limit = 20, skip = 0, unread = false } = req.query;

    // Build query: notifications that target the user directly OR target their role
    const query = {
      $or: [
        { 'recipients.user': userId },
        { roles: userRole },
        { isGlobal: true }
      ]
    };

    // Filter unread if requested
    if (unread === 'true') {
      query['recipients'] = {
        $elemMatch: {
          user: userId,
          read: false
        }
      };
    }

    const notifications = await Notification.find(query)
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Transform to include read status for the current user
    const formattedNotifications = notifications.map(notification => {
      const isRead = notification.isReadByUser(userId);
      return {
        _id: notification._id,
        type: notification.type,
        message: notification.message,
        data: notification.data,
        link: notification.link,
        priority: notification.priority,
        createdAt: notification.createdAt,
        read: isRead,
        actor: notification.actor
      };
    });

    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Get unread count for current user
exports.getUnreadCount = async (req, res) => {
  try {
    // ✅ Handle case where user is not authenticated (for testing)
    if (!req.user) {
      return res.json({ unreadCount: 0 });
    }
    
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
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ message: 'Error counting unread notifications' });
  }
};

// Mark a single notification as read
exports.markAsRead = async (req, res) => {
  try {
    // ✅ Handle case where user is not authenticated (for testing)
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user is a recipient of this notification
    const isRecipient = notification.recipients.some(r => r.user.toString() === userId.toString());
    const isRoleMatch = notification.roles.includes(req.user.role);
    const isGlobal = notification.isGlobal;

    if (!isRecipient && !isRoleMatch && !isGlobal) {
      return res.status(403).json({ message: 'Not authorized to mark this notification as read' });
    }

    await notification.markAsRead(userId);
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Mark all notifications as read for current user
exports.markAllAsRead = async (req, res) => {
  try {
    // ✅ Handle case where user is not authenticated (for testing)
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user._id;
    const userRole = req.user.role;

    // Find all notifications targeting this user that are unread
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

    // Mark each notification as read
    await Promise.all(
      notifications.map(notification => notification.markAsRead(userId))
    );

    res.json({ 
      message: 'All notifications marked as read',
      count: notifications.length 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
};

// Create a notification (internal use only - not exposed as API)
exports.createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Delete notification (admin only)
exports.deleteNotification = async (req, res) => {
  try {
    // ✅ Handle case where user is not authenticated (for testing)
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const { id } = req.params;
    
    // Only admins can delete notifications
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete notifications' });
    }

    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

// Create test notifications for development
exports.createTestNotifications = async (req, res) => {
  try {
    // ✅ Handle case where user is not authenticated (for testing)
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user._id;
    const userRole = req.user.role;

    const testNotifications = [];

    // Create role-specific test notifications
    if (userRole === 'tenant' || userRole === 'student') {
      testNotifications.push({
        recipients: [{ user: userId }],
        type: 'welcome',
        message: 'Welcome to RentEasy! Start exploring properties today.',
        link: '/browse',
        priority: 'info',
        data: {}
      });
      testNotifications.push({
        recipients: [{ user: userId }],
        type: 'application_update',
        message: 'Your application for PG For Boys is pending review.',
        link: '/my-applications',
        priority: 'info',
        data: { applicationId: 'test123' }
      });
      testNotifications.push({
        recipients: [{ user: userId }],
        type: 'property_availability',
        message: 'New property "Beautiful 2-Bed room Apartment" is now available.',
        link: '/browse',
        priority: 'info',
        data: { propertyId: 'test456' }
      });
      testNotifications.push({
        recipients: [{ user: userId }],
        type: 'id_verification',
        message: 'Your ID verification has been approved.',
        link: '/profile',
        priority: 'info',
        data: { status: 'approved' }
      });
    }

    if (userRole === 'landlord') {
      testNotifications.push({
        recipients: [{ user: userId }],
        type: 'welcome',
        message: 'Welcome to RentEasy! Start listing your properties today.',
        link: '/my-properties',
        priority: 'info',
        data: {}
      });
      testNotifications.push({
        recipients: [{ user: userId }],
        type: 'new_application',
        message: 'You have a new application for your property "PG For Boys".',
        link: '/applications',
        priority: 'warning',
        data: { propertyId: 'test789', applicationId: 'test123' }
      });
    }

    if (userRole === 'admin') {
      testNotifications.push({
        recipients: [{ user: userId }],
        type: 'welcome',
        message: 'Welcome to the Admin Dashboard!',
        link: '/admin',
        priority: 'info',
        data: {}
      });
      testNotifications.push({
        recipients: [{ user: userId }],
        type: 'system_update',
        message: 'New user registration requires moderation.',
        link: '/admin/users',
        priority: 'warning',
        data: {}
      });
    }

    // Create the notifications
    const created = await Notification.insertMany(testNotifications);
    
    res.json({ 
      message: 'Test notifications created successfully',
      count: created.length 
    });
  } catch (error) {
    console.error('Error creating test notifications:', error);
    res.status(500).json({ message: 'Error creating test notifications' });
  }
};