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
var sql = require('./models'); //include the PostgreSQL database ***
var app = express(); //begin express ***

//APP.SET to set main settings
app.set("view engine","ejs");

//APP.USE for middleware elements
app.use(bodyParser.urlencoded({extended: true})); //***
app.use(methodOverride("_method")); //***
app.use(express.static('static')); //the 'static' directory holds CSS files, images, etc.
app.use(session({ //***
    secret: 'only for Worldstats',
    resave: false,
    saveUninitialized: true
}));
app.use('/', function(req,res,next){
    req.login = function(user){
        req.session.userId = user.id;
    };
    req.currentUser = function() {
        return sql.Player.find({
            where: { id: req.session.userId }
        }).then(function(user) {
            req.user = user;
            return user;
        })
    };
    req.logout = function() {
        req.session.userId = null;
        req.user = null;
    };
    next(); //move on to next middleware
});

//Define the various ROUTES

//Public routes available without login are: 1) welcome page, 2) high scores page, 3) signup page

//ROOT route for welcome page
app.get('/', function(req,res){
    console.log("Hello world!");
    res.render('index.ejs');
  //  res.send("Hello WorldStats!");
});

//High scores page
app.get('/scores', function(req,res){
    res.render('highscores.ejs');
//    res.send("This is the high scores page! Top score is still 0");
});

//Create new player page
app.get('/players/new', function(req,res){
    res.render('signup.ejs');
//    res.send("Be a player!");
});

//Once user submits form on create new player page, process info with route below:
app.post('/players', function(req,res){
    var newScreenName = req.body.signupScreenName;
    var newEmail = req.body.signupEmail;
    var newPassword = req.body.signupPassword;
    console.log(newScreenName,newEmail,newPassword);
    console.log(typeof sql.Player.createSecure);
    sql.Player.createSecure(newScreenName,newEmail,newPassword).then(
        function(newUser){
            res.redirect('/login');
        });
});

//Login page
app.get('/login', function(req,res){
    res.render('login.ejs');
//    res.send("Please log in to start playing");
});

//Private routes that are only available to players after log-in

//Profile page
app.get('/players/:id', function(req,res){ //*** CONFIRM THIS WORKS AS URL PARAM
    res.send("Profile page");
})

app.get('/pregame', function(req,res){
    res.send("Pregame for a logged-in player");
})

//Question page --> possibly app.get '/question'

//Answer page --> possibly app.get '/answer'

//Postgame page --> possibly app.get '/postgame'

//Start the server listening on port 3000
app.listen(3000, function (){
    console.log("Don't blame me. I'm an interpreter. I'm not supposed to know a power socket from a computer terminal. ");
});

