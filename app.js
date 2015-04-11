//WorldStats
//My first real project
//Started 4-11-15

/** Packages to install with NPM
bcrypt -- for password encryption (but require in user.js file)
body-parser -- for response handling
ejs -- for view files
express
express-session
method-override -- to enable PUT/PATCH and DELETE verbs
pg
pg-hstore
sequelize -- for database interaction
session
**/

//REQUIRE the needed libraries
var bodyParser = require('body-parser');
var express = require('express');
var methodOverride = require('method-override');
var pg = require('pg');
var request = require('request'); //needed for HTTP API access
var session = require('express-session');
//var sql = require('./models'); //include the PostgreSQL database ***
var app = express(); //begin express ***

//APP.SET to set main settings
app.set("view engine","ejs");

//APP.USE for middleware
app.use(bodyParser.urlencoded({extended: true})); //***
app.use(express.static('static')); //the 'static' directory holds CSS files, images, etc.
app.use(methodOverride("_method")); //***
app.use(session({ //***
    secret: 'only for Worldstats',
    resave: false,
    saveUninitialized: true
}));
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

