const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection'); // Bağlantıyı config.js üzerinden alıyoruz.

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: true, // createdAt ve updatedAt otomatik oluşturulur.
});

module.exports = User;
