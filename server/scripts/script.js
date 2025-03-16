const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: '../database.sqlite', // ודא שזה הנתיב הנכון למסד הנתונים שלך
  logging: console.log // ❗ יציג את כל השאילתות למסד הנתונים
});

async function checkDatabase() {
    console.log('🔍 בודק את מסד הנתונים...');

    // בדיקת חיבור למסד הנתונים
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully.');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return; // יציאה אם החיבור נכשל
    }

    // הצגת כל הטבלאות הקיימות
    try {
        const tables = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
        console.log('📌 טבלאות קיימות:', tables[0]);
    } catch (error) {
        console.error('❌ Error fetching tables:', error);
    }
}

checkDatabase();