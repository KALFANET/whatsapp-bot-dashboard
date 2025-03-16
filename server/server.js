const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // ✅ טוען את כל המודלים דרך index.js
const uploadRoutes = require('./routes/uploadRoutes');
const path = require('path');
const secureFileAccess = require('./middlewares/secureFileAccess');
const questionsRoutes = require('./routes/questionsRoutes');

const app = express();
app.use(express.json());
app.use(cors());

const startServer = async () => {
  try {
    console.log('🔄 Checking database state...');
    await sequelize.authenticate(); // בדיקת חיבור למסד הנתונים
    console.log('✅ Database connection successful.');

    console.log('🔄 Syncing database...');
    await sequelize.sync({ alter: true }); // שומר נתונים קיימים ומעדכן סכימה
    console.log('✅ Database synced successfully.');

    // טעינת הנתיבים
    app.use('/api/files', uploadRoutes);
    app.use('/api/files/secure', secureFileAccess, express.static(path.join(__dirname, 'uploads')));
    app.use('/api/questions', questionsRoutes);

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
  } catch (error) {
    console.error('❌ Database sync failed:', error);
  }
};

startServer();