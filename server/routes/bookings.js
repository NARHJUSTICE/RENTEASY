const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const Application = require('../models/Application');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ✅ Create a booking request (tenant)
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { propertyId, startDate, endDate, message } = req.body;
    
    console.log('🔍 Booking request received');
    console.log('🔍 User:', req.user._id, req.user.role);
    console.log('🔍 Property:', propertyId);
    
    // ✅ Check if user is a tenant (not landlord)
    if (req.user.role === 'landlord') {
      return res.status(403).json({ message: 'Landlords cannot request bookings' });
    }
    
    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check if property is available
    if (property.availability !== 'available') {
      return res.status(400).json({ message: 'Property is not available' });
    }
    
    // ✅ FIXED: Check if tenant has verified ID (approved or verified)
    if (req.user.idVerificationStatus !== 'verified' && req.user.idVerificationStatus !== 'approved') {
      return res.status(400).json({ message: 'Please verify your ID first' });
    }
    
    // Check if tenant already has a pending/active booking for this property
    const existingBooking = await Booking.findOne({
      property: propertyId,
      tenant: req.user._id,
      status: { $in: ['pending', 'approved', 'active'] }
    });
    
    if (existingBooking) {
      return res.status(400).json({ message: 'You already have a booking request for this property' });
    }
    
    // Calculate total price (rent per month * number of months)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end - start) / (1000 * 60 * 60 * 24 * 30);
    const totalPrice = Math.ceil(months) * property.rentPrice;
    
    const booking = new Booking({
      property: propertyId,
      tenant: req.user._id,
      landlord: property.owner,
      startDate: start,
      endDate: end,
      totalPrice,
      message: message || '',
      status: 'pending'
    });
    
    await booking.save();
    
    // Populate the booking
    await booking.populate('property', 'title address rentPrice');
    await booking.populate('tenant', 'name email phone');
    
    console.log('✅ Booking created successfully');
    
    res.status(201).json({
      message: 'Booking request submitted successfully',
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking: ' + error.message });
  }
});

// Get tenant's bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'landlord') {
      return res.status(403).json({ message: 'Landlords cannot view tenant bookings here' });
    }
    
    const bookings = await Booking.find({ tenant: req.user._id })
      .populate('property', 'title address rentPrice photos')
      .populate('landlord', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Get landlord's bookings (for their properties)
router.get('/landlord/bookings', authenticateToken, requireRole(['landlord']), async (req, res) => {
  try {
    const bookings = await Booking.find({ landlord: req.user._id })
      .populate('property', 'title address rentPrice photos')
      .populate('tenant', 'name email phone profileImage')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching landlord bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Update booking status (landlord)
router.patch('/:bookingId/status', authenticateToken, requireRole(['landlord']), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    const booking = await Booking.findById(bookingId)
      .populate('property', 'title owner');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if landlord owns this property
    if (booking.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    booking.status = status;
    booking.updatedAt = new Date();
    
    // If approved, update property availability
    if (status === 'approved') {
      await Property.findByIdAndUpdate(booking.property._id, { availability: 'rented' });
    }
    
    // If cancelled or rejected, make property available again
    if (status === 'cancelled' || status === 'rejected') {
      await Property.findByIdAndUpdate(booking.property._id, { availability: 'available' });
    }
    
    await booking.save();
    
    res.json({
      message: `Booking ${status} successfully`,
      booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Error updating booking' });
  }
});

// Get booking details
router.get('/:bookingId', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('property', 'title address rentPrice photos owner')
      .populate('tenant', 'name email phone profileImage')
      .populate('landlord', 'name email phone');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Error fetching booking' });
  }
});

module.exports = router;