const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Ensure upload directories exist
const uploadDirs = ['uploads/properties', 'uploads/documents', 'uploads/profiles'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    if (req.route.path.includes('property')) {
      uploadPath += 'properties/';
    } else if (req.route.path.includes('document')) {
      uploadPath += 'documents/';
    } else if (req.route.path.includes('profile')) {
      uploadPath += 'profiles/';
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (req.route.path.includes('property')) {
    // Allow images and videos for properties
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed for properties'), false);
    }
  } else if (req.route.path.includes('document')) {
    // Allow PDF, images for documents
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed for documents'), false);
    }
  } else {
    // Allow images for profiles
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profiles'), false);
    }
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Upload property media (photos/videos)
router.post('/property-media', authenticateToken, upload.array('media', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const fileUrls = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/properties/${file.filename}`,
      type: file.mimetype.startsWith('image/') ? 'image' : 'video',
      size: file.size
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: fileUrls
    });
  } catch (error) {
    console.error('Property media upload error:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
});

// Upload ID proof document
router.post('/id-proof', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No document uploaded' });
    }

    const documentUrl = `/uploads/documents/${req.file.filename}`;

    // Update user's ID proof document
    await User.findByIdAndUpdate(req.user._id, {
      idProofDocument: documentUrl
    });

    res.json({
      message: 'ID proof document uploaded successfully',
      documentUrl
    });
  } catch (error) {
    console.error('ID proof upload error:', error);
    res.status(500).json({ message: 'Error uploading document' });
  }
});

// Upload profile image
router.post('/profile-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Update user's profile image
    await User.findByIdAndUpdate(req.user._id, {
      profileImage: imageUrl
    });

    res.json({
      message: 'Profile image uploaded successfully',
      imageUrl
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

module.exports = router;