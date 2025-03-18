const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

console.log('🔄 Initializing models...');

const db = {};
const sequelize = config.getSequelize ? config.getSequelize() : config;

const modelFiles = fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'));

console.log(`📁 Found ${modelFiles.length} model files to load`);

modelFiles.forEach(file => {
  try {
    console.log(`📄 Attempting to load model file: ${file}`);
    const modelDef = require(path.join(__dirname, file));

    if (typeof modelDef === 'function') {
        const model = modelDef(sequelize, DataTypes);
        db[model.name] = model;
        console.log(`✅ Loaded Sequelize model: ${model.name}`);
    } else {
        console.warn(`⚠️ Skipping invalid model file: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error loading model ${file}:`, error);
  }
});

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

db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log(`✅ Models successfully loaded: ${Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize').join(', ')}`);

module.exports = db;