const sequelize = require('../config/connection'); // Doğru yolu kontrol edin
const { Model, DataTypes } = require('sequelize');

class User extends Model {}

User.init({
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'Users', // Veritabanındaki tablo adını büyük harfle belirtin
  timestamps: true,
});

module.exports = User;
