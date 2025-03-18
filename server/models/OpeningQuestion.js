const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OpeningQuestion = sequelize.define('OpeningQuestion', {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    question: { 
      type: DataTypes.TEXT, 
      allowNull: false 
    },
    answerType: { 
      type: DataTypes.STRING, // שונה מ-ENUM ל-STRING
      allowNull: false, 
      defaultValue: 'text',
      validate: {
        isIn: [['text', 'boolean', 'multiple_choice']]
      }
    },
    options: { 
      type: DataTypes.TEXT, // שונה מ-JSON ל-TEXT
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('options');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('options', JSON.stringify(value));
      }
    },
    isActive: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: true 
    }
  });

  return OpeningQuestion;
};