const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Message = sequelize.define('Message', {
        sender: {
            type: DataTypes.STRING,
            allowNull: false
        },
        sender_name: { 
            type: DataTypes.STRING,
            allowNull: true
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false
        },
        isOutgoing: { 
            type: DataTypes.BOOLEAN, 
            allowNull: false, 
            defaultValue: false 
        } // חדש - מציין האם ההודעה נשלחה על ידי הבוט
    }, {
        tableName: 'Messages',
        indexes: [
            {
                fields: ['timestamp'],
                name: 'message_timestamp_idx'
            }
        ]
    });

    return Message;
};