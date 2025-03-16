const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Document } = require('../models'); // ✅ טוען את המודל בצורה מרוכזת
const { v4: uuidv4 } = require('uuid'); // ✅ מחולל מזהים ייחודיים
const fs = require('fs');
const path = require('path');
const secureFileAccess = require('../middlewares/secureFileAccess');


// ✅ הגדרת Multer להעלאת קבצים - יש להגדיר לפני השימוש בו!
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) {
            console.warn("⚠️ Creating uploads directory...");
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        console.log(`📂 Saving file to: ${uploadPath}`);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${file.originalname}`;
        console.log(`📌 Generated filename: ${uniqueSuffix}`);
        cb(null, uniqueSuffix);
    }
});

const upload = multer({ storage });
router.get('/', async (req, res) => {
    try {
        const documents = await Document.findAll();
        res.json(documents);
    } catch (error) {
        console.error('❌ Error fetching documents:', error);
        res.status(500).json({ error: 'Error fetching documents' });
    }
});
router.get('/secure', secureFileAccess, async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../uploads', req.fileName);
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ error: '❌ File not found' });
        }
    } catch (error) {
        console.error('❌ Error fetching secure file:', error);
        res.status(500).json({ error: '❌ Internal server error' });
    }
});

// ✅ כעת הנתיבים יכולים להשתמש במשתנה `// ✅ כעת הנתיבים יכולים להשתמש במשתנה `upload`
router.post('/upload', upload.single('file'), async (req, res) => {
    console.log('📂 File received:', req.file);  // 🔍 בדוק אם Multer מזהה קובץ
    if (!req.file) {
        return res.status(400).json({ error: '❌ No file received' });
    }

    try {
        const fileName = req.file.filename;
        const publicId = uuidv4();
        const fileUrl = `https://nm-digitalhub.com/uploads/${fileName}`;
        console.log(`✅ Saving file: ${fileName} to database...`);

        const document = await Document.create({ fileName, publicId, fileUrl, status: 'uploaded' });

        console.log('✅ File saved in database:', document);
        if (process.env.SFTP_HOST) {
            const Client = require('ssh2-sftp-client');
            const sftp = new Client();
            const filePathLocal = path.join(__dirname, '../uploads', req.file.filename);
            const remotePath = `/uploads/${req.file.filename}`;

            await sftp.connect({
                host: process.env.SFTP_HOST,
                port: process.env.SFTP_PORT,
                username: process.env.SFTP_USER,
                password: process.env.SFTP_PASSWORD
            });

            console.log(`🔄 Uploading file to SFTP: ${remotePath}`);
            await sftp.put(filePathLocal, remotePath);
            console.log('✅ File uploaded to SFTP');
            sftp.end();

            return res.json({ message: '✅ File uploaded successfully', document, filePath: remotePath });
        } else {
            return res.json({ message: '✅ File uploaded successfully', document });
        }
    } catch (error) {
        console.error('❌ Error saving file:', error);
        res.status(500).json({ error: '❌ Error uploading file' });
    }
});
router.delete('/delete/:publicId', async (req, res) => {
    try {
        const { publicId } = req.params;
        const document = await Document.findOne({ where: { publicId } });

        if (!document) {
            console.warn(`⚠️ Document not found in database: ${publicId}`);
            return res.status(404).json({ error: '❌ Document not found' });
        }

        let fileDeletedLocally = false;
        let fileDeletedFromSFTP = false;

        // ✅ מחיקת קובץ מקומי
        const filePath = path.join(__dirname, '../uploads', document.fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑 File deleted from local storage: ${filePath}`);
            fileDeletedLocally = true;
        } else {
            console.warn(`⚠️ File not found locally: ${filePath}`);
        }

        // ✅ התחברות ל-SFTP וניסיון מחיקה
        if (process.env.SFTP_HOST) {
            try {
                await sftp.connect({
                    host: process.env.SFTP_HOST,
                    port: process.env.SFTP_PORT,
                    username: process.env.SFTP_USER,
                    password: process.env.SFTP_PASSWORD
                });

                let remotePath = `/uploads/${document.fileName}`;
                console.log(`🔍 Checking SFTP for file: ${remotePath}`);

                // בדיקה אם הקובץ קיים
                const exists = await sftp.exists(remotePath);
                if (!exists) {
                    console.warn(`⚠️ File not found on SFTP: ${remotePath}`);

                    // 🔍 חיפוש קובץ דומה במקרה של שינוי שם
                    const list = await sftp.list('/uploads/');
                    const foundFile = list.find(f => f.name.includes(document.fileName.split('-')[1]));

                    if (foundFile) {
                        remotePath = `/uploads/${foundFile.name}`;
                        console.log(`🔄 Adjusted SFTP file path: ${remotePath}`);
                    }
                }

                if (await sftp.exists(remotePath)) {
                    console.log(`🗑 Deleting file from SFTP: ${remotePath}`);
                    await sftp.delete(remotePath);
                    if (!(await sftp.exists(remotePath))) {
                        console.log(`✅ File successfully deleted from SFTP: ${remotePath}`);
                        fileDeletedFromSFTP = true;
                    } else {
                        console.error(`❌ File still exists on SFTP after delete attempt: ${remotePath}`);
                    }
                }

                await sftp.end();
            } catch (err) {
                console.error(`❌ Error deleting file from SFTP:`, err);
            }
        }

        // ✅ מחיקת הרשומה מה-DB רק אם הקובץ נמחק לפחות ממיקום אחד
        if (fileDeletedLocally || fileDeletedFromSFTP) {
            await document.destroy();
            console.log(`✅ Document deleted from database: ${publicId}`);
            res.json({ message: '✅ File and database record deleted successfully' });
        } else {
            console.warn(`⚠️ File deletion incomplete. Skipping database deletion.`);
            res.status(500).json({ error: '❌ File could not be deleted from all locations' });
        }
    } catch (error) {
        console.error('❌ Error deleting file:', error);
        res.status(500).json({ error: '❌ Error deleting file' });
    }
});
module.exports = router;