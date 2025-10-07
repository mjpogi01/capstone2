const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dtaeejtap',
  api_key: process.env.CLOUDINARY_API_KEY || '574482644167322',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Yf8ilFYOYuEFVUqMrLC2DzInfY8'
});

module.exports = cloudinary;
