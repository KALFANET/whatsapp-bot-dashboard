const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, Sequelize } = require('./models');
const uploadRoutes = require('./routes/uploadRoutes');
const secureFileAccess = require('./middlewares/secureFileAccess');
const questionsRoutes = require('./routes/questionsRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

const app = express();
app.use(express.json());
app.use(cors());

const startServer = async () => {
  try {
    console.log('🔄 Checking database state...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful.');

    console.log('🔄 Syncing database models...');
    // אפשרות לשימוש ב-alter לשמירה על נתונים קיימים
    // או ב-force לאיפוס מלא (מסוכן בסביבת ייצור)
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synced successfully.');

    // בדיקה שהטבלאות נוצרו כראוי
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('📊 Tables in database:', tables.map(t => t.name).join(', '));

    // טעינת הנתיבים
    app.use('/api/files', uploadRoutes);
    app.use('/api/files/secure', secureFileAccess, express.static(path.join(__dirname, 'uploads')));
    app.use('/api/questions', questionsRoutes);
    app.use('/api/whatsapp', whatsappRoutes);
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1); // יציאה עם קוד שגיאה במקרה של כשל קריטי
  }
};

// טיפול בשגיאות לא מטופלות
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();