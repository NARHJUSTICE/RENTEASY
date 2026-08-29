const Notification = require('../models/Notification');

class NotificationHelper {
  // Send notification to a single user
  static async sendToUser(userId, data) {
    try {
      const notification = new Notification({
        recipients: [{ user: userId }],
        ...data
      });
      return await notification.save();
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return null;
    }
  }

  // Send notification to multiple users
  static async sendToUsers(userIds, data) {
    try {
      const recipients = userIds.map(userId => ({ user: userId }));
      const notification = new Notification({
        recipients,
        ...data
      });
      return await notification.save();
    } catch (error) {
      console.error('Error sending notification to users:', error);
      return null;
    }
  }

  // Send notification to a role
  static async sendToRole(role, data) {
    try {
      const notification = new Notification({
        roles: [role],
        ...data
      });
      return await notification.save();
    } catch (error) {
      console.error('Error sending notification to role:', error);
      return null;
    }
  }

  // Send notification to multiple roles
  static async sendToRoles(roles, data) {
    try {
      const notification = new Notification({
        roles,
        ...data
      });
      return await notification.save();
    } catch (error) {
      console.error('Error sending notification to roles:', error);
      return null;
    }
  }

  // Send global notification
  static async sendGlobal(data) {
    try {
      const notification = new Notification({
        isGlobal: true,
        ...data
      });
      return await notification.save();
    } catch (error) {
      console.error('Error sending global notification:', error);
      return null;
    }
  }
}

module.exports = NotificationHelper;