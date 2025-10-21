const express = require('express');
const { upload, uploadToCloudinary } = require('../middleware/upload');
const { authenticateSupabaseToken, requireAdminOrOwner } = require('../middleware/supabaseAuth');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

// Test route to verify the endpoint is working (no auth required)
router.get('/test', (req, res) => {
  res.json({ message: 'Design upload endpoint is working' });
});

// Upload design files for an order
router.post('/:orderId', authenticateSupabaseToken, requireAdminOrOwner, upload.array('designFiles', 10), async (req, res) => {
  console.log('🎨 Design upload route hit!');
  try {
    const { orderId } = req.params;
    const userId = req.user.id; // User performing the upload
    
    console.log(`🎨 Design upload request from user ${userId} for order ${orderId}`);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No design files provided' });
    }

    console.log(`Uploading design files for order ${orderId}:`, {
      fileCount: req.files.length,
      files: req.files.map(f => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size
      }))
    });

    // Upload files to Cloudinary with design-specific folder
    console.log('🎨 Starting Cloudinary uploads...');
    let results;
    try {
      const uploadPromises = req.files.map((file, index) => {
        console.log(`🎨 Uploading file ${index + 1}/${req.files.length}: ${file.originalname}`);
        return uploadToCloudinary(file, 'yohanns-designs');
      });
      
      results = await Promise.all(uploadPromises);
      console.log('🎨 Cloudinary uploads completed:', results.length, 'files');
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload error:', cloudinaryError);
      return res.status(500).json({ 
        error: 'Failed to upload files to Cloudinary',
        details: cloudinaryError.message 
      });
    }
    
    const designFiles = results.map((result, index) => ({
      filename: req.files[index].originalname,
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date().toISOString()
    }));

    // Update the order with design files (status is managed by the workflow)
    console.log('🎨 Updating order in database...');
    console.log('🎨 Order ID:', orderId);
    console.log('🎨 Design files to save:', designFiles.length);
    
    // Only update design files, not the status (status is managed by the workflow)
    const { data, error } = await supabase
      .from('orders')
      .update({
        design_files: designFiles,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('❌ Database update error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        error: 'Failed to update order with design files',
        details: error.message 
      });
    }

    if (!data || data.length === 0) {
      console.error('❌ Order not found after update attempt');
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`Successfully uploaded ${designFiles.length} design files for order ${orderId}`);

    res.json({
      success: true,
      message: 'Design files uploaded successfully',
      designFiles,
      order: data[0]
    });

  } catch (error) {
    console.error('❌ Design upload error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to upload design files',
      details: error.message 
    });
  }
});

// Get design files for an order
router.get('/:orderId', authenticateSupabaseToken, requireAdminOrOwner, async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select('design_files')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching design files:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch design files',
        details: error.message 
      });
    }

    if (!data) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      designFiles: data.design_files || []
    });

  } catch (error) {
    console.error('Error fetching design files:', error);
    res.status(500).json({ 
      error: 'Failed to fetch design files',
      details: error.message 
    });
  }
});

// Delete a design file
router.delete('/:orderId/:publicId', authenticateSupabaseToken, requireAdminOrOwner, async (req, res) => {
  try {
    const { orderId } = req.params;
    // Decode the publicId since it's URL-encoded to handle slashes
    const publicId = decodeURIComponent(req.params.publicId);
    const cloudinary = require('../lib/cloudinary');
    
    console.log('🗑️ Deleting design file:', { orderId, publicId });
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result !== 'ok') {
      return res.status(400).json({ error: 'Failed to delete file from Cloudinary' });
    }

    // Get current design files
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('design_files')
      .eq('id', orderId)
      .single();

    if (fetchError || !orderData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Remove the deleted file from the design_files array
    const updatedDesignFiles = (orderData.design_files || []).filter(
      file => file.publicId !== publicId
    );

    // Update the order
    const { error: updateError } = await supabase
      .from('orders')
      .update({ design_files: updatedDesignFiles })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order after file deletion:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update order after file deletion',
        details: updateError.message 
      });
    }

    res.json({
      success: true,
      message: 'Design file deleted successfully',
      remainingFiles: updatedDesignFiles.length
    });

  } catch (error) {
    console.error('Delete design file error:', error);
    res.status(500).json({ 
      error: 'Failed to delete design file',
      details: error.message 
    });
  }
});

module.exports = router;
