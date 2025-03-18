// server/checkModels.js
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

// יצירת חיבור למסד הנתונים
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false // מבטל לוגים מפורטים כדי לא להציף את הקובץ
});

// פונקציה לרישום ללוג (לקונסולה ולקובץ)
function log(message) {
  console.log(message); // מדפיס לקונסולה
  fs.appendFileSync(path.join(__dirname, 'model_check_results.txt'), message + '\n'); // שומר לקובץ
}

async function checkModels() {
  // מנקה את הקובץ אם הוא קיים
  const logFile = path.join(__dirname, 'model_check_results.txt');
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
  }
  
  try {
    log('🔍 Checking Sequelize connection...');
    await sequelize.authenticate();
    log('✅ Database connection OK');

    log('\n📂 Scanning models directory...');
    const modelsDir = path.join(__dirname, 'models');
    const files = fs.readdirSync(modelsDir)
      .filter(file => file.endsWith('.js') && file !== 'index.js');
    
    log(`📄 Found model files: ${files.join(', ')}`);

    log('\n🔍 Inspecting models...');
    for (const file of files) {
      try {
        const modelPath = path.join(modelsDir, file);
        log(`\n📄 Examining model: ${file}`);
        const modelModule = require(modelPath);
        
        // בדיקת סוג המודל
        log(`  Type: ${typeof modelModule}`);
        
        // בדיקת שם המודל
        let modelName = modelModule.name || 'Unknown';
        log(`  Model name: ${modelName}`);
        
        // בדיקת שם הטבלה
        let tableName = 'Unknown';
        try {
          tableName = modelModule.tableName || modelModule.getTableName?.() || 'Unknown';
        } catch(e) {
          tableName = 'Could not determine';
        }
        log(`  Table name: ${tableName}`);
        
        // בדיקת מבנה (דפוס של Sequelize)
        if (typeof modelModule.findAll === 'function' && 
            typeof modelModule.create === 'function') {
          log('  ✅ Has standard Sequelize model methods');
        } else {
          log('  ⚠️ Missing standard Sequelize model methods');
        }
        
        // בדיקה אם יש פונקציית init או פונקציות אחרות
        const properties = Object.getOwnPropertyNames(modelModule);
        log(`  Properties: ${properties.join(', ') || 'None'}`);
        
        // ניסיון לחלץ מידע נוסף
        if (modelModule.sequelize) {
          log('  ✅ Has reference to sequelize instance');
        } else {
          log('  ⚠️ No reference to sequelize instance found');
        }
        
        // ניסיון להשיג את הגדרת המודל
        if (modelModule.rawAttributes) {
          log('  ✅ Has rawAttributes (column definitions)');
          log('  Columns: ' + Object.keys(modelModule.rawAttributes).join(', '));
        } else {
          log('  ⚠️ No rawAttributes found');
        }
      } catch (modelError) {
        log(`  ❌ Error examining model ${file}: ${modelError.message}`);
      }
    }

    log('\n🔍 Trying to sync models individually...');
    
    // טעינה וסנכרון של כל מודל בנפרד
    for (const file of files) {
      try {
        const modelPath = path.join(modelsDir, file);
        const modelName = file.replace('.js', '');
        log(`\n🔄 Syncing model: ${modelName}`);
        
        const model = require(modelPath);
        if (typeof model.sync === 'function') {
          await model.sync({ force: true });
          log(`  ✅ Successfully synced model: ${modelName}`);
        } else {
          log(`  ❌ Model ${modelName} does not have a sync method`);
        }
      } catch (syncError) {
        log(`  ❌ Error syncing model ${file}: ${syncError.message}`);
      }
    }

    log('\n📊 Checking database tables...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    log(`  Tables in database: ${tables.join(', ') || 'None'}`);

  } catch (error) {
    log(`❌ Error during model check: ${error.message}`);
    if (error.stack) {
      log(`Stack trace: ${error.stack}`);
    }
  } finally {
    await sequelize.close();
    log('\n✅ Check complete');
    log(`Results saved to: ${logFile}`);
  }
}

checkModels();