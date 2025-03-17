const sequelize = require('./database');
const path = require('path');
const fs = require('fs');

const resetDatabase = async () => {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection OK!');

    console.log('🔄 Resetting database - dropping and recreating all tables...');
    await sequelize.sync({ force: true });  // מוחק ויוצר מחדש את כל הטבלאות
    
    console.log('✅ Database has been reset successfully.');
    
    return { success: true, message: 'Database reset complete' };
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    return { success: false, error };
  }
};

// אם הסקריפט מופעל ישירות, בצע איפוס
if (require.main === module) {
  resetDatabase()
    .then(result => {
      console.log(result.message);
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = resetDatabase;