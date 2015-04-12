"use strict";
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);

module.exports = function(sequelize, DataTypes) {
  var Player = sequelize.define("Player",
  {
    screen_name: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_digest: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true
      }
    },
    home_country: DataTypes.CHAR(2),
    cumulative_score: DataTypes.INTEGER
  },
  {
    instanceMethods: {
      checkPassword: function(password) {
        return bcrypt.compareSync(password, this.passwordDigest);
      }
    },
    classMethods: {
      encryptPassword: function(password) {
        var hash = bcrypt.hashSync(password,salt);
        return hash;
      },
      createSecure: function(jsScreenName, jsEmail, jsPassword) {
        console.log("Got inside of createSecure!");
        console.log("Inside of createSecure, this is ",this);
        return this.create({
          screen_name: jsScreenName,
          email: jsEmail,
          password_digest: this.encryptPassword(jsPassword)
        });
      },
      authenticate: function(email, password) {
        // find a user in the DB
        return this.find({
          where: {
            email: email
          }
        })
        .then(function(user){
          if (user === null){
            throw new Error("Username does not exist");
          }
          else if (user.checkPassword(password)){
            return user;
          } else {
            return false;
          }
        });
      },
      associate: function(models) {
        this.hasMany(models.Score);
      }
    }
  });
  return Player;
};