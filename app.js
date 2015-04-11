//WorldStats
//My first real project
//Started 4-11-15

//Packages to install with NPM
//express
//ejs
//bcrypt

//REQUIRE the needed libraries
var express = require('express');
var app = express();

//APP.SET to set main settings

//APP.USE for middleware

//Below are the various ROUTES
//ROOT route
app.get('/', function (req,res){
    console.log("Hello world!");
    res.send("Hello world!");
});

//Make the server listen on port 3000
app.listen(3000, function (){
    console.log("Don't blame me. I'm an interpreter. I'm not supposed to know a power socket from a computer terminal. ");
});

