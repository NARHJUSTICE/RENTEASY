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
    enum: [
      // Residential
      'apartment', 'house', 'room', 'studio', 'flat', 'duplex', 'triplex',
      'bungalow', 'villa', 'mansion', 'townhouse', 'penthouse', 'cottage',
      'cabin', 'farmhouse', 'guest_house', 'serviced_apartment',
      // Student & Budget
      'hostel', 'university_hostel', 'paying_guest', 'student_accommodation',
      'dormitory', 'boarding_house', 'shared_room',
      // Commercial
      'shop', 'retail_space', 'office_space', 'warehouse', 'factory',
      'storage_unit', 'showroom', 'boutique', 'salon', 'restaurant_space',
      'cafe', 'bakery', 'food_court_stall',
      // Hospitality & Events
      'hotel', 'resort', 'lodge', 'bed_and_breakfast', 'motel', 'inn',
      'campground', 'eco_lodge', 'vacation_rental', 'event_space',
      'conference_center', 'banquet_hall', 'party_hall', 'wedding_venue',
      'exhibition_space', 'studio_space',
      // Specialized
      'co_living_space', 'coworking_space', 'workspace', 'workshop',
      'garage', 'parking_space', 'gym_space', 'clinic_space', 'daycare_space',
      'school_space', 'nursing_home', 'industrial_unit', 'laboratory',
      'distribution_center', 'land', 'agricultural_land'
    ],
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
  videos: {
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