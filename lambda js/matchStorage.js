
'use strict';
console.log('entering matchStorage.js');
var AWS = require("aws-sdk");

var matchStorage = (function () {
    // var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
	var dynamodb = new AWS.DynamoDB();
	
//var matchKeeperMatchesTable = 'MatchKeeperMatches'; // FOR PRODUCTION
var matchKeeperMatchesTable = 'MatchKeeperMatches-Dev'; // FOR DEVELOPMENT	

    /*
     * The Match class stores all match states
     */
    function Match(session, data) {
    	console.log('entering Match function');
        if (data) {     	
            this.data = data;
            //console.log('successfully passed match data in: ' + JSON.stringify(this.data));
        } else { // no existing Match found for this Echo UserID within timeframe specified in query.

			var playerNameAlias = {	
					Red1: "TBD",
					Red2: "TBD",
					Blue1: "TBD",
					Blue2: "TBD"
            };

			var serveSequence = [];				
		
			var newMatchScores = {	
					RedTeamGameScore: 0,
					BlueTeamGameScore: 0,
					Deuce: false,
					SwitchSides: true,
					PlayGamePoint: false,
					RedTeamSetScore: 0,
					BlueTeamSetScore: 0,
					RedTeamSetsWon: 0,
					BlueTeamSetsWon: 0,					
					Set: 1,
					Set1Score: "0 0",
					Set2Score: "0 0",
					Set3Score: "0 0",
					RedTeamTotalPointsWon: 0, 
					BlueTeamTotalPointsWon: 0,
					RedPointsServed: 0,
					BluePointsServed: 0,
					RedPointsWonOnServe: 0,
					RedPointsWonOffServe: 0,
					BluePointsWonOnServe: 0,
					BluePointsWonOffServe: 0,
					RedTeamTotalGamesWon: 0,
					BlueTeamTotalGamesWon: 0,									
					WhosServe: "TBDServer",
					MatchWinner: "TBDWinner",
					PlayerAlias: playerNameAlias,
					FirstRedToServe: "AlphaOrBravo",
					FirstBlueToServe: "CharlieOrDelta",
					DoublesServeSequence: serveSequence, 
					DoublesServer: "TBDDoublesServer",
					ScoreLastUpdated: '0',
					TimeOfFirstPoint: '0'
            };
						
			var newMatchData = {
					EchoUserID: {S: session.user.userId}, // current session's userID
					MatchStartTime: {N: JSON.stringify(new Date().getTime() )}, // current date & time in milliseconds since epoc
					Red1PlayerID: {N: '0'},
					Red2PlayerID: {N: '0'},
					Blue1PlayerID: {N: '0'},
					Blue2PlayerID: {N: '0'},
					MatchType: {S: 'TBD'},
					MatchData: newMatchScores 
			};	
			
			this.data = newMatchData;				
            //console.log('no match data passed in. New Match data being established = ' + JSON.stringify(this.data));
        }
        console.log('exiting Match function');
    }

    Match.prototype = {
        save: function (callback) {
            console.log('entering Match.prototype save function');
			
			//console.log('THIS.DATA = ' + JSON.stringify(this.data));
			
            //console.log('storing the following in dynamodb: ');						
			//console.log('Echo UserID = ' + this.data.EchoUserID.S);
			//console.log('MatchStartTime = ' + this.data.MatchStartTime.N);			
			//console.log('Red1PlayerID = ' + this.data.Red1PlayerID.N);
			//console.log('Red2PlayerID = ' + this.data.Red1PlayerID.N);
			//console.log('Blue1PlayerID = ' + this.data.Blue1PlayerID.N); 
			//console.log('Blue2PlayerID = ' + this.data.Blue2PlayerID.N); 
			//console.log('MatchType = ' + this.data.MatchType.S);
			//console.log('MatchData = ' + JSON.stringify(this.data.MatchData));
			//console.log('WhosServe before storing = ' + this.data.MatchData.WhosServe );
            dynamodb.putItem({

				TableName : matchKeeperMatchesTable, 

				Item: {
                    EchoUserID: {
                        S: this.data.EchoUserID.S 
                    },
                    MatchStartTime: {
                        N: this.data.MatchStartTime.N 
                    },
                    Red1PlayerID: {
                        N: this.data.Red1PlayerID.N 
                    },
                    Red2PlayerID: {
                        N: this.data.Red2PlayerID.N 
                    },					
                    Blue1PlayerID: {
                        N: this.data.Blue1PlayerID.N 
                    }, 
                    Blue2PlayerID: {
                        N: this.data.Blue2PlayerID.N 
                    },
                    MatchType: {
                        S: this.data.MatchType.S 
                    },   					
                    MatchData: {
                        S: JSON.stringify(this.data.MatchData)
                    }
                }

            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }				
            });         
            console.log('exiting Match.prototype save function');
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
			var fourHoursAgo = (new Date().getTime() - (4*60*60*1000) ); // will find a match if the match start time was within the last 4 hours

			var queryParams = {

				TableName : matchKeeperMatchesTable, 
				ConsistentRead: true,
				KeyConditionExpression: "EchoUserID = :EchoUserID AND MatchStartTime BETWEEN :fourHoursAgo AND :rightNow",
				ExpressionAttributeValues: {
					":EchoUserID": { "S": session.user.userId },
					":rightNow": { "N": JSON.stringify( rightNow ) }, 
					":fourHoursAgo": { "N": JSON.stringify( fourHoursAgo) }       
				}
			};

            dynamodb.query(queryParams,            
				function (err, data) {
                var currentMatch;
                if (err) {
                	console.log('there was an error in loadMatch function, info follows: ');
                    console.log(err, err.stack);
                    currentMatch = new Match(session);
                    session.attributes.currentMatch = currentMatch.data;
                    callback(currentMatch);
                } else if (data.Items[data.Count - 1] === undefined) {
                	console.log('Data was loaded from DynamoDB without error, but data.Items[data.Count - 1] was undefined');
                    currentMatch = new Match(session);
                    session.attributes.currentMatch = currentMatch.data;
                    callback(currentMatch);
                } else {
                    //console.log('Matches in the last 4 hrs pulled from dynamodb = ' + JSON.stringify(data) );
					//console.log('Most recent match = ' + JSON.stringify(data.Items[data.Count - 1]) );

					var loadedMatchData = JSON.parse(data.Items[data.Count - 1].MatchData.S);
					//console.log('results of JSON.parse = ' + JSON.stringify(loadedMatchData ) );
					
					var loadedEchoUserID = data.Items[data.Count - 1].EchoUserID;		
					var loadedMatchStartTime = data.Items[data.Count - 1].MatchStartTime;
					var loadedRed1PlayerID = data.Items[data.Count - 1].Red1PlayerID;
					var loadedRed2PlayerID = data.Items[data.Count - 1].Red2PlayerID;					
					var loadedBlue1PlayerID = data.Items[data.Count - 1].Blue1PlayerID;
					var loadedBlue2PlayerID = data.Items[data.Count - 1].Blue2PlayerID;	
					var loadedMatchType = data.Items[data.Count - 1].MatchType;

					var dataFromQuery = {
							EchoUserID: loadedEchoUserID,
							MatchStartTime: loadedMatchStartTime,
							Red1PlayerID: loadedRed1PlayerID,
							Red2PlayerID: loadedRed2PlayerID,
							Blue1PlayerID: loadedBlue1PlayerID,
							Blue2PlayerID: loadedBlue2PlayerID,
							MatchType: loadedMatchType,
							MatchData: loadedMatchData 
					};

                    currentMatch = new Match( session, dataFromQuery );
					//console.log('currentMatch obj created after loading = ' + JSON.stringify(currentMatch) );		
                    session.attributes.currentMatch = currentMatch.data;
                    callback(currentMatch);
                }
            });
        },
        newMatch: function (session, callback) {
			console.log('entering NewMatch function' );
			var currentMatch = new Match( session );
			//console.log('currentMatch variable from newMatch = ' + JSON.stringify(currentMatch, null, 2) );
            callback(currentMatch);
			console.log('exiting NewMatch function' );
        }
    };
})();
console.log('exiting matchStorage.js');
module.exports = matchStorage;
