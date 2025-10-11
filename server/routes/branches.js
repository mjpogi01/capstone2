const express = require('express');
const { query } = require('../lib/db');
const { authenticateSupabaseToken, requireRole } = require('../middleware/supabaseAuth');

const router = express.Router();

// Get all branches
router.get('/', authenticateSupabaseToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT id, name, address, city, phone, email, created_at
      FROM branches 
      ORDER BY name
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get branch by ID
router.get('/:id', authenticateSupabaseToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`
      SELECT id, name, address, city, phone, email, created_at
      FROM branches 
      WHERE id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

module.exports = router;
