// server/middleware/adminAuth.js
const { authenticateToken } = require('./auth');

const requireAdmin = async (req, res, next) => {
  // First authenticate the user
  authenticateToken(req, res, () => {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};

module.exports = { requireAdmin };