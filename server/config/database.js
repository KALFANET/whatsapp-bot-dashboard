const { Sequelize } = require('sequelize');
const path = require('path');

// במקום יצירת אובייקט, נשתמש בפונקציה שמחזירה אובייקט חדש
const getSequelize = () => {
  return new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false,
  });
};

// אובייקט שניתן לשימוש יחיד (singleton)
const sequelize = getSequelize();

// ייצוא גם של האובייקט וגם של הפונקציה
module.exports = sequelize;
module.exports.getSequelize = getSequelize;
