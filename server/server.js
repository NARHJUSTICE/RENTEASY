require('dotenv').config();
console.log('📢 Step 1: dotenv loaded');

const express = require('express');
console.log('📢 Step 2: express loaded');

const path = require('path');
console.log('📢 Step 3: path loaded');

const mongoose = require('mongoose');
console.log('📢 Step 3: mongoose loaded');

const cors = require('cors');
console.log('📢 Step 4: cors loaded');

// Import routes
console.log('📢 Step 5: Importing routes...');
const authRoutes = require('./routes/auth');
console.log('📢 Step 6: auth routes loaded');

const propertyRoutes = require('./routes/properties');
console.log('📢 Step 7: property routes loaded');

const subscriptionRoutes = require('./routes/subscriptions');
console.log('📢 Step 8: subscription routes loaded');

// UPLOAD ROUTE - RE-ENABLED
console.log('📢 Step 9: loading upload routes...');
const uploadRoutes = require('./routes/upload');
console.log('📢 Step 9: upload routes loaded');

// ✅ Application routes
console.log('📢 Step 9.5: loading application routes...');
const applicationRoutes = require('./routes/applications');
console.log('📢 Step 9.5: application routes loaded');

// ✅ Booking routes
console.log('📢 Step 9.6: loading booking routes...');
const bookingRoutes = require('./routes/bookings');
console.log('📢 Step 9.6: booking routes loaded');

// ✅ Admin routes
console.log('📢 Step 9.7: loading admin routes...');
const adminRoutes = require('./routes/admin');
console.log('📢 Step 9.7: admin routes loaded');

// ✅ Reviews routes
console.log('📢 Step 9.8: loading reviews routes...');
const reviewRoutes = require('./routes/reviews');
console.log('📢 Step 9.8: reviews routes loaded');

// ✅ Messages routes
console.log('📢 Step 9.9: loading messages routes...');
const messageRoutes = require('./routes/messages');
console.log('📢 Step 9.9: messages routes loaded');

// ✅ Favorites routes
console.log('📢 Step 9.10: loading favorites routes...');
const favoriteRoutes = require('./routes/favorites');
console.log('📢 Step 9.10: favorites routes loaded');

// ✅ NOTIFICATION ROUTES - ADDED
console.log('📢 Step 9.11: loading notification routes...');
const notificationRoutes = require('./routes/notifications');
console.log('📢 Step 9.11: notification routes loaded');

// ✅ ANALYTICS ROUTES - ADDED
console.log('📢 Step 9.12: loading analytics routes...');
const analyticsRoutes = require('./routes/analytics');
console.log('📢 Step 9.12: analytics routes loaded');

const dotenv = require('dotenv');
console.log('📢 Step 10: dotenv re-loaded');

dotenv.config();
console.log('📢 Step 11: dotenv configured');

const app = express();
console.log('📢 Step 12: app created');

const PORT = process.env.PORT || 5001;
console.log('📢 Step 13: PORT set to', PORT);

// ✅ PRODUCTION-READY CORS: Allow both local and production URLs
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
  'https://renteasy.vercel.app', // Your Vercel URL (replace later)
  'https://renteasy-frontend.vercel.app'
].filter(Boolean);

console.log('📢 Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('❌ Blocked by CORS:', origin);
      callback(null, true); // Allow anyway for dev, but log it
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files - with fallback for production
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles')));
app.use('/uploads/properties', express.static(path.join(__dirname, 'uploads/properties')));
app.use('/uploads/id-proofs', express.static(path.join(__dirname, 'uploads/id-proofs')));
console.log('📢 Step 14: Middleware configured');

// ✅ Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
console.log('📢 Step 15: Routes configured');

// ✅ Catch-all route for undefined API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// MongoDB connection
mongoose.set('strictQuery', false);
mongoose.set('autoIndex', false);
console.log('📢 Step 16: Connecting to MongoDB...');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/houserenting', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
})
.catch(err => console.error('❌ MongoDB connection error:', err.message));

console.log('📢 Step 17: Server starting...');

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});