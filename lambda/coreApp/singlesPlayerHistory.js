'use strict';
console.log('entering singlesPlayerHistory.js');
var AWS = require("aws-sdk"),
	async = require("async");

var singlesPlayerHistory = (function () {

    return {
        getSinglesPlayerHistory: function (session, callback) {
			console.log('entering playerHistory.getPlayerHistory function');			

			//var matchKeeperMatchesTable = 'MatchKeeperMatches'; // FOR PRODUCTION
			var matchKeeperMatchesTable = 'MatchKeeperMatches-Dev'; // FOR DEVELOPMENT		
			var docClient = new AWS.DynamoDB.DocumentClient();
			var playerKey = parseInt(session.attributes.phoneKey);
			console.log('playerKey = ' + playerKey);
			var rawStats = [];
			var stats = {};
			
			if (playerKey != 0) {

				async.parallel([
				 
					// pull data when player was Red1PlayerID
					function(callback) {

						var startOfTimeRange = 1457913145500; // March 13, 2016 (time of dev)
						var rightNow = new Date().getTime();
						var params = {				
							TableName: matchKeeperMatchesTable,
							IndexName: "Red1PlayerIDIndex", 
							KeyConditionExpression: "Red1PlayerID = :PlayerID1 AND MatchStartTime BETWEEN :startOfRange AND :rightNow",
							ExpressionAttributeValues: {
								":PlayerID1": playerKey, 
								":rightNow": rightNow, 
								":startOfRange": startOfTimeRange 								
							},
							ProjectionExpression: "Red1PlayerID, Blue1PlayerID, MatchType, MatchData"
						};

						docClient.query(params, function(err, data) {
							if (err)
								console.log(JSON.stringify(err, null, 2));
							else
								rawStats[0] = data.Items;
								callback();
						});			
					},
						
					// pull data when player was Blue1PlayerID
					function(callback) {

						var startOfTimeRange = 1457913145500; // March 13, 2016 (time of dev)
						var rightNow = new Date().getTime();
						var params = {				
							TableName: matchKeeperMatchesTable,
							IndexName: "Blue1PlayerIDIndex",
							KeyConditionExpression: "Blue1PlayerID = :PlayerID1 AND MatchStartTime BETWEEN :startOfRange AND :rightNow",
							ExpressionAttributeValues: {
								":PlayerID1": playerKey,
								":rightNow": rightNow, 
								":startOfRange": startOfTimeRange 								
							},
							ProjectionExpression: "Red1PlayerID, Blue1PlayerID, MatchType, MatchData"
						};

						docClient.query(params, function(err, data) {
							if (err)
								console.log(JSON.stringify(err, null, 2));
							else
								rawStats[1] = data.Items;
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


					// rawStats[0] is an array of all the matches where the player was Red1
					// rawStats[1] is an array of all the matches where the player was Blue1
					rawStats.forEach(function(playerSlot) { // go through twice, once for Red1, once for Blue1
						playerSlot.forEach(function(item) { // each item is a match that was found where the player was signed in

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
							
							//console.log('item = ' + JSON.stringify(item) );
							//console.log('playerKey = ' + playerKey);
													
							if (item.MatchType == 'singles') { 	
															
								stats.TotalGamesPlayed += (item.MatchData.RedTeamTotalGamesWon + item.MatchData.BlueTeamTotalGamesWon);
								stats.TotalPointsPlayed += (item.MatchData.RedTeamTotalPointsWon + item.MatchData.BlueTeamTotalPointsWon);	
								stats.GamePoints += item.MatchData.GamePoints;							
								
								if (item.Red1PlayerID == playerKey) {

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
									
								} else if (item.Blue1PlayerID == playerKey) {
									
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
console.log('exiting singlesPlayerHistory.js');
module.exports = singlesPlayerHistory;




