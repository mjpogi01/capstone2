const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware to verify Supabase JWT token
const authenticateSupabaseToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user role from user metadata
    const role = user.user_metadata?.role || 'customer';
    const branch_id = user.user_metadata?.branch_id || null;

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: role,
      branch_id: branch_id,
      first_name: user.user_metadata?.first_name || null,
      last_name: user.user_metadata?.last_name || null
    };

    next();
  } catch (error) {
    console.error('Supabase auth error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to check if user is admin or owner
const requireAdminOrOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
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

// Middleware to check admin can access specific branch
const requireBranchAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Owners can access all branches
  if (req.user.role === 'owner') {
    return next();
  }

  // Admins can only access their assigned branch
  if (req.user.role === 'admin') {
    const requestedBranchId = req.params.branchId || req.body.branch_id;
    if (requestedBranchId && req.user.branch_id !== parseInt(requestedBranchId)) {
      return res.status(403).json({ error: 'Access denied to this branch' });
    }
  }

  next();
};

module.exports = {
  authenticateSupabaseToken,
  requireRole,
  requireAdminOrOwner,
  requireOwner,
  requireBranchAccess
};
