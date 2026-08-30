const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const User = require('../models/User');
const { authenticateToken, requireSubscription, requireRole } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const { normalizeRoomCount } = require('../utils/roomCount');
const fs = require('fs');
const path = require('path');

// Get all properties
router.get('/', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { lat, lng, radius = 10, propertyType, minPrice, maxPrice, bedrooms, city, availability } = req.query;
    
    let query = {};
    
    if (availability) {
      query.availability = availability;
    }
    
    if (propertyType) {
      query.propertyType = propertyType;
    }
    
    if (minPrice || maxPrice) {
      query.rentPrice = {};
      if (minPrice) query.rentPrice.$gte = Number(minPrice);
      if (maxPrice) query.rentPrice.$lte = Number(maxPrice);
    }
    
    if (bedrooms) {
      if (bedrooms === '4') {
        query.bedrooms = { $gte: 4 };
      } else {
        query.bedrooms = Number(bedrooms);
      }
    }
    
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    let properties;
    
    if (lat && lng) {
      properties = await Property.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [Number(lng), Number(lat)]
            },
            $maxDistance: radius * 1000
          }
        }
      }).populate('owner', 'name email phone profileImage').limit(50);
    } else {
      properties = await Property.find(query)
        .populate('owner', 'name email phone profileImage')
        .limit(50);
    }

    res.json(properties);
  } catch (error) {
    console.error('Properties fetch error:', error);
    res.status(500).json({ message: 'Error fetching properties' });
  }
});

// Get landlord's properties
router.get('/my-properties', [
  authenticateToken,
  requireSubscription,
  requireRole(['landlord'])
], async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id })
      .populate('interestedUsers.user', 'name email phone idProofDocument')
      .sort({ createdAt: -1 });

    res.json(properties);
  } catch (error) {
    console.error('My properties fetch error:', error);
    res.status(500).json({ message: 'Error fetching your properties' });
  }
});

// Get single property details
router.get('/:id', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email phone profileImage');
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Property fetch error:', error);
    res.status(500).json({ message: 'Error fetching property' });
  }
});

// Express interest in property
router.post('/:id/interest', [
  authenticateToken,
  requireSubscription,
  requireRole(['student', 'government_worker', 'family'])
], async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const alreadyInterested = property.interestedUsers.find(
      interested => interested.user.toString() === req.user._id.toString()
    );

    if (alreadyInterested) {
      return res.status(400).json({ message: 'You have already expressed interest in this property' });
    }

    if (!req.user.idProofDocument) {
      return res.status(400).json({ message: 'Please upload your ID proof document before expressing interest' });
    }

    property.interestedUsers.push({
      user: req.user._id,
      appliedAt: new Date()
    });

    await property.save();

    res.json({ message: 'Interest expressed successfully' });
  } catch (error) {
    console.error('Express interest error:', error);
    res.status(500).json({ message: 'Error expressing interest' });
  }
});

// Create new property
router.post('/', [
  authenticateToken,
  requireSubscription,
  requireRole(['landlord']),
  // ... validation
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('📥 Received property data:', req.body);

    const totalRooms = normalizeRoomCount(req.body.totalRooms, { fallback: 1, min: 1 });

    const propertyData = {
      ...req.body,
      owner: req.user._id,
      totalRooms,
      availableRooms: totalRooms,
      occupiedRooms: 0,
      availability: req.body.availability || 'available',
      address: {
        street: req.body.street,
        city: req.body.city,
        region: req.body.region,
        postalCode: req.body.postalCode,
        country: req.body.country
      }
    };

    if (req.body.latitude && req.body.longitude) {
      propertyData.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }

    const property = new Property(propertyData);
    await property.save();

    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email phone profileImage');

    res.status(201).json({
      message: 'Property created successfully',
      property: populatedProperty
    });
  } catch (error) {
    console.error('Property creation error:', error);
    res.status(500).json({ message: 'Error creating property' });
  }
});

// UPDATE property with photo management
router.put('/:id', [
  authenticateToken,
  requireSubscription,
  requireRole(['landlord'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Find the property
    const property = await Property.findOne({
      _id: id,
      owner: req.user._id
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }

    // Handle photo deletion
    if (req.body.deletePhotos && Array.isArray(req.body.deletePhotos)) {
      const photosToDelete = req.body.deletePhotos;
      
      // Filter out photos that should be deleted
      property.photos = property.photos.filter(photo => {
        // Check if this photo is in the delete list
        const shouldDelete = photosToDelete.some(deleteUrl => {
          // Compare the full URL or just the filename
          return photo === deleteUrl || photo.includes(deleteUrl.split('/').pop());
        });
        
        // If should delete, also try to remove from filesystem
        if (shouldDelete) {
          try {
            // Extract filename from URL
            const filename = photo.split('/').pop();
            if (filename) {
              const filePath = path.join(__dirname, '../uploads/properties', filename);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`✅ Deleted file: ${filename}`);
              }
            }
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
        
        return !shouldDelete;
      });
      
      console.log(`✅ Removed ${photosToDelete.length} photos`);
    }

    // Handle new photo additions
    if (req.body.newPhotos && Array.isArray(req.body.newPhotos)) {
      // Add new photos to the existing array
      const newPhotos = req.body.newPhotos;
      property.photos = [...property.photos, ...newPhotos];
      console.log(`✅ Added ${newPhotos.length} new photos`);
    }

    // Update other fields
    const fieldsToUpdate = [
      'title', 'description', 'propertyType', 'bedrooms', 'bathrooms',
      'rentPrice', 'houseNumber', 'availability', 'amenities',
      'dietPreference', 'dietExceptions', 'genderPreference'
    ];

    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        property[field] = updateData[field];
      }
    });

    // Update address
    if (updateData.address) {
      property.address = {
        ...property.address,
        ...updateData.address
      };
    }

    // Update location
    if (updateData.location) {
      property.location = updateData.location;
    }

    // Update totalRooms if provided
    if (updateData.totalRooms) {
      const newTotalRooms = normalizeRoomCount(updateData.totalRooms, { fallback: 1, min: 1 });
      const oldTotalRooms = property.totalRooms || 1;
      const occupiedRooms = property.occupiedRooms || 0;
      
      property.totalRooms = newTotalRooms;
      property.availableRooms = Math.max(0, newTotalRooms - occupiedRooms);
    }

    await property.save();

    const updatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email phone profileImage');

    console.log('✅ Property updated successfully:', {
      id: updatedProperty._id,
      title: updatedProperty.title,
      photoCount: updatedProperty.photos.length
    });

    res.json({
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    console.error('Property update error:', error);
    res.status(500).json({ message: 'Error updating property: ' + error.message });
  }
});

// Update property status
router.patch('/:id/status', [
  authenticateToken,
  requireSubscription,
  requireRole(['landlord'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    const validStatuses = ['available', 'rented', 'maintenance'];
    if (!validStatuses.includes(availability)) {
      return res.status(400).json({ message: 'Invalid status. Must be available, rented, or maintenance' });
    }

    const property = await Property.findOne({
      _id: id,
      owner: req.user._id
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }

    property.availability = availability;
    await property.save();

    res.json({
      message: `Property status updated to ${availability}`,
      property
    });
  } catch (error) {
    console.error('Property status update error:', error);
    res.status(500).json({ message: 'Error updating property status' });
  }
});

// Delete property
router.delete('/:id', [
  authenticateToken,
  requireSubscription,
  requireRole(['landlord'])
], async (req, res) => {
  try {
    const property = await Property.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }

    // Delete associated photos from filesystem
    if (property.photos && property.photos.length > 0) {
      property.photos.forEach(photo => {
        try {
          const filename = photo.split('/').pop();
          if (filename) {
            const filePath = path.join(__dirname, '../uploads/properties', filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Property deletion error:', error);
    res.status(500).json({ message: 'Error deleting property' });
  }
});

module.exports = router;