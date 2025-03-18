const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, Sequelize } = require('./models');
const uploadRoutes = require('./routes/uploadRoutes');
const secureFileAccess = require('./middlewares/secureFileAccess');
const questionsRoutes = require('./routes/questionsRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

const startServer = async () => {
  try {
    // בדיקה אם נדרש אתחול מאולץ של מסד הנתונים
    const forceInit = process.env.FORCE_INIT === 'true';
    if (forceInit) {
      console.log('🔄 Force initialization requested...');
      try {
        // נסה להשתמש בסקריפט initDB אם הוא קיים
        let initDbPath = path.join(__dirname, 'config', 'initDB.js');
        if (fs.existsSync(initDbPath)) {
          const initDb = require('./config/initDB');
          await initDb();
          console.log('✅ Force initialization completed via initDB.js');
          process.exit(0); // סיום התהליך אחרי אתחול מוצלח
        } else {
          // אם הקובץ לא נמצא, בצע אתחול מאולץ כאן
          console.log('ℹ️ initDB.js not found, performing initialization here...');
          await sequelize.sync({ force: true });
          console.log('✅ Force initialization completed.');
        }
      } catch (initError) {
        console.error('❌ Force initialization failed:', initError);
        process.exit(1);
      }
    }

    console.log('🔄 Checking database state...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful.');

    // בדיקת קיום קובץ מסד הנתונים
    const dbPath = path.join(__dirname, 'database.sqlite');
    if (!fs.existsSync(dbPath)) {
      console.log('⚠️ Database file does not exist. It will be created during sync.');
    } else {
      const stats = fs.statSync(dbPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      console.log(`ℹ️ Database file exists (${fileSizeInMB.toFixed(2)} MB).`);
    }

    // בדיקה אם הטבלאות הנדרשות קיימות
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const tableNames = tables.map(t => t.name);
    console.log('📊 Existing tables:', tableNames.join(', '));
    
    // בדיקה אם הטבלאות המרכזיות קיימות
    const requiredTables = ['Messages', 'Documents', 'OpeningQuestions'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`⚠️ Missing tables detected: ${missingTables.join(', ')}`);
      console.log('🔄 Performing sync to create all tables...');
      
      // בסביבת פיתוח, אפשר לבצע force sync כדי להבטיח שכל הטבלאות נוצרות
      if (process.env.NODE_ENV !== 'production') {
        const confirmForce = process.env.CONFIRM_FORCE === 'true';
        if (confirmForce) {
          console.log('⚠️ Force sync confirmed. All existing data will be lost!');
          await sequelize.sync({ force: true });
          console.log('✅ Database reset and all tables created.');
        } else {
          console.log('ℹ️ Using alter mode to preserve data. To force reset, set CONFIRM_FORCE=true');
          await sequelize.sync({ alter: true });
          console.log('✅ Database altered to include missing tables.');
        }
      } else {
        // בסביבת ייצור, עדיף להשתמש ב-alter כדי לא לאבד נתונים
        console.log('ℹ️ Production environment detected. Using alter mode to preserve data.');
        await sequelize.sync({ alter: true });
        console.log('✅ Database altered to include missing tables.');
      }
    } else {
      console.log('✅ All required tables exist. Performing gentle sync...');
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced successfully.');
    }

    // בדיקה מחודשת של הטבלאות לאחר הסנכרון
    const updatedTables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('📊 Tables after sync:', updatedTables.map(t => t.name).join(', '));
    
    // בדיקה אם עדיין חסרות טבלאות אחרי הסנכרון
    const stillMissingTables = requiredTables.filter(table => !updatedTables.map(t => t.name).includes(table));
    if (stillMissingTables.length > 0) {
      console.warn(`⚠️ Warning: Some tables are still missing after sync: ${stillMissingTables.join(', ')}`);
      console.warn('⚠️ The application may not function correctly.');
    }

    // וידוא שתיקיות חשובות קיימות
    const requiredDirs = [
      { path: path.join(__dirname, 'uploads'), name: 'uploads' },
      { path: path.join(__dirname, 'logs'), name: 'logs' }
    ];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir.path)) {
        console.log(`📁 Creating ${dir.name} directory...`);
        fs.mkdirSync(dir.path, { recursive: true });
        console.log(`✅ ${dir.name} directory created.`);
      } else {
        console.log(`✅ ${dir.name} directory exists.`);
      }
    }

    // טעינת הנתיבים
    app.use('/api/files', uploadRoutes);
    app.use('/api/files/secure', secureFileAccess, express.static(path.join(__dirname, 'uploads')));
    app.use('/api/questions', questionsRoutes);
    app.use('/api/whatsapp', whatsappRoutes);
    
    // הוספת נתיב בריאות בסיסי
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        tables: updatedTables.map(t => t.name)
      });
    });
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 API endpoints:`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
      console.log(`   WhatsApp messages: http://localhost:${PORT}/api/whatsapp/whatsapp-messages`);
      console.log(`   Files: http://localhost:${PORT}/api/files`);
      console.log(`   Questions: http://localhost:${PORT}/api/questions`);
    });
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    console.error('Error details:', error.stack || error);
    process.exit(1); // יציאה עם קוד שגיאה במקרה של כשל קריטי
  }
};

// טיפול בשגיאות לא מטופלות
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// טיפול בסיום תהליך
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();