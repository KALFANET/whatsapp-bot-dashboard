const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('../config/database'); // ייבוא התצורה במקום אובייקט sequelize

console.log('🔄 Initializing models...');

const db = {};

// יצירת חיבור sequelize מהתצורה
const sequelize = config.getSequelize ? config.getSequelize() : config;

// טעינת כל הקבצים בתיקיית models באופן דינמי
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'));

console.log(`📁 Found ${modelFiles.length} model files to load`);

modelFiles.forEach(file => {
  try {
    console.log(`📄 Loading model file: ${file}`);
    const model = require(path.join(__dirname, file));
    
    // לבדוק האם מדובר במודל Sequelize על פי המאפיינים שלו
    if (model.name) {
      console.log(`✅ Loaded Sequelize model: ${model.name}`);
      db[model.name] = model;
    } else {
      // אם אין שם מוגדר, משתמש בשם הקובץ (ללא סיומת .js)
      const modelName = path.basename(file, '.js');
      console.log(`✅ Loaded model with filename: ${modelName}`);
      db[modelName] = model;
    }
  } catch (error) {
    console.error(`❌ Error loading model ${file}:`, error);
  }
});

// קביעת אסוציאציות בין המודלים אם יש
console.log('🔄 Setting up model associations...');
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
      console.log(`✅ Associations set for model: ${modelName}`);
    } catch (error) {
      console.error(`❌ Error setting associations for ${modelName}:`, error);
    }
  }
});

// הוספת sequelize ו-Sequelize לאובייקט db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log(`✅ Models loaded successfully: ${Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize').join(', ')}`);

module.exports = db;