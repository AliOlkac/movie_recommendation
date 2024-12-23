'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Movie extends Model {
    static associate(models) {
      Movie.hasMany(models.Rating, { foreignKey: 'movieId' });
    }
  }
  Movie.init({
    title: { type: DataTypes.STRING, allowNull: false },
    genre: DataTypes.STRING,
    overview: DataTypes.TEXT,
    cast: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Movie',
  });
  return Movie;
};
