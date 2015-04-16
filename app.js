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
request
sequelize -- for database interaction
sequelize-cli
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
var app = express(); //begin express **

//This is secondary JS file with most of the game logic
var gameStuff = require('./game');

//APP.SET to set main settings
app.set("view engine","ejs");

//APP.USE for middleware elements
app.use(bodyParser.urlencoded({extended: true})); //***
app.use(methodOverride("_method")); //***
app.use(express.static('public')); //the 'static' directory holds CSS files, images, etc.
app.use(session({ //***
    secret: 'only for Worldstats',
    resave: false,
    saveUninitialized: true
}));

app.use('/', function(req,res,next){
    req.login = function(user){
        req.session.userId = user.id;
        req.session.screen_name = user.screen_name;
    };
    req.currentUser = function() { ///***** WHY DOES THIS HAVE TWO RETURN STATEMENTS
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
    },
    gameStuff); //can only have one '/' level app to use, so put in gameStuff here

var loggedIn = function(req,res,next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/');
    }
};

//For every page that should be limited when a Player is logged in, apply loggedIn middleware below:
app.use('/question', loggedIn);
app.use('/answer',loggedIn);
app.use('/profile',loggedIn);
app.use('/pregame',loggedIn);
app.use('/nextquestion',loggedIn);

//Define the various ROUTES

//Public routes available without login are: 1) welcome page, 2) high scores page, 3) signup page

//ROOT route for welcome page
app.get('/', function(req,res){
    console.log("Hello world!");
    res.render('index.ejs');
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
});

app.post('/login', function(req,res){
    var uScreenName = req.body.loginScreenName;
    var uPassword = req.body.loginPassword;
    console.log(uScreenName,uPassword);

    sql.Player.authenticate(uScreenName,uPassword).then(
        function(user){
            if (user) {
                //this means a user was returned by authenticate function, so password valid
                req.login(user);
                res.redirect('/pregame');
            } else {
                 //this means no user wa`s returned (false was returned), so login credentials invalid
                res.render('login.ejs'); //*** Add "login failed" error message to user
            }
        })
});

//Logout page
app.get('/logout', function(req,res){
    req.logout();
    res.redirect('/');
});

//Private routes that are only available to players after log-in

//Profile page -- for edit
// app.get('/players/:id', function(req,res){ //*** STILL TO CONFIRM THIS WORKS AS URL PARAM
    
//     console.log("Hello from profile page")
//     console.log(req.currentUser);
//     res.send(currentUser);
// })


//Real profile page
app.get('/profile', function(req,res){

    console.log("Hello from profile route");

    var scoreObject = {};
    var profileObject = {};
    
    req.currentUser().then(function(foundPlayer){
        console.log("This is found player",foundPlayer);
        if (foundPlayer) {
            console.log("We just iffed")
            sql.Score.findAll({where: {PlayerId:req.session.userId}, limit: 3, order: '"game_score" DESC'}).then(function(myScores){

            //     console.log("This is myScores Mike")
            //    console.log(myScores);
               
               scoreObject = myScores;

            //    console.log("length of scoreObject");
            //    console.log(scoreObject.length);

            //    //THIS NEXT LOG WORKS

            //     console.log("scoreObject[1].dataValues.game_score")
            //     console.log(scoreObject[1].dataValues.game_score);

            //     console.log("scoreObject[0].dataValues.game_score")
            //     console.log(scoreObject[0].dataValues.game_score);
                
             profileObject = {"score":scoreObject,"player":foundPlayer};

            // profileArray = [foundPlayer, scoreObject];
            // console.log("This is scoreObject")
            // console.log(scoreObject);

            res.render('profile',{ejsProfile:profileObject});
             }) //end of myScores function


            // console.log("typeof scoreObject")
            // console.log(typeof scoreObject)

            //BUT THIS LOG OF THE SAME ITEM DOES NOT -- SCOPE ISSUE
           // console.log("scoreObject[1].dataValues.game_score")
           // console.log(scoreObject[1].dataValues.game_score);


            // console.log("profileArray[1]");


            // console.log(profileArray[1]);


            // console.log("profileObject.score")
            // console.log(profileObject.score);

            //<!-- Here is another score # on dataValues:
    //<%//=ejsProfile.scoreObject.dataValues[1].game_score%>


            //res.render('profile',{ejsProfile:profileObject});
        } else {
            res.redirect('/login');
        }
    })
});

/** Testing the shift of game code to separate file
 // and shift of game-consistent variables to req.session.varName

app.get('/teststeven',function(req,res){
    req.setupGame();
    //console.log()
    res.redirect('/isworking');
});

app.get('/isworking', function(req,res){
    console.log(req.session.gameScore);
});
**/

//Pregame page
app.get('/pregame', function(req,res){
    req.currentUser().then(function(foundPlayer){
        if (foundPlayer) {
            req.setupGame(); //initialize what is needed for the game
            res.render('pregame',{ejsFoundPlayer:foundPlayer});
        } else {
            res.redirect('/login');
        }
    })
});

//Question page
app.get('/question', function(req,res){
    var renderIt = function(data){
        res.render('question.ejs',{ejsQuestionData:data});
    };
    req.playBall(renderIt);
});

//Answer page
app.get('/answer', function(req,res){
    console.log("Hello from answer page");
    //console.log("This is player answer ",req.query);

    //console.log("This is req.session", req.session);

    var playerAnswer = [];
    var correctAnswer =  [];
    var answerCountryandValue = req.session.countryAndValueData;

    for (var id in req.query) {
        playerAnswer.push(req.query[id]);

       // console.log("\n\n\nTHIS IS THE VAL",id, req.query[id]);
    };

    for (var i = 0; i < answerCountryandValue.length; i++) {
        correctAnswer.push(answerCountryandValue[i][0]);
    };

    console.log("playerAnswer",playerAnswer);
    console.log("correctAnswer",correctAnswer);

    //Send player answer and real answer to get scored

    playerResults = compareAnswers(playerAnswer,answerCountryandValue);

    //Use the score results to update score

    req.session.gameScore += playerResults.numCorrect;

    //ALSO NEED TO ADD INCREMENT TO PLAYER'S CUMULATIVE LIFETIME SCORE ***

    //Add info to gameSummary which is in req.session

    req.session.gameSummary.push([req.session.currentRound,req.session.metricShortName,req.session.gameScore]);

    console.log("this is gameSummary")
    console.log(req.session.gameSummary);

    console.log("playerResults")
    console.log(playerResults);

    res.render('answer.ejs',{ejsAnswer:playerResults});
});

var compareAnswers = function(playerAnswer,fullAnswer){
    //this takes two arrays and compares how many items are the same and provides an object back with:
    // {"numCorrect":#,
    // "whichWrong":[index #s of wrong answer, wrong answer ];

    console.log("Hello from compareAnswers");

    var correctScore = 0;
    var answerMatrix = [];

    for (var i = 0; i < fullAnswer.length; i++) {
        if (playerAnswer[i] === fullAnswer[i][0]) {
            correctScore++;
            answerMatrix.push([fullAnswer[i][0],fullAnswer[i][1],"Correct"]);
        } else {
            answerMatrix.push([fullAnswer[i][0],fullAnswer[i][1],playerAnswer[i]]);
        }
    };

    var scoreKey = {
        "numCorrect":correctScore,
        "answerKey":answerMatrix
    };

    return scoreKey;
};

app.get('/nextquestion', function(req,res){
    if (req.session.nextRound >= req.session.maxRounds) { 
        //nextRound was already incremented in game.js -- so if nextRound is already beyond maxRounds, then game over!
        console.log("Start gameover process");
        console.log(req.session.gameSummary);

        //Assemble object with data to present on gameover page 
        //FOR NOW JUST PASS FINAL SCORE AS MVP APPROACH ***

        var gameFinalStats = {"finalScore":req.session.gameScore}; //NEED TO ADD ADDITIONAL DATA TO OBJECT

        console.log("req.session.gameScore is",req.session.gameScore);
        console.log("req.session.maxRounds is ",req.session.maxRounds);
        console.log("req.session.countriesPerRound is ",req.session.countriesPerRound);

        //Increment this player's CUMULATIVE score in Player table


        sql.Player.find({where:{id:req.session.userId}}).then(function(whoPlayed){
            console.log("Hello from cumulative update")
            var lifetime = whoPlayed.cumulative_score;

            console.log("Prior lifetime score ",lifetime);

            lifetime += req.session.gameScore;

            console.log("New lifetime score ",lifetime);

            whoPlayed.cumulative_score = lifetime; whoPlayed.save();})

        //Post scores to Score table in SQL and then render gameover page

            //POSTING DIRECTLY, RATHER THAN CALLING AN INSTANCE METHOD

            console.log("Hello from inbetween the two SQL calls")

        var now = new Date();

        sql.Score.create({
            game_score:req.session.gameScore,
            rounds_played:req.session.maxRounds,
            date_played:now,
            PlayerId: req.session.userId,
            countries_per_round: req.session.countriesPerRound
        }).then(function(){
            console.log("COUNTRIED PER ROUND", req.session.countriesPerRound);
            res.render('gameover.ejs',{ejsGameStats:gameFinalStats});
        })

        // console.log("About to call addNewScore")

        // req.currentUser().then(function(who){
        //     if (who) {
        //         who.addNewScore(req.session.gameScore,req.session.maxRounds).then(function(){
        //             res.render('gameover.ejs',{ejsGameStats:gameFinalStats});
        //         })
        //     } else {
        //         //here if no current user found... should not happen if authorization works right
        //         res.redirect('/login');
        //     }
        // })

    } else { //still playing, so reload question page
        res.redirect('/question');
    }
});


// //Postgame page
// app.get('/postgame',function(req,res){
//     res.render('gameover.ejs',{ejsGameSummary:req.session.gameSummary});
// });

app.get('/startover', function(req,res){
    console.log("Hello from startover route");
    res.redirect('/pregame');
});



//Start the server listening on port 3000
app.listen(process.env.PORT || 3000, function (){ //This allows app to run either via Heroku *or * locally
    console.log("Don't blame me. I'm an interpreter. I'm not supposed to know a power socket from a computer terminal. ");
});

