const cloudinary = require('./config/cloudinaryConfig');

cloudinary.api.ping()
  .then(res => console.log('✅ Cloudinary connection successful:', res))
  .catch(err => console.error('❌ Cloudinary connection failed:', err));