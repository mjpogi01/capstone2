const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const productsRouter = require('./routes/products');
const uploadRouter = require('./routes/upload');
const userRouter = require('./routes/user');
const branchesRouter = require('./routes/branches');
const deleteRouter = require('./routes/delete');
const ordersRouter = require('./routes/orders');
const orderTrackingRouter = require('./routes/order-tracking');
const designUploadRouter = require('./routes/design-upload');
const customDesignRouter = require('./routes/custom-design');
const emailRouter = require('./routes/email');
const analyticsRouter = require('./routes/analytics');
const aiRouter = require('./routes/ai');
const aiSchemaRouter = require('./routes/aiSchema');
const productionWorkflowRouter = require('./routes/production-workflow');
const chatRouter = require('./routes/chat');
const artistRouter = require('./routes/artist');
const branchChatRouter = require('./routes/branch-chat');
// Using Supabase instead of local database

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ 
    message: 'Yohanns API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      admin: '/api/admin',
      products: '/api/products',
      upload: '/api/upload',
      user: '/api/user',
      branches: '/api/branches',
      orders: '/api/orders',
      orderTracking: '/api/order-tracking',
      designUpload: '/api/design-upload',
      customDesign: '/api/custom-design',
      email: '/api/email',
      analytics: '/api/analytics',
      ai: '/api/ai',
      productionWorkflow: '/api/production-workflow',
      chat: '/api/chat',
      artist: '/api/artist'
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Handle favicon.ico requests to prevent 404 errors
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end(); // Return 204 No Content instead of 404
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/products', productsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/user', userRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/delete', deleteRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/order-tracking', orderTrackingRouter);
app.use('/api/design-upload', designUploadRouter);
app.use('/api/custom-design', customDesignRouter);
app.use('/api/email', emailRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/ai-schema', aiSchemaRouter);
app.use('/api/production-workflow', productionWorkflowRouter);
app.use('/api/chat', chatRouter);
app.use('/api/artist', artistRouter);
app.use('/api/branch-chat', branchChatRouter);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));
  
  // Serve React app for all non-API routes (must be after all API routes)
  app.use((req, res, next) => {
    // Skip API routes - let them fall through to 404 handler
    if (req.path.startsWith('/api/')) {
      return next();
    }
    // Serve React app for all other routes
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  console.error('Error stack:', err.stack);
  
  if (res.headersSent) {
    return next(err);
  }
  
  // Check for Supabase tenant errors
  if (err.message && (err.message.includes('Tenant') || err.message.includes('tenant'))) {
    return res.status(401).json({
      success: false,
      error: 'Session expired. Please refresh your browser and log in again.'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

const port = process.env.PORT || 4000;

// Start server directly - using Supabase instead of local database
// Listen on 0.0.0.0 to accept connections from mobile devices on local network
app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
  console.log(`📱 Mobile access: http://192.168.254.100:${port}`);
  console.log('Using Supabase for database operations');
});



