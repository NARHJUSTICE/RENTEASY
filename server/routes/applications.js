const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Property = require('../models/Property');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sendApplicationStatusEmail, sendNewApplicationEmail, sendIDVerificationEmail } = require('../utils/email');

// ✅ Try to import NotificationHelper
let NotificationHelper;
try {
  NotificationHelper = require('../utils/notificationHelper');
  console.log('✅ [NOTIFICATION] NotificationHelper loaded successfully');
} catch (error) {
  console.error('❌ [NOTIFICATION] NotificationHelper not found:', error.message);
  NotificationHelper = null;
}

// Get applications for a landlord's properties
router.get('/landlord/applications', authenticateToken, requireRole(['landlord']), async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id });
    const propertyIds = properties.map(p => p._id);
    
    const applications = await Application.find({ 
      property: { $in: propertyIds } 
    })
    .populate('property', 'title address rentPrice photos totalRooms availableRooms occupiedRooms')
    .populate('tenant', 'name email phone profileImage')
    .sort({ createdAt: -1 });
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
});

// Get applications for a tenant
router.get('/tenant/applications', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ tenant: req.user._id })
      .populate('property', 'title address rentPrice photos totalRooms availableRooms occupiedRooms')
      .sort({ createdAt: -1 });
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching tenant applications:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
});

// Create an application (tenant applies for a property)
router.post('/:propertyId/apply', authenticateToken, requireRole(['student', 'government_worker', 'family']), async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { idProofDocument, moveInDate, rentalDuration, occupation, monthlyIncome, message, phone } = req.body;
    
    console.log('📝 [APPLY] Property ID:', propertyId);
    console.log('📝 [APPLY] User ID:', req.user._id);
    console.log('📝 [APPLY] Move-in Date:', moveInDate);
    
    // Check if property exists
    const property = await Property.findById(propertyId).populate('owner', 'name email');
    if (!property) {
      console.log('❌ [APPLY] Property not found');
      return res.status(404).json({ message: 'Property not found' });
    }
    
    console.log('📢 [APPLY] Property owner ID:', property.owner._id);
    console.log('📢 [APPLY] Property owner name:', property.owner.name);
    console.log('📢 [APPLY] Tenant ID:', req.user._id);
    console.log('📢 [APPLY] Tenant name:', req.user.name);
    
    // Check if property has available rooms
    const totalRooms = property.totalRooms || 1;
    const occupiedRooms = property.occupiedRooms || 0;
    const availableRooms = Math.max(0, totalRooms - occupiedRooms);
    
    console.log(`📝 [APPLY] Total Rooms: ${totalRooms}, Occupied: ${occupiedRooms}, Available: ${availableRooms}`);
    
    if (availableRooms <= 0) {
      console.log('❌ [APPLY] No rooms available');
      return res.status(400).json({ message: 'No rooms available for this property' });
    }
    
    // Check if user already applied
    const existingApplication = await Application.findOne({
      property: propertyId,
      tenant: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });
    
    if (existingApplication) {
      console.log('⚠️ [APPLY] User already applied');
      return res.status(400).json({ message: 'You have already applied for this property' });
    }
    
    // Check if ID proof document is provided
    if (!idProofDocument || !idProofDocument.url) {
      console.log('❌ [APPLY] No ID proof provided');
      return res.status(400).json({ message: 'ID proof document is required' });
    }
    
    const application = new Application({
      property: propertyId,
      tenant: req.user._id,
      idProofDocument: {
        url: idProofDocument.url,
        publicId: idProofDocument.publicId || '',
        fileName: idProofDocument.fileName || '',
        uploadedAt: new Date()
      },
      moveInDate: moveInDate || null,
      rentalDuration: rentalDuration || '6',
      occupation: occupation || '',
      monthlyIncome: monthlyIncome || '',
      message: message || '',
      phone: phone || req.user.phone,
      idStatus: 'pending',
      status: 'pending'
    });
    
    await application.save();
    console.log('✅ [APPLY] Application created successfully');

    // ✅ CREATE NOTIFICATION FOR LANDLORD
    if (NotificationHelper) {
      try {
        console.log('📢 [NOTIFICATION] Creating notification for landlord:', property.owner._id.toString());
        console.log('📢 [NOTIFICATION] Data:', {
          type: 'new_application',
          message: `New application received for "${property.title}" from ${req.user.name}`,
          link: `/applications`,
          priority: 'warning',
          data: {
            propertyId: property._id,
            applicationId: application._id,
            applicantName: req.user.name
          }
        });
        
        const landlordNotification = await NotificationHelper.sendToUser(property.owner._id, {
          type: 'new_application',
          message: `New application received for "${property.title}" from ${req.user.name}`,
          link: `/applications`,
          priority: 'warning',
          data: {
            propertyId: property._id,
            applicationId: application._id,
            applicantName: req.user.name
          }
        });
        
        if (landlordNotification) {
          console.log('✅ [NOTIFICATION] Landlord notification created successfully! ID:', landlordNotification._id);
        } else {
          console.log('❌ [NOTIFICATION] Landlord notification creation failed (returned null)');
        }
      } catch (notifError) {
        console.error('❌ [NOTIFICATION] Error creating landlord notification:', notifError.message);
        console.error('❌ [NOTIFICATION] Full error:', notifError);
      }
    } else {
      console.log('❌ [NOTIFICATION] NotificationHelper not available, skipping notifications');
    }

    // ✅ CREATE NOTIFICATION FOR TENANT (application submitted)
    if (NotificationHelper) {
      try {
        console.log('📢 [NOTIFICATION] Creating notification for tenant:', req.user._id.toString());
        const tenantNotification = await NotificationHelper.sendToUser(req.user._id, {
          type: 'application_update',
          message: `Your application for "${property.title}" has been submitted and is pending review.`,
          link: `/my-applications`,
          priority: 'info',
          data: {
            propertyId: property._id,
            applicationId: application._id
          }
        });
        if (tenantNotification) {
          console.log('✅ [NOTIFICATION] Tenant notification created successfully! ID:', tenantNotification._id);
        } else {
          console.log('❌ [NOTIFICATION] Tenant notification creation failed (returned null)');
        }
      } catch (notifError) {
        console.error('❌ [NOTIFICATION] Error creating tenant notification:', notifError.message);
      }
    }
    
    // Send email notification to landlord
    try {
      const landlord = await User.findById(property.owner);
      if (landlord && landlord.email) {
        await sendNewApplicationEmail(
          landlord.email,
          landlord.name || 'Landlord',
          req.user.name,
          property.title
        );
        console.log('📧 [APPLY] Landlord email sent to:', landlord.email);
      }
    } catch (emailError) {
      console.error('❌ [APPLY] Email error:', emailError.message);
    }
    
    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('❌ [APPLY] Error creating application:', error);
    res.status(500).json({ message: 'Error creating application: ' + error.message });
  }
});

// Landlord reviews the application (approve/reject)
router.patch('/:applicationId/review', authenticateToken, requireRole(['landlord']), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    
    console.log('📝 [REVIEW] Application ID:', applicationId);
    console.log('📝 [REVIEW] Status:', status);
    
    const application = await Application.findById(applicationId)
      .populate('property', 'owner totalRooms occupiedRooms availableRooms title')
      .populate('tenant', 'name email');
    
    if (!application) {
      console.log('❌ [REVIEW] Application not found');
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if landlord owns this property
    if (application.property.owner.toString() !== req.user._id.toString()) {
      console.log('❌ [REVIEW] Not authorized');
      return res.status(403).json({ message: 'Not authorized to review this application' });
    }
    
    // Update application status
    application.status = status;
    if (notes) {
      application.reviewNotes = notes;
    }
    application.updatedAt = new Date();
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;
    
    // Save the date based on status
    if (status === 'approved') {
      application.approvedAt = new Date();
    } else if (status === 'rejected') {
      application.rejectedAt = new Date();
    } else if (status === 'probation') {
      application.probationAt = new Date();
    }
    
    // If approved, update room availability
    if (status === 'approved') {
      const property = await Property.findById(application.property._id);
      if (property) {
        if (!property.totalRooms || property.totalRooms < 1) {
          property.totalRooms = 1;
        }
        property.occupiedRooms = (property.occupiedRooms || 0) + 1;
        property.availableRooms = Math.max(0, (property.totalRooms || 1) - property.occupiedRooms);
        await property.save();
        console.log(`✅ [REVIEW] Room occupied. Total: ${property.totalRooms}, Occupied: ${property.occupiedRooms}, Available: ${property.availableRooms}`);
      }
    }
    
    // If rejected, release the room (only if it was previously approved)
    if (status === 'rejected' || status === 'cancelled') {
      const property = await Property.findById(application.property._id);
      if (property) {
        const previousStatus = application.status;
        if (previousStatus === 'approved') {
          property.occupiedRooms = Math.max(0, (property.occupiedRooms || 0) - 1);
          property.availableRooms = Math.max(0, (property.totalRooms || 1) - property.occupiedRooms);
          await property.save();
          console.log(`✅ [REVIEW] Room released. Total: ${property.totalRooms}, Occupied: ${property.occupiedRooms}, Available: ${property.availableRooms}`);
        }
      }
    }
    
    await application.save();
    
    // ✅ CREATE NOTIFICATION FOR TENANT about status update
    if (NotificationHelper) {
      const statusMessages = {
        'approved': `Your application for "${application.property.title}" has been APPROVED! 🎉`,
        'rejected': `Your application for "${application.property.title}" has been rejected.`,
        'cancelled': `Your application for "${application.property.title}" has been cancelled.`,
        'probation': `Your application for "${application.property.title}" is on probation period.`
      };

      try {
        console.log('📢 [NOTIFICATION] Creating notification for tenant about review:', application.tenant._id.toString());
        const reviewNotification = await NotificationHelper.sendToUser(application.tenant._id, {
          type: 'application_update',
          message: statusMessages[status] || `Your application for "${application.property.title}" has been updated to ${status}.`,
          link: `/my-applications`,
          priority: status === 'approved' ? 'info' : 'warning',
          data: {
            applicationId: application._id,
            propertyId: application.property._id,
            status: status
          }
        });
        if (reviewNotification) {
          console.log('✅ [NOTIFICATION] Review notification created successfully!');
        }
      } catch (notifError) {
        console.error('❌ [NOTIFICATION] Error creating review notification:', notifError.message);
      }
    }
    
    // Send email notification to tenant
    try {
      if (application.tenant && application.tenant.email) {
        await sendApplicationStatusEmail(
          application.tenant.email,
          application.tenant.name || 'Tenant',
          application.property.title || 'Property',
          status,
          notes
        );
        console.log(`📧 [REVIEW] Tenant email sent for ${status} to:`, application.tenant.email);
      }
    } catch (emailError) {
      console.error('❌ [REVIEW] Email error:', emailError.message);
    }
    
    res.json({
      message: `Application ${status} successfully`,
      application
    });
  } catch (error) {
    console.error('❌ [REVIEW] Error reviewing application:', error);
    res.status(500).json({ message: 'Error reviewing application: ' + error.message });
  }
});

// Landlord verifies ID proof (separate from application review)
router.patch('/:applicationId/verify-id', authenticateToken, requireRole(['landlord']), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { idStatus, idVerificationNotes } = req.body;
    
    console.log('📝 [VERIFY-ID] Application ID:', applicationId);
    console.log('📝 [VERIFY-ID] ID Status:', idStatus);
    
    const application = await Application.findById(applicationId)
      .populate('property', 'owner title')
      .populate('tenant', 'name email');
    
    if (!application) {
      console.log('❌ [VERIFY-ID] Application not found');
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if landlord owns this property
    if (application.property.owner.toString() !== req.user._id.toString()) {
      console.log('❌ [VERIFY-ID] Not authorized');
      return res.status(403).json({ message: 'Not authorized to verify this ID' });
    }
    
    // Update ID verification status (separate from application status)
    application.idStatus = idStatus;
    if (idVerificationNotes) {
      application.idVerificationNotes = idVerificationNotes;
    }
    application.updatedAt = new Date();
    
    if (idStatus === 'probation') {
      const probationDate = new Date();
      probationDate.setDate(probationDate.getDate() + 7);
      application.probationEndDate = probationDate;
    }
    
    await application.save();
    
    // Update the tenant's user record for ID verification
    if (application.tenant && application.tenant._id) {
      await User.findByIdAndUpdate(application.tenant._id, { 
        idVerificationStatus: idStatus 
      });
      console.log(`✅ [VERIFY-ID] Updated tenant ${application.tenant.name} ID status to: ${idStatus}`);
    }
    
    const updatedUser = await User.findById(application.tenant._id);
    
    // ✅ CREATE NOTIFICATION FOR TENANT about ID verification
    if (NotificationHelper) {
      const idStatusMessages = {
        'approved': `Your ID verification has been APPROVED! ✅`,
        'rejected': `Your ID verification has been rejected. Please upload a new ID.`,
        'pending': `Your ID verification is pending review.`,
        'probation': `Your ID verification is on probation period.`
      };

      try {
        console.log('📢 [NOTIFICATION] Creating notification for tenant about ID verification:', application.tenant._id.toString());
        const idNotification = await NotificationHelper.sendToUser(application.tenant._id, {
          type: 'id_verification',
          message: idStatusMessages[idStatus] || `Your ID verification status has been updated to ${idStatus}.`,
          link: `/profile`,
          priority: idStatus === 'approved' ? 'info' : 'warning',
          data: {
            applicationId: application._id,
            status: idStatus
          }
        });
        if (idNotification) {
          console.log('✅ [NOTIFICATION] ID verification notification created successfully!');
        }
      } catch (notifError) {
        console.error('❌ [NOTIFICATION] Error creating ID verification notification:', notifError.message);
      }
    }
    
    // Send email notification for ID verification
    try {
      if (application.tenant && application.tenant.email) {
        await sendIDVerificationEmail(
          application.tenant.email,
          application.tenant.name || 'Tenant',
          idStatus,
          idVerificationNotes
        );
        console.log(`📧 [VERIFY-ID] ID verification email sent for ${idStatus} to:`, application.tenant.email);
      }
    } catch (emailError) {
      console.error('❌ [VERIFY-ID] Email error:', emailError.message);
    }
    
    res.json({
      message: `ID verification ${idStatus}`,
      application,
      tenant: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        idVerificationStatus: updatedUser.idVerificationStatus
      }
    });
  } catch (error) {
    console.error('❌ [VERIFY-ID] Error verifying ID:', error);
    res.status(500).json({ message: 'Error verifying ID: ' + error.message });
  }
});

// Get application details
router.get('/:applicationId', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('property', 'title address rentPrice photos totalRooms availableRooms occupiedRooms owner')
      .populate('tenant', 'name email phone profileImage');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Error fetching application' });
  }
});

// ✅ WITHDRAW APPLICATION - Fixed version
router.patch('/:applicationId/withdraw', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await Application.findOne({
      _id: applicationId,
      tenant: req.user._id
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only allow withdrawal if status is 'pending'
    if (application.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending applications can be withdrawn' 
      });
    }

    // Update application status to 'withdrawn'
    application.status = 'withdrawn';
    application.withdrawnAt = new Date();
    await application.save();

    // Create notification for landlord (if NotificationHelper exists and property is populated)
    if (NotificationHelper) {
      try {
        // Get property to get owner info
        const property = await Property.findById(application.property).populate('owner', 'name email');
        if (property && property.owner) {
          await NotificationHelper.sendToUser(property.owner._id, {
            type: 'application_update',
            message: `${req.user.name} has withdrawn their application for "${property.title}"`,
            link: `/applications`,
            priority: 'info',
            data: {
              applicationId: application._id,
              propertyId: property._id,
              status: 'withdrawn'
            }
          });
        }
      } catch (notifError) {
        console.error('Notification error:', notifError);
        // Don't fail the request if notification fails
      }
    }

    res.json({
      message: 'Application withdrawn successfully',
      application
    });
  } catch (error) {
    console.error('❌ Error withdrawing application:', error);
    res.status(500).json({ message: 'Error withdrawing application: ' + error.message });
  }
});

// ✅ DELETE APPLICATION - Fixed version
router.delete('/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await Application.findOne({
      _id: applicationId,
      tenant: req.user._id
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only allow deletion if status is 'withdrawn' or 'rejected' or 'cancelled'
    const allowedStatuses = ['withdrawn', 'rejected', 'cancelled'];
    if (!allowedStatuses.includes(application.status)) {
      return res.status(400).json({ 
        message: 'Only withdrawn, rejected, or cancelled applications can be deleted' 
      });
    }

    await Application.findByIdAndDelete(applicationId);

    res.json({
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting application:', error);
    res.status(500).json({ message: 'Error deleting application: ' + error.message });
  }
});

module.exports = router;