const sequelize = require('../config/database');
const Document = require('./Document'); 
const OpeningQuestion = require('./OpeningQuestion');

const db = {
  sequelize,
  Document,
  OpeningQuestion
};

const syncDatabase = async () => {
    try {
        console.log('🔄 Syncing database...');
        await sequelize.authenticate(); // ✅ בדיקת חיבור למסד הנתונים

        // ✅ וידוא שהחיבור למסד הנתונים הושלם לפני שאילתות
        const queryInterface = sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();

        // ✅ תיקון - בדיקה תקפה אם טבלה קיימת
        const normalizedTables = tables.map(table => table.toLowerCase());
        const missingTables = !normalizedTables.includes('documents') || !normalizedTables.includes('openingquestions');

        if (missingTables) {
            console.log('⚠️ Tables missing. Creating database from scratch.');
            await sequelize.sync(); // ✅ יצירת טבלה אם לא קיימת
        } else {
            console.log('✅ Tables exist. Synchronizing schema.');
            await sequelize.sync({ alter: true }); // ✅ עדכון סכימה בלי מחיקה
        }

        console.log('✅ Database synced successfully.');
    } catch (error) {
        console.error('❌ Database sync failed:', error);
    }
};

// ✅ הימנעות מהרצה כפולה
if (require.main === module) {
    syncDatabase();
}

module.exports = db;