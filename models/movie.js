const { DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

const Movie = sequelize.define('Movie', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  posterPath: {
    type: DataTypes.STRING, // Poster URL'sini saklamak için
  },
  genres: {
    type: DataTypes.STRING, // Türleri saklamak için
  },
}, {
  tableName: 'movies',
  timestamps: true, // createdAt ve updatedAt sütunları otomatik
});

module.exports = Movie;
