'use strict';
console.log('entering doublesTeamHistory.js');
var AWS = require("aws-sdk"),
	async = require("async");

var doublesTeamHistory = (function () {

    return {
        getDoublesTeamHistory: function (session, callback) {
			console.log('entering doublesTeamHistory.getDoublesTeamHistory function');			

			//var PingpongMatchesTable = 'MatchKeeperMatches'; // FOR PRODUCTION
			var PingpongMatchesTable = 'PingpongMatches-Dev'; // FOR DEVELOPMENT		
			var docClient = new AWS.DynamoDB.DocumentClient();
			var player1Key = parseInt(session.attributes.player1PhoneKey);
			var player2Key = parseInt(session.attributes.player2PhoneKey);
			console.log('player1Key = ' + player1Key);
			console.log('player2Key = ' + player2Key);
			var rawStats = [];
			var stats = {};
			
			if (player1Key != 0 && player2Key != 0) {

				async.parallel([
				 
					// pull data when doubles team was Red
					function(callback) {

						var startOfTimeRange = 1457913145500; // March 13, 2016 (time of dev)
						var rightNow = new Date().getTime();
						var params = {				
							TableName: PingpongMatchesTable,
							IndexName: "RedDoublesPartnerIndex", 
							KeyConditionExpression: "Red1PlayerID = :Player1ID AND Red2PlayerID = :Player2ID", //AND MatchStartTime BETWEEN :startOfRange AND :rightNow", 
							ExpressionAttributeValues: {
								":Player1ID": player1Key,
								":Player2ID": player2Key,
								//":rightNow": rightNow, 
								//":startOfRange": startOfTimeRange 								
							},
							ProjectionExpression: "Red1PlayerID, Red2PlayerID, MatchType, MatchData"
						};

						docClient.query(params, function(err, data) {
							if (err)
								console.log(JSON.stringify(err, null, 2));
							else
								rawStats[0] = data.Items;
								callback();
						});			
					},
					
					// pull data when doubles team was Red in reverse order
					function(callback) {

						var startOfTimeRange = 1457913145500; // March 13, 2016 (time of dev)
						var rightNow = new Date().getTime();
						var params = {				
							TableName: PingpongMatchesTable,
							IndexName: "RedDoublesPartnerIndex", 
							KeyConditionExpression: "Red1PlayerID = :Player2ID AND Red2PlayerID = :Player1ID", //AND MatchStartTime BETWEEN :startOfRange AND :rightNow", 
							ExpressionAttributeValues: {
								":Player1ID": player1Key,
								":Player2ID": player2Key,
								//":rightNow": rightNow, 
								//":startOfRange": startOfTimeRange 								
							},
							ProjectionExpression: "Red1PlayerID, Red2PlayerID, MatchType, MatchData"
						};

						docClient.query(params, function(err, data) {
							if (err)
								console.log(JSON.stringify(err, null, 2));
							else
								rawStats[1] = data.Items;
								callback();
						});			
					},					
					
						
					// pull data when doubles team was Blue
					function(callback) {

						var startOfTimeRange = 1457913145500; // March 13, 2016 (time of dev)
						var rightNow = new Date().getTime();
						var params = {				
							TableName: PingpongMatchesTable,
							IndexName: "BlueDoublesPartnerIndex",
							KeyConditionExpression: "Blue1PlayerID = :Player1ID AND Blue2PlayerID = :Player2ID", //AND MatchStartTime BETWEEN :startOfRange AND :rightNow",  
							ExpressionAttributeValues: {
								":Player1ID": player1Key,
								":Player2ID": player2Key,
								//":rightNow": rightNow, 
								//":startOfRange": startOfTimeRange 								
							},
							ProjectionExpression: "Blue1PlayerID, Blue2PlayerID, MatchType, MatchData"
						};

						docClient.query(params, function(err, data) {
							if (err)
								console.log(JSON.stringify(err, null, 2));
							else
								rawStats[2] = data.Items;
								callback();
						});		
					},
					
					// pull data when doubles team was Blue in reverse order
					function(callback) {

						var startOfTimeRange = 1457913145500; // March 13, 2016 (time of dev)
						var rightNow = new Date().getTime();
						var params = {				
							TableName: PingpongMatchesTable,
							IndexName: "BlueDoublesPartnerIndex",
							KeyConditionExpression: "Blue1PlayerID = :Player2ID AND Blue2PlayerID = :Player1ID", //AND MatchStartTime BETWEEN :startOfRange AND :rightNow",  
							ExpressionAttributeValues: {
								":Player1ID": player1Key,
								":Player2ID": player2Key,
								//":rightNow": rightNow, 
								//":startOfRange": startOfTimeRange 								
							},
							ProjectionExpression: "Blue1PlayerID, Blue2PlayerID, MatchType, MatchData"
						};

						docClient.query(params, function(err, data) {
							if (err)
								console.log(JSON.stringify(err, null, 2));
							else
								rawStats[3] = data.Items;
								callback();
						});		
					}					
					
				], function(err) { //This function gets called after the two tasks have called their "task callbacks"
					if (err) callback('historyError') //If an error occured, return that info to callback
									  
					// these are the stats that are used to perform analytics on player performance
					stats.NumberOfMatches = 0;
					if ( !(rawStats[0] === undefined || rawStats[0] === null) ) {
						stats.NumberOfMatches += rawStats[0].length
					};
					if ( !(rawStats[1] === undefined || rawStats[1] === null) ) {
						stats.NumberOfMatches += rawStats[1].length
					};
					if ( !(rawStats[2] === undefined || rawStats[2] === null) ) {
						stats.NumberOfMatches += rawStats[2].length
					};
					if ( !(rawStats[3] === undefined || rawStats[3] === null) ) {
						stats.NumberOfMatches += rawStats[3].length
					};					
					
					stats.TotalGamesPlayed = 0;
					stats.TotalPointsPlayed = 0;
					stats.GamePoints = 0;
					
					stats.SinglesOrDoublesTotalPointsWon = 0;
					stats.SinglesOrDoublesTotalGamesWon = 0;											
					stats.SinglesOrDoublesPointsServed = 0;
					stats.SinglesOrDoublesGamesServed = 0;
					stats.SinglesOrDoublesPointsWonOnServe = 0;
					stats.SinglesOrDoublesGamesWonOnServe = 0;			
					stats.BreakPointsAgainstSelf = 0;
					stats.BreakPointsAgainstOpponent = 0;
					stats.SinglesOrDoublesBreakPointConversions = 0;
					stats.SinglesOrDoublesBreakPointsSaved = 0;
					stats.SinglesOrDoublesGamePointsWon = 0;
					stats.SinglesOrDoublesDeucePointsWon = 0;
					stats.MaxSinglesOrDoublesPointStreak = 0;
					//stats.SinglesOrDoublesTiebreaksWon = 0;


					// rawStats[0] is an array of all the matches where the doubles team was Red
					// rawStats[1] is an array of all the matches where the doubles team was Blue
					rawStats.forEach(function(playerSlot) { // go through twice, once for Red, once for Blue
						playerSlot.forEach(function(item) { // each item is a match that was found where the doubles team was signed in

							/*	This worked well to aggregate all red match data and all blue match data but player isn't always on that team				
							for (var specificStat in stats) {
								if (stats.hasOwnProperty(specificStat)) {
									console.log('specificStat = ' + specificStat);
									console.log('stats[specificStat] = ' + stats[specificStat]);
									console.log('item.MatchData[specificStat] = ' + item.MatchData[specificStat]);													
									if (!(item.MatchData[specificStat] === undefined || item.MatchData[specificStat] === null)) {
										stats[specificStat] += item.MatchData[specificStat];
									};							
								};
							};																
							*/	
							
							// To incorporate specific time band statistics, use
							// if (startOfRange <= MatchStartTime <= endOfRange)
							
							stats.GamePoints += item.MatchData.GamePoints
							stats.TotalGamesPlayed += (item.MatchData.RedTeamTotalGamesWon + item.MatchData.BlueTeamTotalGamesWon);
							stats.TotalPointsPlayed += (item.MatchData.RedTeamTotalPointsWon + item.MatchData.BlueTeamTotalPointsWon);
							
							if (item.Red1PlayerID == player1Key || item.Red1PlayerID == player2Key) { // the doubles team players were on the red team of this given match (item)

								if (!(item.MatchData.RedTeamTotalPointsWon === undefined || item.MatchData.RedTeamTotalPointsWon === null)) {
									stats.SinglesOrDoublesTotalPointsWon += item.MatchData.RedTeamTotalPointsWon;
								};

								if (!(item.MatchData.RedTeamTotalGamesWon === undefined || item.MatchData.RedTeamTotalGamesWon === null)) {
									stats.SinglesOrDoublesTotalGamesWon += item.MatchData.RedTeamTotalGamesWon;
								};							

								if (!(item.MatchData.RedPointsServed === undefined || item.MatchData.RedPointsServed === null)) {
									stats.SinglesOrDoublesPointsServed += item.MatchData.RedPointsServed;
								};							

								if (!(item.MatchData.RedGamesServed === undefined || item.MatchData.RedGamesServed === null)) {
									stats.SinglesOrDoublesGamesServed += item.MatchData.RedGamesServed;
								};								

								if (!(item.MatchData.RedPointsWonOnServe === undefined || item.MatchData.RedPointsWonOnServe === null)) {
									stats.SinglesOrDoublesPointsWonOnServe += item.MatchData.RedPointsWonOnServe;
								};								

								if (!(item.MatchData.RedGamesWonOnServe === undefined || item.MatchData.RedGamesWonOnServe === null)) {
									stats.SinglesOrDoublesGamesWonOnServe += item.MatchData.RedGamesWonOnServe;
								};							

								if (!(item.MatchData.BreakPointsAgainstRed === undefined || item.MatchData.BreakPointsAgainstRed === null)) {
									stats.BreakPointsAgainstSelf += item.MatchData.BreakPointsAgainstRed;
								};							

								if (!(item.MatchData.BreakPointsAgainstBlue === undefined || item.MatchData.BreakPointsAgainstBlue === null)) {
									stats.BreakPointsAgainstOpponent += item.MatchData.BreakPointsAgainstBlue;
								};								

								if (!(item.MatchData.RedBreakPointConversions === undefined || item.MatchData.RedBreakPointConversions === null)) {
									stats.SinglesOrDoublesBreakPointConversions += item.MatchData.RedBreakPointConversions;
								};							

								if (!(item.MatchData.RedBreakPointsSaved === undefined || item.MatchData.RedBreakPointsSaved === null)) {
									stats.SinglesOrDoublesBreakPointsSaved += item.MatchData.RedBreakPointsSaved;
								};							

								if (!(item.MatchData.RedGamePointsWon === undefined || item.MatchData.RedGamePointsWon === null)) {
									stats.SinglesOrDoublesGamePointsWon += item.MatchData.RedGamePointsWon;
								};								

								if (!(item.MatchData.RedDeucePointsWon === undefined || item.MatchData.RedDeucePointsWon === null)) {
									stats.SinglesOrDoublesDeucePointsWon += item.MatchData.RedDeucePointsWon;
								};							

								if (!(item.MatchData.MaxRedPointStreak === undefined || item.MatchData.MaxRedPointStreak === null)) {
									stats.MaxSinglesOrDoublesPointStreak += item.MatchData.MaxRedPointStreak;
								};

								//if (!(item.MatchData.RedTiebreaksWon === undefined || item.MatchData.RedTiebreaksWon === null)) {
									//stats.SinglesOrDoublesTiebreaksWon += item.MatchData.RedTiebreaksWon;
								//};																																										
								
							} else if (item.Blue1PlayerID == player1Key || item.Blue1PlayerID == player2Key) {  // the doubles team players were on the blue team of this given match (item)
								
								if (!(item.MatchData.BlueTeamTotalPointsWon === undefined || item.MatchData.BlueTeamTotalPointsWon === null)) {
									stats.SinglesOrDoublesTotalPointsWon += item.MatchData.BlueTeamTotalPointsWon;
								};

								if (!(item.MatchData.BlueTeamTotalGamesWon === undefined || item.MatchData.BlueTeamTotalGamesWon === null)) {
									stats.SinglesOrDoublesTotalGamesWon += item.MatchData.BlueTeamTotalGamesWon;
								};							

								if (!(item.MatchData.BluePointsServed === undefined || item.MatchData.BluePointsServed === null)) {
									stats.SinglesOrDoublesPointsServed += item.MatchData.BluePointsServed;
								};							

								if (!(item.MatchData.BlueGamesServed === undefined || item.MatchData.BlueGamesServed === null)) {
									stats.SinglesOrDoublesGamesServed += item.MatchData.BlueGamesServed;
								};								

								if (!(item.MatchData.BluePointsWonOnServe === undefined || item.MatchData.BluePointsWonOnServe === null)) {
									stats.SinglesOrDoublesPointsWonOnServe += item.MatchData.BluePointsWonOnServe;
								};								

								if (!(item.MatchData.BlueGamesWonOnServe === undefined || item.MatchData.BlueGamesWonOnServe === null)) {
									stats.SinglesOrDoublesGamesWonOnServe += item.MatchData.BlueGamesWonOnServe;
								};							

								if (!(item.MatchData.BreakPointsAgainstBlue === undefined || item.MatchData.BreakPointsAgainstBlue === null)) {
									stats.BreakPointsAgainstSelf += item.MatchData.BreakPointsAgainstBlue;
								};							

								if (!(item.MatchData.BreakPointsAgainstRed === undefined || item.MatchData.BreakPointsAgainstRed === null)) {
									stats.BreakPointsAgainstOpponent += item.MatchData.BreakPointsAgainstRed;
								};								

								if (!(item.MatchData.BlueBreakPointConversions === undefined || item.MatchData.BlueBreakPointConversions === null)) {
									stats.SinglesOrDoublesBreakPointConversions += item.MatchData.BlueBreakPointConversions;
								};							

								if (!(item.MatchData.BlueBreakPointsSaved === undefined || item.MatchData.BlueBreakPointsSaved === null)) {
									stats.SinglesOrDoublesBreakPointsSaved += item.MatchData.BlueBreakPointsSaved;
								};							

								if (!(item.MatchData.BlueGamePointsWon === undefined || item.MatchData.BlueGamePointsWon === null)) {
									stats.SinglesOrDoublesGamePointsWon += item.MatchData.BlueGamePointsWon;
								};								

								if (!(item.MatchData.BlueDeucePointsWon === undefined || item.MatchData.BlueDeucePointsWon === null)) {
									stats.SinglesOrDoublesDeucePointsWon += item.MatchData.BlueDeucePointsWon;
								};							

								if (!(item.MatchData.MaxBluePointStreak === undefined || item.MatchData.MaxBluePointStreak === null)) {
									stats.MaxSinglesOrDoublesPointStreak += item.MatchData.MaxBluePointStreak;
								};

								//if (!(item.MatchData.BlueTiebreaksWon === undefined || item.MatchData.BlueTiebreaksWon === null)) {
									//stats.SinglesOrDoublesTiebreaksWon += item.MatchData.BlueTiebreaksWon;
								//};							
													
							};						
						});
					});		
											
					console.log('stats before division = ' + JSON.stringify(stats) );							
					
					// now divide each stat by the number of matches to get the avg stat per match
					for (var specificStat in stats) {
						if (stats.hasOwnProperty(specificStat) && stats[specificStat] != stats.NumberOfMatches) {
							stats[specificStat] /= stats.NumberOfMatches;
						};
					};				
											
					console.log('stats after division = ' + JSON.stringify(stats) );
								
					callback(stats);
					
				});		
			
			} else { // the team specified to retrieve history from does not have an associated signed in player
				stats.NumberOfMatches = 0;
				callback(stats);
			};

		}
    };		

})();
console.log('exiting doublesTeamHistory.js');
module.exports = doublesTeamHistory;




