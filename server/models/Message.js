const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
    sender: {
        type: DataTypes.STRING,
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'Messages', // הגדרה מפורשת של שם הטבלה
    // אפשרות להוסיף אינדקסים לשיפור ביצועים
    indexes: [
        {
            fields: ['timestamp'],
            name: 'message_timestamp_idx'
        }
    ]
});

module.exports = Message;