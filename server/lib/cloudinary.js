const cloudinary = require('cloudinary').v2;

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dtaeejtap',
  api_key: '574482644167322',
  api_secret: 'Yf8ilFYOYuEFVUqMrLC2DzInfY8'
});

module.exports = cloudinary;
