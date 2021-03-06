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
        console.log("Hello from inside checkPassword!")
        return bcrypt.compareSync(password, this.password_digest);
      }//,

      // //WHY DOES THIS NOT WORK? WHAT IS SCOPE OF INSTANCE METHOD?
      // addNewScore: function(newScore,newRounds) {
      //   console.log("Hello from addNewScore");

      //   var now = new Date(); //this is the current date
        
      //   console.log("new data to add is")
      //   console.log("newScore",newScore);
      //   console.log("newRounds",newRounds);
      //   console.log("this.id", this.id);

      //   //console.log("req.session.userId",req.session.userId);
      //   console.log("current date", now);

      //   //THE NEXT LINE IS NOT WORKING
      //   return sql.Score.create({game_score:newScore, rounds_played:newRounds, date_played:now, PlayerId: this.id}); //or this.id
      //   //STILL TO CONSIDER ADDING: Put # of countries per question into Score table so can adjust for harder/easier games
      // }
    },
    classMethods: {
      encryptPassword: function(password) {
        var hash = bcrypt.hashSync(password,salt);
        return hash;
      },
      createSecure: function(jsScreenName, jsEmail, jsPassword) {
        console.log("Hello from inside of createSecure!");
        return this.create({
          screen_name: jsScreenName,
          email: jsEmail,
          password_digest: this.encryptPassword(jsPassword)
        });
      },
      authenticate: function(jsScreenName, jsPassword) {
        // find a user in the DB
        console.log("Hello from inside Authenticate!")
        return this.find({
          where: {
            screen_name: jsScreenName
          }
        })
        .then(function(foundPlayer){
          if (foundPlayer === null){
            return false;
            //throw new Error("This screen name could not be found. Please try again.");
          }
          else if (foundPlayer.checkPassword(jsPassword)){
            return foundPlayer;
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