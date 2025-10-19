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

// Add tracking update
router.post('/', async (req, res) => {
  try {
    const { orderId, status, location, description, metadata } = req.body;
    
    // Check if order is COD before allowing tracking
    const orderCheck = await query(`
      SELECT shipping_method FROM orders WHERE id = $1
    `, [orderId]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (orderCheck.rows[0].shipping_method !== 'cod') {
      return res.status(400).json({ 
        error: 'Order tracking is only available for Cash on Delivery (COD) orders' 
      });
    }
    
    const result = await query(`
      INSERT INTO order_tracking (order_id, status, location, description, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [orderId, status, location, description, JSON.stringify(metadata || {})]);

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

// Add order review
router.post('/review', async (req, res) => {
  try {
    const { orderId, userId, rating, comment } = req.body;
    
    // Check if order is COD before allowing review
    const orderCheck = await query(`
      SELECT shipping_method FROM orders WHERE id = $1
    `, [orderId]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (orderCheck.rows[0].shipping_method !== 'cod') {
      return res.status(400).json({ 
        error: 'Order reviews are only available for Cash on Delivery (COD) orders' 
      });
    }
    
    const result = await query(`
      INSERT INTO order_reviews (order_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (order_id, user_id) 
      DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
      RETURNING *
    `, [orderId, userId, rating, comment]);

    res.json(result.rows[0]);
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

module.exports = router;
