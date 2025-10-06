const express = require('express');
const { upload, uploadToCloudinary } = require('../middleware/upload');
const { authenticateToken, requireAdminOrOwner } = require('../middleware/auth');

const router = express.Router();

// Upload single image
router.post('/single', authenticateToken, requireAdminOrOwner, upload.single('image'), async (req, res) => {
  try {
    console.log('Upload request received:', {
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file',
      user: req.user
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await uploadToCloudinary(req.file);
    
    res.json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message 
    });
  }
});

// Upload multiple images
router.post('/multiple', authenticateToken, requireAdminOrOwner, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const uploadPromises = req.files.map(file => uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);
    
    const imageUrls = results.map(result => result.secure_url);
    const publicIds = results.map(result => result.public_id);

    res.json({
      success: true,
      imageUrls,
      publicIds
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Delete image from Cloudinary
router.delete('/:publicId', authenticateToken, requireAdminOrOwner, async (req, res) => {
  try {
    const { publicId } = req.params;
    const cloudinary = require('../lib/cloudinary');
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(400).json({ error: 'Failed to delete image' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
