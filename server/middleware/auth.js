const jwt = require('jsonwebtoken');
const { query } = require('../lib/db');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, 'yohanns_super_secure_jwt_secret_2024_xyz789_abc123_def456_ghi789_jkl012_mno345_pqr678_stu901_vwx234_yz567');
    
    // Get user details including role and branch_id
    const { rows } = await query(
      'SELECT id, email, role, branch_id, first_name, last_name FROM users WHERE id = $1',
      [decoded.sub]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to check if user is owner or admin
const requireAdminOrOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!['admin', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin or owner access required' });
  }

  next();
};

// Middleware to check if user is owner only
const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }

  next();
};

// Middleware to check if admin can access specific branch
const requireBranchAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Owner can access all branches
  if (req.user.role === 'owner') {
    return next();
  }

  // Admin can only access their assigned branch
  if (req.user.role === 'admin') {
    const branchId = req.params.branchId || req.body.branch_id;
    if (req.user.branch_id && req.user.branch_id !== parseInt(branchId)) {
      return res.status(403).json({ error: 'Access denied to this branch' });
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdminOrOwner,
  requireOwner,
  requireBranchAccess
};
