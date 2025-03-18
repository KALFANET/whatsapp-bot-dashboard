const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Document = sequelize.define('Document', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fileUrl: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        publicId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
    }, {
        tableName: 'Documents',
        timestamps: true,
    });

    return Document;
};