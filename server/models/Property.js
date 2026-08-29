const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  houseNumber: {
    type: String,
    required: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    region: {
      type: String,
      required: true
    },
    postalCode: {
      type: String
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  rentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'room', 'studio'],
    required: true
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 0
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 0
  },
  totalRooms: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  availableRooms: {
    type: Number,
    default: 0,
    min: 0
  },
  occupiedRooms: {
    type: Number,
    default: 0,
    min: 0
  },
  amenities: {
    type: [String],
    default: []
  },
  photos: {
    type: [String],
    default: []
  },
  availability: {
    type: String,
    enum: ['available', 'rented', 'maintenance'],
    default: 'available'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interestedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // ✅ Review summary fields
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  // ✅ NEW: Diet & Gender Preferences
  dietPreference: {
    type: String,
    enum: ['veg', 'non-veg', 'both'],
    default: 'both'
  },
  dietExceptions: {
    type: String,
    default: ''
  },
  genderPreference: {
    type: String,
    enum: ['male', 'female', 'both'],
    default: 'both'
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
propertySchema.index({ location: '2dsphere' });

// Create index for faster queries
propertySchema.index({ owner: 1, createdAt: -1 });
propertySchema.index({ availability: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ 'address.city': 1 });

module.exports = mongoose.model('Property', propertySchema);