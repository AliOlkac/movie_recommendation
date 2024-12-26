const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Rating = sequelize.define('Rating', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  movieId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rating: {
    type: DataTypes.FLOAT, // 0.5 ile 5.0 arasında puanlar için
    allowNull: false,
  },
}, {
  tableName: 'Ratings',
  timestamps: true, // createdAt ve updatedAt sütunları otomatik
});

module.exports = Rating;
