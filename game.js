var bodyParser = require('body-parser');
var express = require('express');
var methodOverride = require('method-override');
var pg = require('pg');
var request = require('request'); //needed for HTTP API access
var session = require('express-session');
var sql = require('./models'); //include the PostgreSQL database ***
var app = express();

 //THESE ARE VARIOUS 'SUPPORTING' FUNCTIONS FOR PLAYBALL and game operation in general

var getMetricInfo = function (metricNumber) {
    //This function takes in a metric number (ID # in SQL or, initially, hard-coded key in object) and returns an object with the essential information about each metric.
    //Structure of result should be as follows:
    // {"metricCode":"","metricDescription":"","metricShortName":"","metricSelectionType":""}

    //Until metric information is moved to SQL database, it is hard-coded in array below:

    var metricObject = {
        "1": {
            "metricCode":"AG.LND.FRST.ZS",
            "metricDescription":"Forest area is land under natural or planted stands of trees of at least 5 meters in size, whether productive or not, and excludes tree stands in agricultural production systems (for example, in fruit plantations and agroforestry systems) and trees in urban parks and gardens.",
            "metricShortName":"% of land that is forest.",
            "selectionType":"random"},
        "2": {
            "metricCode":"EP.PMP.SGAS.CD",
            "metricDescription":"Fuel prices refer to the pump prices of the most widely sold grade of gasoline. Prices have been converted from the local currency to U.S. dollars. (1 gallon is 3.78 liters)","metricShortName":"Gas price at the pump per liter in USD (1 gallon is 3.78 liters)","selectionType":"random"},
        "3": {"metricCode":"SE.PRM.ENRL.TC.ZS","metricDescription":"Pupil-teacher ratio, primary school, is the number of pupils enrolled in primary school divided by the number of primary school teachers.","metricShortName":"Pupil-teacher ratio, primary school","selectionType":"random"},
        "4": {"metricCode":"EG.ELC.ACCS.ZS","metricDescription":"Access to electricity is the percentage of population with access to electricity.","metricShortName":"% access to electricity","selectionType":"random"},
        "5": {"metricCode":"SH.XPD.PCAP","metricDescription":"Total health expenditure is the sum of public and private health expenditures as a ratio of total population. It covers the provision of health services (preventive and curative), family planning activities, nutrition activities, and emergency aid designated for health but does not include provision of water and sanitation. Data are in current U.S. dollars.","metricShortName":"Health expenditure per capita (current US$)","selectionType":"random"},
        "6": {"metricCode":"IT.NET.USER.P2","metricDescription":"Internet users are defined as people with access to the worldwide network.","metricShortName":"Internet users per 100 people","selectionType":"random"},
        "7": {"metricCode":"SP.DYN.LE00.MA.IN","metricDescription":"Life expectancy at birth indicates the number of years a newborn infant would live if prevailing patterns of mortality at the time of its birth were to stay the same throughout its life","metricShortName":"Life expectancy at birth, male","selectionType":"random"},
        "8": {"metricCode":"SP.URB.TOTL.IN.ZS","metricDescription":"Urban population refers to people living in urban areas as defined by national statistical offices. It is calculated using World Bank population estimates and urban ratios from the United Nations World Urbanization Prospects.","metricShortName":"Urban Population (% of total)","selectionType":"random"},
        "9": {"metricCode":"SH.DYN.AIDS.ZS","metricDescription":"Prevalence of HIV refers to the percentage of people ages 15-49 who are infected with HIV","metricShortName":"Prevalence of HIV (% of population ages 15-49)","selectionType":"random"},
        "10": {"metricCode":"EN.ATM.CO2E.PC","metricDescription":"Carbon dioxide emissions are those stemming from the burning of fossil fuels and the manufacture of cement. They include carbon dioxide produced during consumption of solid, liquid, and gas fuels and gas flaring.","metricShortName":"CO2 emissions (metric tons per capita)","selectionType":"random"},
    };

    return metricObject[metricNumber];
};

var randomOrder = function(maximum){
            //This function should return an array with numbers from 1 to max (parameter) in a random order, without any duplicates.
            //This will be used ONCE AT THE START OF EACH GAME to determine the order of the metrics in each round.
            //NEED TO MAKE SURE resulting array is "saved" and not regenerated (with new order) each round

            //ALSO NOTE: Putting 0 in 0th place of array, b/c access to this array is done on a first element = 1 not 0 basis

          var order = [0];

            do{
                num = Math.floor(Math.random()*maximum)+1;
                if (order.indexOf(num) === -1) {
                    order.push(num);
                };
            }while(order.length < maximum);
            
            return order;
        };

var randomSelection = function(quantity,maximum){
    //return array of QUANTITY numbers from 0 to MAXIMUM without any duplicates

    var randomList = [];

    do{
        num = Math.floor(Math.random()*maximum);
        if (randomList.indexOf(num) === -1) {
            randomList.push(num);
        };
    }while(randomList.length < quantity);
    
    return randomList;
};

var randomReorder = function(oldArray){
    //this function returns a new array of arrays with the same elements as the old arrays but with the 0th objects in a new, random order

    var newPattern = randomSelection(oldArray.length,oldArray.length);
    var newArray = [];
    
    for (var i = 0; i < newPattern.length; i++) {
        nextRandom = newPattern[i];
        console.log(nextRandom);
        newArray.push([oldArray[nextRandom][0],oldArray[i][1]]);
    };
    return newArray;
};

var sortArrayPairs = function(array){
    //This will be function that takes in an array and sorts it -- the catch is that the array is actually an array of objects, and it needs to sort each object by the "value" key pair in the object.
    //For now, it won't do anything -- but I want the placeholder function to be ready and it is called from other places.

    return array;
};

module.exports = function(req,res,next) {
    req.setupGame = function(){
    console.log("Hello from req.setupGame");
        //add initial values to req.session.gameScore (example)
        //call this from pregame when ready to play
    req.session.gameScore = 0; //How many points has player earned in this game so far?
    req.session.currentRound = 1; //Which round is player currently playing?
    req.session.nextRound = 1; //just define it this way for starting condition
    req.session.maxRounds = 6; //How many rounds ends the game?
    req.session.countriesPerRound = 4; //How many countries are displayed in a given round? Change this to make game harder or easier.  Maybe even pass this in as a parameter to playBall function for multiple level options...
    req.session.currentMetricNum = 0; //this is internal ID # of the current metric
    req.session.gameMetricOrder = []; //this is array, set once at the start of each game, with order of metrics to use this particular game
    req.session.gameSummary = []; //Keep track of each round's "action" for final summary --> structure is:
            //          [roundNumber, metricShortName, roundScore]
    req.session.countryAndValueData = []; //array of countries and values for scoring
    req.session.metricShortName = "";

    //Choose a random order of metrics before the first round
    //req.session.gameMetricOrder = randomOrder(req.session.maxRounds); //OLD WAY -- Only randomized within first maxRounds # of metrics -- so if playing game of 3 rounds, only used 1st 3 metrics. Not right.
    req.session.gameMetricOrder = randomSelection(req.session.maxRounds,10); //This should randomize using all of the 10 metrics in metricObject.  If there were not scope issues, then could use: Object.keys(metricObject).length to get # of metrics in metricObject, but it is not available here

    };
    console.log("Game order -- inside of req.setupGame");
    console.log(req.session.gameMetricOrder);

    req.playBall = function(nextFun) {
        console.log("Hello from playBall");

        /**
        Some helpful terminology:
        A GAME is a set of ROUNDS
        A ROUND is a combination of a QUESTION and an ANSWER
        A QUESTION has a set of COUNTRY NAMES and COUNTRY VALUES for a given METRIC
        **/

        //Declare empty variables that are used in each ROUND
        var questionData = [], //country name and value pairs for a given round
                //possible structure [{"name":"___","value":##}]
           // answerData = [], //WHAT PLAYER ANSW"ERS -- STRUCTURE TBD ***
            roundData = {  //the data that will be presented on the Question page in a given round.
                "metricShortName":"",
                "metricDescription":"",
                "round":1,
                "score":0,
                "screenName":"",
                "countryAndValueData":[],
                "randomList":[]
            }; 

        //Increment to next round
        req.session.currentRound = req.session.nextRound; //nextRound has already be incremented
        console.log("Current round is now ",req.session.currentRound);

        var getDataWB = function(whichMetricCode){
            //This function takes in a World Bank "Indicator" code and uses the World Bank API to request that data and then parse and clean the data for use in the WorldStats app.
            //This function will return an array of Country Name and Country Value for this particular indicator.

            console.log("Hello from inside getDataWB");

            var urlWB = "http://api.worldbank.org/countries/all/indicators/"+whichMetricCode+"?format=json&&MRV=1&&per_page=400";
            console.log(urlWB);

            var blackListedCountries=["1A", "XT", "S1","XD","8S","S4","OE","XY","XP","ZQ","XQ","S3","4E","F1","Z4","Z7","XR","7E","XS","XO","7E","XM","XN","ZJ","ZF","B8","S2","XU","XC","XJ","1W","XE","ZG","ZF"];

            request({url: urlWB, timeout: 6000}, function(error,response,body){
                console.log("Hello from inside request function")
                if (!error && response.statusCode === 200){

                    console.log("Hello from inside request if no error test");
                    var jsonData = JSON.parse(body);
                    var realData = jsonData[1]; //because first element of array is page data info

                    var countryName = "",
                        countryCode = ""
                        countryValue = 0;

                    for (var i = 0; i < realData.length; i++) {
                        countryName = realData[i].country.value;
                        countryCode = realData[i].country.id;
                        countryValue = (parseFloat(realData[i].value));

                       // console.log(countryName, countryCode, countryValue)

                      if ((typeof countryValue === 'number') && !(isNaN(countryValue))) { //prune out NaN and null and undefined rows // for some reason, typeof NaN === 'number' returns true! ***
                        if (blackListedCountries.indexOf(countryCode) === -1) {
                            questionData.push([countryName,countryValue]);
                        }
                      };
                    };
                       // console.log("This is questionData just after loop");
                       // console.log(questionData);
                }

                //NOW THAT WE HAVE *FULL* DATA SET FROM API, REDUCE IT TO WHAT IS NEEDED FOR THE ROUND

                //SORT

                questionData = sortArrayPairs(questionData);

                //SELECT

                questionData = selectLines(questionData);

                //CREATE RANDOM ORDER FOR COUNTRY DISPLAY
                //This will be the order countries appear on the Question page

                randomList = randomReorder(questionData);
                console.log("Order has been randomized");
                console.log("old order")
                console.log(questionData);
                console.log("new order");
                console.log(randomList);

                //Make object to pass to res.render for EJS view of Question page.

                roundData.round = req.session.currentRound; //was: currentRound;
                roundData.score = req.session.gameScore; //was: gameScore;
                roundData.metricShortName = currentMetricObject.metricShortName;
                roundData.metricDescription = currentMetricObject.metricDescription;
                roundData.countryAndValueData = questionData;
                roundData.randomList = randomList;

                roundData.screen_name = req.session.screen_name;

                //Add Country & Value info to req.session so can check answers for correctness and scoring

                req.session.countryAndValueData = roundData.countryAndValueData;
                req.session.metricShortName = roundData.metricShortName;

                //Increment nextRound to get ready for next question
                req.session.nextRound = req.session.currentRound+1;

                console.log("About to call next fun at end of NEW request call-back loop.")
                console.log("Here is the data to be sent");
                console.log(roundData);

                //THIS IS KEY!  This is CALLBACK for after asynchronous API request
                nextFun(roundData);
            });
        };

        var getRoundData = function(roundNumber){
            console.log("Hello from inside getRoundData");
            console.log("This is req.session.currentMetricNum")
            console.log(req.session.currentMetricNum);

            req.session.currentMetricNum = req.session.gameMetricOrder[roundNumber];
            
            console.log("current metric num");
            console.log(req.session.currentMetricNum);

            currentMetricObject = getMetricInfo(req.session.currentMetricNum); //this is object
            
            currentMetricCode = getMetricInfo(req.session.currentMetricNum).metricCode;

            console.log("current metric code");
            console.log(currentMetricCode);

            getDataWB(currentMetricCode); //Call the API download function
            console.log("I should never see this -- inside getRoundData but AFTER calling getDataWB");
        };

    var selectLines = function(fullData){
        //This will take in the full dataset from WorldBank for a given metric and return just the data that is needed for the given round -- limited by the number set in countriesPerRound
        //IN THE FUTURE, use a particular selection type (e.g., bias to top, to bottom, quartiles, etc.) but for now, just use random selection

        //Variables this uses, already defined:
        // currentMetricObject -- object with all info about the current metric

        //Variables this users, defined herein:
        // whichLines -- array with numbers showing which lines from full data should be used for particular question
        // selectedData -- new array with just the selected lines to be presented to user

        console.log("Hello from inside selectLines")

        var whichLines = [],
            selectedData = [];

        var highestCountry = fullData.length;

        console.log("Highest country #");
        console.log(highestCountry);

        if (currentMetricObject.selectionType === "random"){
            console.log("I am random.  This is good");
            whichLines = randomSelection(req.session.countriesPerRound,highestCountry);
        };

        if (currentMetricObject.selectionType === "quartiles"){
            //select one line from each quarter of range
        };

        console.log("whichLines");
        console.log(whichLines);

        for (var i = 0; i < whichLines.length; i++) {

            console.log("Inside for loop to select data");
            console.log(fullData[whichLines[i]])

            selectedData.push(fullData[whichLines[i]]);
        };

        console.log("seletedData")
        console.log(selectedData);

        return selectedData;
    };

    //Get ready to play -- done with function declarations and start doing some calling!

    //Get data for the current round!

    getRoundData(req.session.currentRound);

    console.log("End of playball!");
    }; //end of PlayBall
    next();
};