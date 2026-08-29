const mongoose = require('mongoose');

const notificationRecipientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
});

const notificationSchema = new mongoose.Schema({
  // Recipients - using subdocuments for per-user read tracking
  recipients: [notificationRecipientSchema],
  
  // Role-based targeting (for notifications sent to all users of a role)
  roles: [{
    type: String,
    enum: ['tenant', 'landlord', 'admin', 'student', 'government_worker', 'family']
  }],
  
  // Notification type
  type: {
    type: String,
    required: true,
    enum: [
      'application_update',
      'new_application',
      'property_availability',
      'property_status',
      'id_verification',
      'message',
      'new_message',
      'system_update',
      'user_flagged',
      'property_moderation',
      'abuse_report',
      'welcome',
      'subscription'
    ]
  },
  
  // User who triggered the notification (optional)
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notification content
  message: {
    type: String,
    required: true
  },
  
  // Structured data payload
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Navigation link
  link: {
    type: String,
    default: '/dashboard'
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  
  // For system-wide notifications (no specific recipients)
  isGlobal: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ 'recipients.user': 1, createdAt: -1 });
notificationSchema.index({ roles: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ 'recipients.user': 1, 'recipients.read': 1 });

// Static method to create notification for a specific user
notificationSchema.statics.createForUser = async function(userId, notificationData) {
  const notification = new this({
    recipients: [{ user: userId }],
    ...notificationData
  });
  return notification.save();
};

// Static method to create notification for multiple users
notificationSchema.statics.createForUsers = async function(userIds, notificationData) {
  const recipients = userIds.map(userId => ({ user: userId }));
  const notification = new this({
    recipients,
    ...notificationData
  });
  return notification.save();
};

// Static method to create notification for a role
notificationSchema.statics.createForRole = async function(role, notificationData) {
  const notification = new this({
    roles: [role],
    ...notificationData
  });
  return notification.save();
};

// Static method to create notification for multiple roles
notificationSchema.statics.createForRoles = async function(roles, notificationData) {
  const notification = new this({
    roles,
    ...notificationData
  });
  return notification.save();
};

// Static method to create a global notification
notificationSchema.statics.createGlobal = async function(notificationData) {
  const notification = new this({
    isGlobal: true,
    ...notificationData
  });
  return notification.save();
};

// Instance method to mark notification as read for a specific user
notificationSchema.methods.markAsRead = async function(userId) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (recipient) {
    recipient.read = true;
    recipient.readAt = new Date();
    await this.save();
  }
  return this;
};

// Instance method to check if user has read this notification
notificationSchema.methods.isReadByUser = function(userId) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  return recipient ? recipient.read : false;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;