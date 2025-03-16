const fs = require('fs');
const path = require('path');

const files = {
  'config/cloudinaryConfig.js': `const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
`,
  'middlewares/uploadMiddleware.js': `const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'whatsapp-bot-files',
    format: async (req, file) => 'pdf',
    public_id: (req, file) => \`\${Date.now()}-\${file.originalname}\`,
  },
});

const upload = multer({ storage });

module.exports = upload;
`,
  'routes/uploadRoutes.js': `const express = require('express');
const upload = require('../middlewares/uploadMiddleware');
const cloudinary = require('../config/cloudinaryConfig');
const Document = require('../models/Document');
const router = express.Router();

// העלאת קובץ ל-Cloudinary ושמירה ב-DB
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = await Document.create({
      fileName: req.file.originalname,
      fileUrl: req.file.path,
      publicId: req.file.filename,
    });

    res.status(200).json({ message: 'File uploaded and saved', document });
  } catch (error) {
    res.status(500).json({ message: 'Error saving file', error: error.message });
  }
});

// מחיקת קובץ מ-Cloudinary וה-DB
router.delete('/delete/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;

    await cloudinary.uploader.destroy(publicId);
    await Document.destroy({ where: { publicId } });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
});

module.exports = router;
`,
  'models/Document.js': `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  fileName: { type: DataTypes.STRING, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: false },
  publicId: { type: DataTypes.STRING, allowNull: false },
});

module.exports = Document;
`,
};

Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, { encoding: 'utf8', flag: 'w' });
  console.log(`✅ נוצר: ${filePath}`);
});

console.log('🎉 כל קבצי Cloudinary נוצרו בהצלחה!');