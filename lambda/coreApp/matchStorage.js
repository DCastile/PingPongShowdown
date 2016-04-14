
'use strict';
console.log('entering matchStorage.js');
var	AlexaSkill = require('./AlexaSkill'),
	AWS = require("aws-sdk"),
	async = require("async"),
	moment = require("moment");
	moment().format();

var matchStorage = (function () {
 
	var docClient = new AWS.DynamoDB.DocumentClient();
	
	//var matchKeeperMatchesTable = 'MatchKeeperMatches'; // FOR PRODUCTION
	var matchKeeperMatchesTable = 'MatchKeeperMatches-Dev'; // FOR DEVELOPMENT	
	
	//var matchKeeperDevicesTable = 'MatchKeeperDevices'; // FOR PRODUCTION
	var matchKeeperDevicesTable = 'MatchKeeperDevices-Dev'; // FOR DEVELOPMENT	

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

			var serveSequence = [];	// specific serve sequence will be set by players, e.g. alpha, charlie, bravo, delta			
		
			var newMatchScores = {	
					RedTeamGameScore: 0, // red team's score in the current game being played
					BlueTeamGameScore: 0, // blue team's score in the current game being played
					ExperiencedUserMode: false, // flag to indicate whether minimal words should be spoken. Default = false	
					SwitchSides: true, // flag to indicate whether players want to switch sides during the match. Default = true
					PlayGamePoint: false, // flag to indicate whether players want to play No Ad scoring or not. Default = false
					AnnounceServe: true, // flag to indicate whether or not to announce who's serve it is when starting a new game
					AnnounceScore: true, // flag to indicate whether or not to announce the score when starting a new game
					RedTeamSetScore: 0, // red team's score in the current set, increments for each game won in the set
					BlueTeamSetScore: 0, // blue team's score in the current set, increments for each game won in the set
					RedTeamSetsWon: 0, // increments for each set won by red
					BlueTeamSetsWon: 0,	// increments for each set won by blue				
					Set: 1, // keeps track of the current set
					Set1Score: "0 0", // set to format the score correctly based on winning team called out first
					Set2Score: "0 0", // set to format the score correctly based on winning team called out first
					Set3Score: "0 0", // set to format the score correctly based on winning team called out first
					RedTeamTotalPointsWon: 0, // increments for every point won in the match by red
					BlueTeamTotalPointsWon: 0, // increments for every point won in the match by blue
					RedPointsServed: 0, // increments for every point served by red
					BluePointsServed: 0, // increments for every point served by blue
					RedGamesServed: 0, // increments for every game served by red
					BlueGamesServed: 0, // increments for every game served by blue
					RedPointsWonOnServe: 0, // increments for every point won in the match when serving
					RedPointsWonOffServe: 0, // increments for every point won in the match when not serving
					BluePointsWonOnServe: 0, // increments for every point won in the match when serving
					BluePointsWonOffServe: 0, // increments for every point won in the match when not serving
					RedGamesWonOnServe: 0, // increments for every game won by red when red was serving
					BlueGamesWonOnServe: 0, // increments for every game won by blue when blue was serving
					RedTeamTotalGamesWon: 0, // increments for every game won in the match by red
					BlueTeamTotalGamesWon: 0, // increments for every game won in the match	by blue							
					WhosServe: "TBDServer", // set to whoever is currently serving
					MatchWinner: "TBDWinner", // stores the winner of the match
					PlayerAlias: playerNameAlias, // correlates doubles players signed in to a given match with the call signs they are assigned
					FirstRedToServe: "AlphaOrBravo", // first to serve in a match on the red team, set by players
					FirstBlueToServe: "CharlieOrDelta", // first to serve in a match on the blue team, set by players
					DoublesServeSequence: serveSequence, // the sequence of serve in a doubles match depending on player input
					DoublesServer: "TBDDoublesServer", // set to the current server in a doubles match
					ScoreLastUpdated: '0', // set after each point in order to keep track of total match play time
					TimeOfFirstPoint: '0', // set after a team wins a point in a match in order to keep track of total match play time
					BreakPoint: false, // flag to indicate whether it is break point or not
					Deuce: false, // flag set when the score in a game reaches deuce in order to figure out whether 40-30 or add-in should be called.
					Tiebreaker: false, // set if play in a set reaches 6-6, moves play to a 7 point tiebreaker
					SuperTiebreaker: false, // set if players call for a 10 point super tiebreaker
					SwitchSidesAfterTiebreak: false, // set if a tiebreak was just played, needed because must switch sides for next new new game 
					TiebreakRedScore: 0, // keep track of tiebreaker score
					TiebreakBlueScore: 0, // keep track of tiebreaker score
					RedTiebreaksWon: 0, // stat to store for future analytics
					BlueTiebreaksWon: 0, // stat to store for future analytics
					TiebreakFirstToServe: "TBDServer", // set to who served first in a tiebreaker, needed because rotation continues from here 1st game of new set
					GamePoints: 0, // increments for every game point played
					GamesWonWithDeuce: 0, // increments for every game won where a deuce point was played
					BreakPointsAgainstRed: 0, // increments for every break point when red is serving (blue has a chance to break red)
					BreakPointsAgainstBlue: 0, // increments for every break point when blue is serving (red has a chance to break blue)					
					RedBreakPointConversions: 0, // increments for every game won by red when it was a break point
					BlueBreakPointConversions: 0, // increments for every game won by blue when it was a break point
					RedBreakPointsSaved: 0, // increments for every point won by red when red was serving against a break point
					BlueBreakPointsSaved: 0, // increments for every point won by blue when blue was serving against a break point
					RedGamePointsWon: 0, // increments for every game point won by red
					BlueGamePointsWon: 0, // increments for every game point won by blue
					RedDeucePointsWon: 0, // increments for every game won by red that was at deuce point
					BlueDeucePointsWon: 0, // increments for every game won by blue that was at deuce point	
					RedPointStreak: 0, // increments when the current red point streak is extended
					MaxRedPointStreak: 0, // increments when the max red point streak is extended
					BluePointStreak: 0, // increments when the max blue point streak is extended	
					MaxBluePointStreak: 0, // increments when the max blue point streak is extended
					PointWinner: 'TBD' // used to refer back one point under nMinusOne to determine Point Streaks
					
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
				// save to matchKeeperDevicesTable
				function(callback) {
					var params = {
						TableName: matchKeeperDevicesTable,
						Item: 		{                  
										"EchoUserID": 		currentMatchData.EchoUserID, 
										"MatchStartTime":	currentMatchData.MatchStartTime                    
						}
					};

					docClient.put(params, function(err, data) {
						if (err) {
							console.log("Unable to save to matchKeeperDevicesTable. Error:", JSON.stringify(err, null, 2));
						} else {
							console.log("Saved to matchKeeperDevicesTable:", JSON.stringify(data, null, 2));
							callback();
						};
					});
				},
				
				// save to matchKeeperMatchesTable
				function(callback) {					
					var params = {
						TableName: matchKeeperMatchesTable,
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
							console.log("Unable to save to matchKeeperMatchesTable. Error:", JSON.stringify(err, null, 2));
						} else {
							console.log("Saved to matchKeeperMatchesTable:", JSON.stringify(data, null, 2));
							callback();
						};
					});								
				}
				
			], function(err) { //This function gets called after the two tasks have called their "task callbacks"
					if (err) {
						console.log("Unable to save to matchKeeperMatchesTable. Error:", JSON.stringify(err, null, 2));
					} else {
						console.log("Successfully saved to both matchKeeperMatchesTable and matchKeeperDevicesTable:");
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
			console.log('Existing session does not have the match data, so getting it from DynamoDB data store');
			var rightNow = new Date().getTime();
			var fourHoursAgo = (new Date().getTime() - (40*60*60*1000) ); 	// will find a match if the match start time was within the last 4 hours
																			// set to 40 hours for testing *********************************

			var queryDevicesParams = {

				TableName : matchKeeperDevicesTable, 
				ConsistentRead: true,
				KeyConditionExpression: "EchoUserID = :EchoUserID AND MatchStartTime BETWEEN :fourHoursAgo AND :rightNow",
				ExpressionAttributeValues: {
					":EchoUserID": session.user.userId,
					":rightNow": rightNow, 
					":fourHoursAgo": fourHoursAgo       
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
                	console.log('Data was loaded from matchKeeperDevicesTable without error, but data.Items[data.Count - 1] was undefined');
					currentMatch = 'matchNotFound';
					console.log('type of currentMatch = ' + typeof(currentMatch));
                    callback(currentMatch);
                } else {
                    //console.log('Matches in the last 4 hrs pulled from dynamodb = ' + JSON.stringify(data) );					
					var startTimeKey = data.Items[data.Count - 1].MatchStartTime;
					console.log('startTimeKey = ' + startTimeKey);
										
					var getMatchParams = {
						
						TableName: matchKeeperMatchesTable,
						Key: {
								"MatchStartTime": 	startTimeKey,
								"EchoUserID": 		session.user.userId		
						}
					};

					docClient.get(getMatchParams, function (err, data) {
												
						if (err) {
							console.log('there was an error in Get to matchKeeperMatchesTable, info follows: ');
							console.log(err, err.stack);
							currentMatch = 'errorLoadingMatch';
							callback(currentMatch);
						} else if (data.Item === undefined) {
							console.log('Data was loaded from matchKeeperMatchesTable without error, but data.Item was undefined');
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
