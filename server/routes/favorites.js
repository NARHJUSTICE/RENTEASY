const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Property = require('../models/Property');
const { authenticateToken } = require('../middleware/auth');

// ✅ Get user's favorites
router.get('/', authenticateToken, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('property')
      .sort({ createdAt: -1 });
    
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Error fetching favorites' });
  }
});

// ✅ Check if a property is favorited
router.get('/check/:propertyId', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const favorite = await Favorite.findOne({
      user: req.user._id,
      property: propertyId
    });
    
    res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ message: 'Error checking favorite' });
  }
});

// ✅ Toggle favorite (add/remove)
router.post('/toggle/:propertyId', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      property: propertyId
    });
    
    if (existingFavorite) {
      // Remove favorite
      await existingFavorite.deleteOne();
      return res.json({ 
        message: 'Removed from favorites', 
        isFavorited: false 
      });
    } else {
      // Add favorite
      const favorite = new Favorite({
        user: req.user._id,
        property: propertyId
      });
      await favorite.save();
      return res.json({ 
        message: 'Added to favorites', 
        isFavorited: true 
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Error toggling favorite' });
  }
});

module.exports = router;