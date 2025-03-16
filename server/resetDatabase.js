const sequelize = require('./config/database'); // חיבור למסד הנתונים
const Document = require('./models/Document'); // טעינת המודלים

const resetDatabase = async () => {
    try {
        console.log("🔄 Resetting database...");
        await sequelize.sync({ force: true }); // מוחק ומגדיר מחדש את כל הטבלאות
        console.log("✅ Database has been reset.");
        process.exit(0); // סיום הרצת הסקריפט בהצלחה
    } catch (error) {
        console.error("❌ Error resetting database:", error);
        process.exit(1); // יציאה עם קוד שגיאה
    }
};

resetDatabase();