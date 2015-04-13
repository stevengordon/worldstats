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
                 //this means no user was returned (false was returned), so login credentials invalid
                res.render('login.ejs'); //*** Add "login failed" error message to user
            }
        })
});

//Private routes that are only available to players after log-in

//Profile page
app.get('/players/:id', function(req,res){ //*** STILL TO CONFIRM THIS WORKS AS URL PARAM
    res.send("Profile page");
})

//Pregame page
app.get('/pregame', function(req,res){
    res.send("This will be pregame page once player logs in");
})

//Question page

app.get('/question', function(req,res){
    var renderIt = function(data){
        res.render('question.ejs',{ejsQuestionData:data});

//        res.send(data);
    };
    playBall(renderIt);
});

//Answer page --> possibly app.get '/answer'

//Postgame page --> possibly app.get '/postgame'

//Core game-play function

var playBall = function(nextFun) {

    /**
    Some helpful terminology:
    A GAME is a set of ROUNDS
    A ROUND is a combination of a QUESTION and an ANSWER
    A QUESTION has a set of COUNTRY NAMES and COUNTRY VALUES for a given METRIC
    **/

    //Set variables for each GAME

    var gameScore = 0, //How many points has player earned in this game so far?
        currentRound = 1, //Which round is player currently playing?
        maxRounds = 10, //How many rounds ends the game?
        countriesPerRound = 4, //How many countries are displayed in a given round? Change this to make game harder or easier.  Maybe even pass this in as a parameter to playBall function for multiple level options...
        currentMetricNum = 0, //this is internal ID # of the current metric
        gameMetricOrder = [], //this is array, set once at the start of each game, with order of metrics to use this particular game
        gameSummary = []; //Keep track of each round's "action" for final summary --> structure is:
                 // [roundNumber, metricShortName, roundScore]

    //Declare empty variables that are used in each ROUND
    var questionData = [], //country name and value pairs for a given round
            //possible structure [{"name":"___","value":##}]
        answerData = [], //WHAT PLAYER ANSW"ERS -- STRUCTURE TBD ***
        roundData = {  //the METRIC that will be presented in a given round.
            "metricCode":"",
            "metricDescription":"",
            "metricShortName":"",
            "metricSelectionType":""}; 

    //THESE ARE VARIOUS 'SUPPORTING' FUNCTIONS FOR PLAYBALL. *** CONSIDER WHETHER THEY SHOULD LIVE INSIDE OF OR OUTSIDE OF PLAYBALL.

    var randomOrder = function(max){
        //This function should return an array with numbers from 1 to max (parameter) in a random order, without any duplicates.
        //This will be used ONCE AT THE START OF THE GAME to determine the order of the metrics in each round.
        //NEED TO MAKE SURE resulting array is "saved" and not regenerated (with new order) each round

        //TEMPORARY SOLUTION IN PLACE NOW, HARD-CODING RATHER THAN RANDOMIZING ORDER ***

        //ALSO NOTE: Putting 0 in 0th place of array, b/c access to this array is done on a first element = 1 not 0 basis

        var order = [0,1,2,3,4,5,6,7,8,9,10];

        return order;
    };

    var getMetricInfo = function (metricNumber) {
        //This function takes in a metric number (ID # in SQL or, initially, hard-coded key in object) and returns an object with the essential information about each metric.
        //Structure of result should match the roundData object declared elsewhere:
        // {"metricCode":"","metricDescription":"","metricShortName":"","metricSelectionType":""}

        //Until metric information is moved to SQL database, it is hard-coded in array below:

        var metricObject = {
            "1": {"metricCode":"AG.LND.FRST.ZS","metricDescription":"Forest area is land under natural or planted stands of trees of at least 5 meters in size, whether productive or not, and excludes tree stands in agricultural production systems (for example, in fruit plantations and agroforestry systems) and trees in urban parks and gardens.","metricShortName":"% of land that is forest.","selectionType":"normal"},
            "2": {"metricCode":"EP.PMP.SGAS.CD","metricDescription":"Fuel prices refer to the pump prices of the most widely sold grade of gasoline. Prices have been converted from the local currency to U.S. dollars. (1 gallon is 3.78 liters)","metricShortName":"Gas price at the pump per liter in USD (1 gallon is 3.78 liters)","selectionType":"normal"},
            "3": {"metricCode":"SE.PRM.ENRL.TC.ZS","metricDescription":"Pupil-teacher ratio, primary school, is the number of pupils enrolled in primary school divided by the number of primary school teachers.","metricShortName":"Pupil-teacher ratio, primary school","selectionType":"normal"},
            "4": {"metricCode":"EG.ELC.ACCS.ZS","metricDescription":"Access to electricity is the percentage of population with access to electricity.","metricShortName":"% access to electricity","selectionType":"normal"},
            "5": {"metricCode":"SH.XPD.PCAP","metricDescription":"Total health expenditure is the sum of public and private health expenditures as a ratio of total population. It covers the provision of health services (preventive and curative), family planning activities, nutrition activities, and emergency aid designated for health but does not include provision of water and sanitation. Data are in current U.S. dollars.","metricShortName":"Health expenditure per capita (current US$)","selectionType":"normal"},
            "6": {"metricCode":"IT.NET.USER.P2","metricDescription":"Internet users are defined as people with access to the worldwide network.","metricShortName":"Internet users per 100 people","selectionType":"normal"},
            "7": {"metricCode":"SP.DYN.LE00.MA.IN","metricDescription":"Life expectancy at birth indicates the number of years a newborn infant would live if prevailing patterns of mortality at the time of its birth were to stay the same throughout its life","metricShortName":"Life expectancy at birth, male","selectionType":"normal"},
            "8": {"metricCode":"SP.URB.TOTL.IN.ZS","metricDescription":"Urban population refers to people living in urban areas as defined by national statistical offices. It is calculated using World Bank population estimates and urban ratios from the United Nations World Urbanization Prospects.","metricShortName":"Urban Population (% of total)","selectionType":"normal"},
            "9": {"metricCode":"SH.DYN.AIDS.ZS","metricDescription":"Prevalence of HIV refers to the percentage of people ages 15-49 who are infected with HIV","metricShortName":"Prevalence of HIV (% of population ages 15-49)","selectionType":"normal"},
            "10": {"metricCode":"EN.ATM.CO2E.PC","metricDescription":"Carbon dioxide emissions are those stemming from the burning of fossil fuels and the manufacture of cement. They include carbon dioxide produced during consumption of solid, liquid, and gas fuels and gas flaring.","metricShortName":"CO2 emissions (metric tons per capita)","selectionType":"normal"},
        };

        return metricObject[metricNumber];
    };

    var sortArray = function(array){
        //This will be function that takes in an array and sorts it -- the catch is that the array is actually an array of objects, and it needs to sort each object by the "value" key pair in the object.
        //For now, it won't do anything -- but I want the placeholder function to be ready and it is called from other places.

        return array;
    };

    var getDataWB = function(whichMetricCode){
        //This function takes in a World Bank "Indicator" code and uses the World Bank API to request that data and then parse and clean the data for use in the WorldStats app.
        //This function will return an array of Country Name and Country Value for this particular indicator.

        console.log("Hello from inside getDataWB");

        var urlWB = "http://api.worldbank.org/countries/all/indicators/"+whichMetricCode+"?format=json&&MRV=1&&per_page=400";
        console.log(urlWB);

        request({url: urlWB, timeout: 6000}, function(error,response,body){
            console.log("Hello from inside request function")
            if (!error && response.statusCode === 200){

                console.log("Hello from inside request if no error test");
                var jsonData = JSON.parse(body);
                var realData = jsonData[1]; //because first element of array is page data info

                var countryName = "",
                    countryValue = 0;

                for (var i = 0; i < realData.length; i++) {
                    countryName = realData[i].country.value;
                    countryValue = parseFloat(realData[i].value);

                    console.log(countryName,countryValue)

                  if ((typeof countryValue === 'number') && !(isNaN(countryValue))) { //prune out NaN and null and undefined rows // for some reason, typeof NaN === 'number' returns true! ***
                        questionData.push([countryName,countryValue]);
                    };
                };
                    console.log("This is questionData just after loop");
                    console.log(questionData);
            }
            console.log("About to call next fun at end of NEW request call-back loop.")
            nextFun(sortArray(questionData)); //CALLBACK AFTER ASYNC API REQUEST
        });

        console.log("This is question data inside getDataWB")
        console.log(questionData);
    };

    var getRoundData = function(roundNumber){
        console.log("Hello from inside getRoundData");

        currentMetricNum = gameMetricOrder[roundNumber];
        
        console.log("current metric num");
        console.log(currentMetricNum);
        
        currentMetricCode = getMetricInfo(currentMetricNum).metricCode;


        console.log("current metric code");
        console.log(currentMetricCode);

        getDataWB(currentMetricCode); //Call the API download function
        console.log("I should never see this -- inside getRoundData but AFTER calling getDataWB");
    };

//Get ready to play -- done with function declarations and start doing some calling!

//set gameMetricOrder *ONCE* before starting iteration through rounds
//Move this to PREGAME page, so it happens just once?
gameMetricOrder = randomOrder(maxRounds);

console.log("Game order");
console.log(gameMetricOrder);

//Get data for the current round!

getRoundData(currentRound);

console.log("End of playball!");
}; //end of PlayBall



//Start the server listening on port 3000
app.listen(3000, function (){
    console.log("Don't blame me. I'm an interpreter. I'm not supposed to know a power socket from a computer terminal. ");
});

