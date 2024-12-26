const { Model, DataTypes } = require('sequelize');

class User extends Model {}

User.init({
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
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
  sequelize, // Buraya bağladığınız sequelize nesnesini ekleyin
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
