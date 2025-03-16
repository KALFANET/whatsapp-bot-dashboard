const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'), // אחסון קבוע
    logging: false, // ביטול לוגים מיותרים
});

module.exports = sequelize;