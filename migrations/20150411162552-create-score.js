"use strict";
module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable("Scores", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      game_score: {
        type: DataTypes.INTEGER
      },
      rounds_played: {
        type: DataTypes.INTEGER
      },
      date_played: {
        type: DataTypes.DATEONLY
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    }).done(done);
  },
  down: function(migration, DataTypes, done) {
    migration.dropTable("Scores").done(done);
  }
};