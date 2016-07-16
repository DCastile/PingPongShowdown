
'use strict';
console.log('entering matchStorage.js');
var	AlexaSkill = require('./AlexaSkill'),
	AWS = require("aws-sdk"),
	async = require("async"),
	moment = require("moment");
	moment().format();

var matchStorage = (function () {
 
	var docClient = new AWS.DynamoDB.DocumentClient();
	
	//var PingpongMatchesTable = 'PingpongMatches'; // FOR PRODUCTION
	var PingpongMatchesTable = 'PingpongMatches-Dev'; // FOR DEVELOPMENT	
	
	//var PingpongDevicesTable = 'PingpongDevices'; // FOR PRODUCTION
	var PingpongDevicesTable = 'PingpongDevices-Dev'; // FOR DEVELOPMENT	

    /*
     * The Match class stores all match states
     */
    function Match(session, data) {
    	console.log('entering Match function');
        if (data) {     	
            this.data = data;
            //console.log('successfully passed match data in: ' + JSON.stringify(this.data));
        } else { // no existing Match found for this Echo UserID within timeframe specified in query.
		
			var matchStart = new Date().getTime();
			console.log('matchStart = ' + matchStart);
			var readableTime = moment(matchStart).subtract(7, 'hours');
			console.log('readableTime 1 = ' + readableTime);
			readableTime = moment(readableTime).format('lll');
			console.log('readableTime 2 = ' + readableTime);
			
		
			var playerNameAlias = {	
					Red1: "TBD",
					Red2: "TBD",
					Blue1: "TBD",
					Blue2: "TBD"
            };
			
			var playerName = {	
					Red1: "TBD",
					Red2: "TBD",
					Blue1: "TBD",
					Blue2: "TBD"
            };			

			var serveSequence = [],	// specific serve sequence will be set by players, e.g. alpha, yankee, bravo, zulu
				newAfterPointJokes = [], // an array of index numbers for 'endOfPoint' jokes that have not yet been used in this match
				newAfterGameJokes = [] // an array of index numbers for 'endOfGame' jokes that have not yet been used in this match
		
			var newMatchScores = {	
					RedTeamGameScore: 0, // red team's score in the current game being played
					BlueTeamGameScore: 0, // blue team's score in the current game being played
					Game: 1, // the current game being played, 1-5, best 3 out of 5 is the winner
					Game1Score: "0 0", // set to format the score correctly based on winning team called out first
					Game2Score: "0 0", // set to format the score correctly based on winning team called out first
					Game3Score: "0 0", // set to format the score correctly based on winning team called out first
					Game4Score: "0 0", // set to format the score correctly based on winning team called out first
					Game5Score: "0 0", // set to format the score correctly based on winning team called out first
					PointsToServe: 5, // specifies how many points should be served by each team before serve rotates to the other team, official rules call for 2
					ExperiencedUserMode: false, // flag to indicate whether minimal words should be spoken. Default = false	
					SwitchSides: true, // flag to indicate whether players want to switch sides during the match. Default = true
					AnnounceServe: true, // flag to indicate whether or not to announce who's serve it is when starting a new game
					AnnounceScore: true, // flag to indicate whether or not to announce the score when starting a new game
					RedTeamTotalPointsWon: 0, // increments for every point won in the match by red
					BlueTeamTotalPointsWon: 0, // increments for every point won in the match by blue
					RedPointsServed: 0, // increments for every point served by red
					BluePointsServed: 0, // increments for every point served by blue
					RedPointsWonOnServe: 0, // increments for every point won in the match when serving
					RedPointsWonOffServe: 0, // increments for every point won in the match when not serving
					BluePointsWonOnServe: 0, // increments for every point won in the match when serving
					BluePointsWonOffServe: 0, // increments for every point won in the match when not serving
					RedTeamTotalGamesWon: 0, // increments for every game won in the match by red
					BlueTeamTotalGamesWon: 0, // increments for every game won in the match	by blue							
					WhosServe: "TBDServer", // set to whoever is currently serving, either 'red' or 'blue'
					MatchWinner: 0, // stores the winner of the match
					PlayerAlias: playerNameAlias, // correlates doubles players signed in to a given match with the call signs they are assigned
					PlayerName: playerName, // names of players signed in to the match
					FirstRedToServe: "AlphaOrBravo", // first to serve in a match on the red team, set by players
					FirstBlueToServe: "YankeeOrZulu", // first to serve in a match on the blue team, set by players
					DoublesServeSequence: serveSequence, // the sequence of serve in a doubles match depending on player input
					DoublesServer: "TBDDoublesServer", // set to the current server in a doubles match
					ScoreLastUpdated: '0', // set after each point in order to keep track of total match play time
					TimeOfFirstPoint: '0', // set after a team wins a point in a match in order to keep track of total match play time
					TwentyOnePointer: false, // set if players call for a 21 point game	
					RedPointStreak: 0, // increments when the current red point streak is extended
					MaxRedPointStreak: 0, // increments when the max red point streak is extended
					BluePointStreak: 0, // increments when the max blue point streak is extended	
					MaxBluePointStreak: 0, // increments when the max blue point streak is extended
					PointWinner: 'TBD', // used to refer back one point under nMinusOne to determine Point Streaks
					RallyForTheServe: false, // flag to indicate whether players are currently rallying to determine who serves first
					SassMeter: 5, // specifies the likelyhood of making a comment after a point is played, between 0 (no sass) and 10 (a comment every time)
					AfterPointJokes: newAfterPointJokes, // an array of index numbers for 'endOfPoint' jokes that have not yet been used in this match
					AfterGameJokes: newAfterGameJokes, // an array of index numbers for 'endOfGame' jokes that have not yet been used in this match
					GamesPerMatch: 1 // number of games per match, either 1 or 5 (best 3 out of 5)
					
            };
			
			var nMinusOne = { // set to equal Match Data after every change made in order to enable undo
				
            };

			var newMatchData = {
					EchoUserID: session.user.userId, // current session's userID
					MatchStartTime: matchStart, // current date & time in milliseconds since epoc
					ReadableStartTime: readableTime,
					Red1PlayerID: 0,
					Red2PlayerID: 0,
					Blue1PlayerID: 0,
					Blue2PlayerID: 0,
					MatchType: 'TBD',
					MatchData: newMatchScores,
					nMinusOne: nMinusOne
			};	
			
			this.data = newMatchData;				
            //console.log('no match data passed in. New Match data being established = ' + JSON.stringify(this.data));
        }
        console.log('exiting Match function');
    }

    Match.prototype = {
        save: function (callback) {
            console.log('entering Match.prototype save function');
			var currentMatchData = this.data;
			
			async.parallel([
				// save to PingpongDevicesTable
				function(callback) {
					var params = {
						TableName: PingpongDevicesTable,
						Item: 		{                  
										"EchoUserID": 		currentMatchData.EchoUserID, 
										"MatchStartTime":	currentMatchData.MatchStartTime                    
						}
					};

					docClient.put(params, function(err, data) {
						if (err) {
							console.log("Unable to save to PingpongDevicesTable. Error:", JSON.stringify(err, null, 2));
						} else {
							console.log("Saved to PingpongDevicesTable:", JSON.stringify(data, null, 2));
							callback();
						};
					});
				},
				
				// save to PingpongMatchesTable
				function(callback) {					
					var params = {
						TableName: PingpongMatchesTable,
						Item:	{
									"MatchStartTime": 		currentMatchData.MatchStartTime,
									"ReadableStartTime": 	currentMatchData.ReadableStartTime,
									"EchoUserID": 			currentMatchData.EchoUserID,
									"Red1PlayerID": 		currentMatchData.Red1PlayerID,
									"Red2PlayerID": 		currentMatchData.Red2PlayerID,
									"Blue1PlayerID": 		currentMatchData.Blue1PlayerID,
									"Blue2PlayerID": 		currentMatchData.Blue2PlayerID,
									"MatchType": 			currentMatchData.MatchType,
									"MatchData": 			currentMatchData.MatchData,
									"nMinusOne": 			currentMatchData.nMinusOne
						}																				
					};			

					docClient.put(params, function(err, data) {
						if (err) {
							console.log("Unable to save to PingpongMatchesTable. Error:", JSON.stringify(err, null, 2));
						} else {
							console.log("Saved to PingpongMatchesTable:", JSON.stringify(data, null, 2));
							callback();
						};
					});								
				}
				
			], function(err) { //This function gets called after the two tasks have called their "task callbacks"
					if (err) {
						console.log("Unable to save to PingpongMatchesTable. Error:", JSON.stringify(err, null, 2));
					} else {
						console.log("Successfully saved to both PingpongMatchesTable and PingpongDevicesTable:");
					};
					
					if (callback) {
						callback();
					};
				
					console.log('exiting Match.prototype save function');				
			});				                   
        }
    };

    return {
        loadMatch: function (session, callback) {

			console.log('entering matchStorage.loadMatch function');
			/*
			if (session.attributes.currentMatch) {
                console.log('Existing session has the match data, so getting it from session = ' + JSON.stringify(session));
                callback(new Match(session, session.attributes.currentMatch));
                return;
            }
			*/            
			//console.log('Existing session does not have the match data, so getting it from DynamoDB data store');
			var rightNow = new Date().getTime();
			var hoursAgo = (new Date().getTime() - (2*60*60*1000) ); 	// will find a match if the match start time was within the last 2 hours
																			
			var queryDevicesParams = {

				TableName : PingpongDevicesTable, 
				ConsistentRead: true,
				KeyConditionExpression: "EchoUserID = :EchoUserID AND MatchStartTime BETWEEN :hoursAgo AND :rightNow",
				ExpressionAttributeValues: {
					":EchoUserID": session.user.userId,
					":rightNow": rightNow, 
					":hoursAgo": hoursAgo       
				}
			};

            docClient.query(queryDevicesParams, function (err, data) {
				
				var currentMatch;
                if (err) {
                	console.log('there was an error in query to matchKeeperDevicesTable, info follows: ');
                    console.log(err, err.stack);
					currentMatch = 'errorLoadingMatch';
                    callback(currentMatch);
                } else if (data.Items[data.Count - 1] === undefined) {
                	console.log('Data was loaded from PingpongDevicesTable without error, but data.Items[data.Count - 1] was undefined');
					currentMatch = 'matchNotFound';
					console.log('type of currentMatch = ' + typeof(currentMatch));
                    callback(currentMatch);
                } else {
                    //console.log('Matches in the last 4 hrs pulled from dynamodb = ' + JSON.stringify(data) );					
					var startTimeKey = data.Items[data.Count - 1].MatchStartTime;
					console.log('startTimeKey = ' + startTimeKey);
										
					var getMatchParams = {
						
						TableName: PingpongMatchesTable,
						Key: {
								"MatchStartTime": 	startTimeKey,
								"EchoUserID": 		session.user.userId		
						}
					};

					docClient.get(getMatchParams, function (err, data) {
												
						if (err) {
							console.log('there was an error in Get to PingpongMatchesTable, info follows: ');
							console.log(err, err.stack);
							currentMatch = 'errorLoadingMatch';
							callback(currentMatch);
						} else if (data.Item === undefined) {
							console.log('Data was loaded from PingpongMatchesTable without error, but data.Item was undefined');
							currentMatch = 'matchNotFound';
							callback(currentMatch);
						} else {
							//console.log('data.Item = ' + data.Item);
							currentMatch = new Match( session, data.Item );
							//console.log('currentMatch obj created after loading = ' + JSON.stringify(currentMatch) );		
							session.attributes.currentMatch = currentMatch.data;
							callback(currentMatch);
						};
					});
                };
            });
        },
		
        newMatch: function (session, callback) {
			console.log('entering NewMatch function' );
			var currentMatch = new Match( session );
			console.log('currentMatch variable from newMatch = ' + JSON.stringify(currentMatch, null, 2) );
            callback(currentMatch);
			console.log('exiting NewMatch function' );
        }
    };
})();
console.log('exiting matchStorage.js');
module.exports = matchStorage;
