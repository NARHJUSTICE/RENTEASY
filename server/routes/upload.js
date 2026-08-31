const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Ensure upload directory exists (for temporary local storage)
const uploadDir = path.join(__dirname, '..', 'uploads', 'properties');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for temporary local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Upload property media to Cloudinary
router.post('/property-media', authenticateToken, upload.array('media', 10), async (req, res) => {
  try {
    console.log('📊 Upload request received');
    console.log('📊 Files:', req.files);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      try {
        // Upload to Cloudinary using unsigned preset
        const result = await cloudinary.uploader.upload(file.path, {
          upload_preset: 'renteasy_unsigned',
          folder: 'renteasy/properties',
          resource_type: 'auto'
        });

        uploadedFiles.push({
          url: result.secure_url,
          publicId: result.public_id,
          type: result.resource_type,
          originalName: file.originalname,
          size: file.size
        });

        // Clean up local file after upload
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.log('Could not delete local file:', err.message);
        }
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ message: 'Failed to upload files to Cloudinary' });
    }

    res.json({
      message: 'Files uploaded successfully to Cloudinary',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload files: ' + error.message });
  }
});

module.exports = router;