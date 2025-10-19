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
      designUpload: '/api/design-upload'
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
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

const port = process.env.PORT || 4000;

// Start server directly - using Supabase instead of local database
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
  console.log('Using Supabase for database operations');
});



