const { sequelize } = require('../models'); // ✅ טעינת sequelize מהמודלים

const initializeDatabase = async () => {
  try {
    console.log('🔄 Checking database state...');
    await sequelize.authenticate(); // ✅ בודק שהחיבור תקין לפני סנכרון
    await sequelize.sync({ alter: true }); // ✅ מבצע התאמות בטבלאות אך לא מוחק נתונים
    console.log('✅ Database initialized successfully.');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

initializeDatabase(); // הפעלת אתחול

module.exports = initializeDatabase;