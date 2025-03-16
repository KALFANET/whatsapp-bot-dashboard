const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// יצירת תיקיית אחסון זמנית אם אינה קיימת
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// הגדרת Multer לשמירת קבצים מקומית לפני ההעלאה ל-SFTP
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // שינוי שם הקובץ להסרת רווחים ויצירת שם ייחודי
        const uniqueSuffix = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, uniqueSuffix);
    }
});

const upload = multer({ storage });

// **נתיבים לניהול קבצים**
// 🔹 העלאת קובץ
router.post('/upload', upload.single('file'), uploadController.uploadFile);

// 🔹 מחיקת קובץ
router.delete('/delete/:fileName', uploadController.deleteFile);

// 🔹 הורדת קובץ
router.get('/download/:fileName', uploadController.downloadFile);

module.exports = router; // ✅ מוודא שהייצוא הוא של Router ולא של אובייקט Multer