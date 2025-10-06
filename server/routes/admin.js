const express = require('express');
const { query } = require('../lib/db');
const { authenticateToken, requireAdminOrOwner, requireOwner, requireBranchAccess } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateToken);

// Get dashboard metrics (admin or owner)
router.get('/dashboard', requireAdminOrOwner, async (req, res) => {
  try {
    // Get basic metrics
    const metrics = {
      totalSales: 24810,
      totalCustomers: 105,
      totalOrders: 1500,
      // Add more metrics based on your business logic
    };

    res.json({ metrics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all branches (owner only)
router.get('/branches', requireOwner, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM branches ORDER BY id');
    res.json({ branches: rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get users by role (admin or owner)
router.get('/users', requireAdminOrOwner, async (req, res) => {
  try {
    const { role, branch_id } = req.query;
    let queryText = 'SELECT id, email, first_name, last_name, role, branch_id, created_at FROM users';
    let params = [];
    let paramCount = 0;

    const conditions = [];
    
    if (role) {
      paramCount++;
      conditions.push(`role = $${paramCount}`);
      params.push(role);
    }

    if (branch_id && req.user.role === 'admin') {
      paramCount++;
      conditions.push(`branch_id = $${paramCount}`);
      params.push(req.user.branch_id);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY created_at DESC';

    const { rows } = await query(queryText, params);
    res.json({ users: rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create admin user (owner only)
router.post('/users', requireOwner, async (req, res) => {
  try {
    const { email, password, first_name, last_name, branch_id } = req.body;

    if (!email || !password || !branch_id) {
      return res.status(400).json({ error: 'Email, password, and branch_id are required' });
    }

    // Check if branch exists
    const { rows: branchRows } = await query('SELECT id FROM branches WHERE id = $1', [branch_id]);
    if (branchRows.length === 0) {
      return res.status(400).json({ error: 'Invalid branch_id' });
    }

    // Check if email already exists
    const { rows: existingRows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingRows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Create admin user
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);
    
    const { rows } = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role, branch_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role, branch_id',
      [email, passwordHash, first_name, last_name, 'admin', branch_id]
    );

    res.status(201).json({ user: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Update user role (owner only)
router.put('/users/:userId/role', requireOwner, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, branch_id } = req.body;

    if (!['customer', 'admin', 'owner'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (role === 'admin' && !branch_id) {
      return res.status(400).json({ error: 'Branch ID required for admin role' });
    }

    const { rows } = await query(
      'UPDATE users SET role = $1, branch_id = $2 WHERE id = $3 RETURNING id, email, role, branch_id',
      [role, branch_id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get current user info
router.get('/me', (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
