const express = require('express');
const { query } = require('../lib/db');
const router = express.Router();

// Get order tracking history
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const trackingData = await query(`
      SELECT * FROM order_tracking 
      WHERE order_id = $1 
      ORDER BY timestamp ASC
    `, [orderId]);

    res.json(trackingData.rows);
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    res.status(500).json({ error: 'Failed to fetch order tracking' });
  }
});

// Order status constants
const ORDER_STATUS = {
  IN_STORE: 'in_store',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered'
};

// Status information mapping
const STATUS_INFO = {
  [ORDER_STATUS.IN_STORE]: {
    location: 'Store Branch',
    description: 'Your order is being prepared at our store branch',
    icon: '🏪',
    color: '#3B82F6'
  },
  [ORDER_STATUS.ON_THE_WAY]: {
    location: 'On The Way',
    description: 'Your order is on the way to your location',
    icon: '🚚',
    color: '#F59E0B'
  },
  [ORDER_STATUS.DELIVERED]: {
    location: 'Delivered',
    description: 'Your order has arrived at your location',
    icon: '✅',
    color: '#10B981'
  }
};

// Add tracking update
router.post('/', async (req, res) => {
  try {
    const { orderId, status, location, description, metadata } = req.body;
    
    // Validate status
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: in_store, on_the_way, delivered' 
      });
    }
    
    // Check if order exists
    const orderCheck = await query(`
      SELECT id, shipping_method FROM orders WHERE id = $1
    `, [orderId]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get status information
    const statusInfo = STATUS_INFO[status];
    const finalLocation = location || statusInfo.location;
    const finalDescription = description || statusInfo.description;
    
    // Prepare metadata with status info
    const finalMetadata = {
      icon: statusInfo.icon,
      color: statusInfo.color,
      updatedBy: req.user?.id || 'system',
      updateReason: 'Status update',
      ...metadata
    };
    
    const result = await query(`
      INSERT INTO order_tracking (order_id, status, location, description, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [orderId, status, finalLocation, finalDescription, JSON.stringify(finalMetadata)]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding tracking update:', error);
    res.status(500).json({ error: 'Failed to add tracking update' });
  }
});

// Get order review
router.get('/review/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const reviewData = await query(`
      SELECT * FROM order_reviews 
      WHERE order_id = $1
    `, [orderId]);

    if (reviewData.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(reviewData.rows[0]);
  } catch (error) {
    console.error('Error fetching order review:', error);
    res.status(500).json({ error: 'Failed to fetch order review' });
  }
});

// Add order review (Universal - works for ALL orders)
router.post('/review', async (req, res) => {
  try {
    const { orderId, userId, rating, comment, reviewType = 'general' } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if order exists (any order type)
    const orderCheck = await query(`
      SELECT id, status, shipping_method FROM orders WHERE id = $1
    `, [orderId]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderCheck.rows[0];
    
    // Allow reviews for all order types and statuses
    // Only restrict if order is cancelled or refunded
    if (order.status === 'cancelled' || order.status === 'refunded') {
      return res.status(400).json({ 
        error: 'Reviews are not available for cancelled or refunded orders' 
      });
    }
    
    const result = await query(`
      INSERT INTO order_reviews (order_id, user_id, rating, comment, review_type)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (order_id, user_id) 
      DO UPDATE SET 
        rating = EXCLUDED.rating, 
        comment = EXCLUDED.comment, 
        review_type = EXCLUDED.review_type,
        updated_at = NOW()
      RETURNING *
    `, [orderId, userId, rating, comment, reviewType]);

    res.json({
      success: true,
      message: 'Review submitted successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding order review:', error);
    res.status(500).json({ error: 'Failed to add order review' });
  }
});

// Get delivery proof
router.get('/delivery-proof/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const proofData = await query(`
      SELECT * FROM delivery_proof 
      WHERE order_id = $1
    `, [orderId]);

    if (proofData.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery proof not found' });
    }

    res.json(proofData.rows[0]);
  } catch (error) {
    console.error('Error fetching delivery proof:', error);
    res.status(500).json({ error: 'Failed to fetch delivery proof' });
  }
});

// Add delivery proof
router.post('/delivery-proof', async (req, res) => {
  try {
    const { 
      orderId, 
      deliveryPersonName, 
      deliveryPersonContact, 
      proofImages, 
      deliveryNotes 
    } = req.body;
    
    // Check if order is COD before allowing delivery proof
    const orderCheck = await query(`
      SELECT shipping_method FROM orders WHERE id = $1
    `, [orderId]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (orderCheck.rows[0].shipping_method !== 'cod') {
      return res.status(400).json({ 
        error: 'Delivery proof is only available for Cash on Delivery (COD) orders' 
      });
    }
    
    const result = await query(`
      INSERT INTO delivery_proof (order_id, delivery_person_name, delivery_person_contact, proof_images, delivery_notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [orderId, deliveryPersonName, deliveryPersonContact, proofImages, deliveryNotes]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding delivery proof:', error);
    res.status(500).json({ error: 'Failed to add delivery proof' });
  }
});

// Verify delivery proof (admin function)
router.put('/delivery-proof/:proofId/verify', async (req, res) => {
  try {
    const { proofId } = req.params;
    const { verifiedBy } = req.body;
    
    const result = await query(`
      UPDATE delivery_proof 
      SET verified_by = $1, verified_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [verifiedBy, proofId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery proof not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error verifying delivery proof:', error);
    res.status(500).json({ error: 'Failed to verify delivery proof' });
  }
});

// Update order status (simplified endpoint for 3-status system)
router.put('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: in_store, on_the_way, delivered' 
      });
    }
    
    // Check if order exists
    const orderCheck = await query(`
      SELECT id FROM orders WHERE id = $1
    `, [orderId]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get status information
    const statusInfo = STATUS_INFO[status];
    
    // Prepare metadata
    const metadata = {
      icon: statusInfo.icon,
      color: statusInfo.color,
      updatedBy: req.user?.id || 'admin',
      updateReason: 'Status update by administrator',
      timestamp: new Date().toISOString()
    };
    
    const result = await query(`
      INSERT INTO order_tracking (order_id, status, location, description, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      orderId, 
      status, 
      statusInfo.location, 
      statusInfo.description, 
      JSON.stringify(metadata)
    ]);

    res.json({
      success: true,
      message: `Order status updated to ${statusInfo.location}`,
      tracking: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Get current order status
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await query(`
      SELECT * FROM order_tracking 
      WHERE order_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 1
    `, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No tracking information found for this order' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching current order status:', error);
    res.status(500).json({ error: 'Failed to fetch current order status' });
  }
});

// Get all reviews for an order (Universal)
router.get('/reviews/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await query(`
      SELECT 
        r.*,
        u.email as user_email,
        u.user_metadata->>'full_name' as user_name
      FROM order_reviews r
      LEFT JOIN auth.users u ON r.user_id = u.id
      WHERE r.order_id = $1
      ORDER BY r.created_at DESC
    `, [orderId]);

    res.json({
      success: true,
      reviews: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching order reviews:', error);
    res.status(500).json({ error: 'Failed to fetch order reviews' });
  }
});

// Get all reviews by a user (Universal)
router.get('/user-reviews/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await query(`
      SELECT 
        r.*,
        o.order_number,
        o.total_amount,
        o.status as order_status
      FROM order_reviews r
      JOIN orders o ON r.order_id = o.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      reviews: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

// Get review statistics for an order
router.get('/review-stats/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM order_reviews 
      WHERE order_id = $1
    `, [orderId]);

    const stats = result.rows[0];
    
    res.json({
      success: true,
      statistics: {
        totalReviews: parseInt(stats.total_reviews),
        averageRating: parseFloat(stats.average_rating || 0).toFixed(1),
        ratingDistribution: {
          fiveStar: parseInt(stats.five_star),
          fourStar: parseInt(stats.four_star),
          threeStar: parseInt(stats.three_star),
          twoStar: parseInt(stats.two_star),
          oneStar: parseInt(stats.one_star)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching review statistics:', error);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
});

// Update database schema to support review types
router.post('/migrate-reviews', async (req, res) => {
  try {
    // Add review_type column if it doesn't exist
    await query(`
      ALTER TABLE order_reviews 
      ADD COLUMN IF NOT EXISTS review_type VARCHAR(50) DEFAULT 'general'
    `);

    // Add index for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_order_reviews_type 
      ON order_reviews(review_type)
    `);

    res.json({
      success: true,
      message: 'Review system migrated successfully'
    });
  } catch (error) {
    console.error('Error migrating review system:', error);
    res.status(500).json({ error: 'Failed to migrate review system' });
  }
});

module.exports = router;
