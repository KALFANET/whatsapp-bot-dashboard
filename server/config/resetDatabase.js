// שמור את זה כקובץ server/resetDatabase.js
const { sequelize } = require('../models');

async function resetDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful');

    console.log('🔄 Syncing database (creating tables)...');
    // force: true ימחק טבלאות קיימות וייצור אותן מחדש
    await sequelize.sync({ force: true });
    console.log('✅ Database synced successfully');

    console.log('📋 Available models:');
    Object.keys(sequelize.models).forEach(model => {
      console.log(`  - ${model}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();