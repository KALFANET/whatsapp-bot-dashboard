// server/config/initDB.js
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

// יצירת חיבור למסד הנתונים
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false,
});

const initDatabase = async () => {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');

    console.log('🔄 Loading models directly...');
    
    // טעינת המודלים
    const Document = require('../models/Document')(sequelize);
    const Message = require('../models/Message')(sequelize);
    const OpeningQuestion = require('../models/OpeningQuestion')(sequelize);

    console.log('🔄 Updating database schema (without deleting data)...');
    await sequelize.sync({ alter: true }); // 🔹 עדכון מבנה הטבלאות מבלי למחוק נתונים
    console.log('✅ Database schema updated successfully!');

    // בדיקת קיום העמודה החדשה isOutgoing
    const queryInterface = sequelize.getQueryInterface();
    const tableDescription = await queryInterface.describeTable('Messages');

    if (!tableDescription.isOutgoing) {
      console.log('ℹ️ Column "isOutgoing" missing, adding it now...');
      await queryInterface.addColumn('Messages', 'isOutgoing', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
      console.log('✅ Column "isOutgoing" added successfully!');
    } else {
      console.log('✅ Column "isOutgoing" already exists, no changes needed.');
    }

    // וידוא שתיקיות חשובות קיימות
    const dirs = [
      path.join(__dirname, '../uploads'),
      path.join(__dirname, '../logs')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        console.log(`📁 Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Directory created: ${dir}`);
      } else {
        console.log(`✅ Directory exists: ${dir}`);
      }
    }

    console.log('✅ Database initialization completed.');
    process.exit(0); // יציאה בהצלחה
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// הפעלת הפונקציה
initDatabase();