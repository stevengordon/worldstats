"use strict";
module.exports = function(sequelize, DataTypes) {
  var Score = sequelize.define("Score", {
    game_score: DataTypes.INTEGER,
    rounds_played: DataTypes.INTEGER,
    date_played: DataTypes.DATEONLY
  }, {
    classMethods: {
      associate: function(models) {
        this.belongsTo(models.Player);
      }
    }
  });
  return Score;
};