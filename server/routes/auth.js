const express = require('express');

const router = express.Router();

// Note: Authentication is now handled entirely by Supabase Auth
// These routes are kept for backward compatibility but should not be used
// Frontend should use Supabase Auth directly

router.post('/signup', async (req, res) => {
  return res.status(410).json({ 
    error: 'This endpoint is deprecated. Please use Supabase Auth directly from the frontend.' 
  });
});

router.post('/login', async (req, res) => {
  return res.status(410).json({ 
    error: 'This endpoint is deprecated. Please use Supabase Auth directly from the frontend.' 
  });
});

module.exports = router;