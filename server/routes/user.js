const express = require('express');
const { pool } = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's default address
router.get('/address', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM user_addresses 
      WHERE user_id = $1 
      ORDER BY is_default DESC, created_at DESC 
      LIMIT 1
    `, [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No address found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user address:', error);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
});

// Get all user addresses
router.get('/addresses', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM user_addresses 
      WHERE user_id = $1 
      ORDER BY is_default DESC, created_at DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Save user's address
router.post('/address', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone, streetAddress, barangay, city, province, postalCode, address, isDefault = true } = req.body;

    // Check if user already has an address
    const { rows: existingAddresses } = await pool.query(`
      SELECT id FROM user_addresses WHERE user_id = $1
    `, [req.user.id]);

    let result;
    if (existingAddresses.length > 0) {
      // Update existing address
      const { rows } = await pool.query(`
        UPDATE user_addresses SET 
          full_name = $2,
          phone = $3,
          street_address = $4,
          barangay = $5,
          city = $6,
          province = $7,
          postal_code = $8,
          address = $9,
          is_default = $10,
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `, [req.user.id, fullName, phone, streetAddress, barangay, city, province, postalCode, address, isDefault]);

      result = rows[0];
    } else {
      // Create new address
      const { rows } = await pool.query(`
        INSERT INTO user_addresses (
          user_id, full_name, phone, street_address, barangay, 
          city, province, postal_code, address, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [req.user.id, fullName, phone, streetAddress, barangay, city, province, postalCode, address, isDefault]);

      result = rows[0];
    }

    res.json(result);
  } catch (error) {
    console.error('Error saving user address:', error);
    res.status(500).json({ error: 'Failed to save address' });
  }
});

// Update specific address by ID
router.put('/address/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, streetAddress, barangay, city, province, postalCode, address, isDefault } = req.body;

    const { rows } = await pool.query(`
      UPDATE user_addresses SET 
        full_name = $2,
        phone = $3,
        street_address = $4,
        barangay = $5,
        city = $6,
        province = $7,
        postal_code = $8,
        address = $9,
        is_default = $10,
        updated_at = NOW()
      WHERE id = $1 AND user_id = $11
      RETURNING *
    `, [id, fullName, phone, streetAddress, barangay, city, province, postalCode, address, isDefault, req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating user address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// Delete address by ID
router.delete('/address/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(`
      DELETE FROM user_addresses 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting user address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// Set default address
router.patch('/address/:id/default', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // First, unset all default addresses for this user
    await pool.query(`
      UPDATE user_addresses SET is_default = false 
      WHERE user_id = $1
    `, [req.user.id]);

    // Then set the selected address as default
    const { rows } = await pool.query(`
      UPDATE user_addresses SET is_default = true 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

module.exports = router;
