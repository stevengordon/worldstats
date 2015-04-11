"use strict";
module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable("Players", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      screen_name: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING
      },
      password_digest: {
        type: DataTypes.STRING
      },
      home_country: {
        type: DataTypes.CHAR(2)
      },
      cumulative_score: {
        type: DataTypes.INTEGER
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
    migration.dropTable("Players").done(done);
  }
};