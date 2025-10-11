const express = require('express');
const { query } = require('../lib/db');
const { authenticateSupabaseToken, requireAdminOrOwner, requireOwner, requireBranchAccess } = require('../middleware/supabaseAuth');

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateSupabaseToken);

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

// Get users by role (admin or owner) - Note: Users are now managed through Supabase Auth
router.get('/users', requireAdminOrOwner, async (req, res) => {
  try {
    // Note: User management is now handled through Supabase Auth dashboard
    // This endpoint returns a message directing to use Supabase Auth
    res.json({ 
      message: 'User management is now handled through Supabase Auth dashboard',
      users: [] 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create admin user (owner only) - Note: Users are now managed through Supabase Auth
router.post('/users', requireOwner, async (req, res) => {
  try {
    // Note: User creation is now handled through Supabase Auth dashboard
    res.status(410).json({ 
      error: 'User creation is now handled through Supabase Auth dashboard. Please create users there and set their metadata role and branch_id.' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Update user role (owner only) - Note: Users are now managed through Supabase Auth
router.put('/users/:userId/role', requireOwner, async (req, res) => {
  try {
    // Note: User role updates are now handled through Supabase Auth dashboard
    res.status(410).json({ 
      error: 'User role updates are now handled through Supabase Auth dashboard. Please update user metadata there.' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get current user info
router.get('/me', (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
