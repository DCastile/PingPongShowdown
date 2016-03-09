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
			var player1Key = parseInt(session.attributes.player1PhoneKey);
			var player2Key = parseInt(session.attributes.player2PhoneKey);
			console.log('player1Key = ' + player1Key);
			console.log('player2Key = ' + player2Key);
			var rawStats = [];
			var stats = {};
			
			if (player1Key != 0 && player2Key != 0) {

				async.parallel([
				 
					// pull data when player was Red1PlayerID
					function(callback) {

						var params = {				
							TableName: matchKeeperMatchesTable,
							IndexName: "RedDoublesPartnerIndex", ///////////////////////////////////// change this to include time
							KeyConditionExpression: "Player1ID = :Player1ID and Player2ID = :Player2ID",   //////////////  change this to include time  
							ExpressionAttributeValues: {
								":PlayerID1": player1Key,
								":PlayerID1": player2Key
							},
							ProjectionExpression: "Red1PlayerID, Blue1PlayerID, MatchData"
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

						var params = {				
							TableName: matchKeeperMatchesTable,
							IndexName: "BlueDoublesPartnerIndex", //////////////////////////////////////////////////
							KeyConditionExpression: "Player1ID = :Player1ID and Player2ID = :Player2ID",   ///////////////////////////////  
							ExpressionAttributeValues: {
								":PlayerID1": player1Key,
								":PlayerID1": player2Key    
							},
							ProjectionExpression: "Red1PlayerID, Blue1PlayerID, MatchData"
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
					stats.numberOfMatches = rawStats[0].length + rawStats[1].length;
					stats.totalGamesPlayed = 0;
					stats.totalPointsPlayed = 0;
					stats.GamePoints = 0;
					
					stats.singlesPlayerTotalPointsWon = 0;
					stats.singlesPlayerTotalGamesWon = 0;											
					stats.singlesPlayerPointsServed = 0;
					stats.singlesPlayerGamesServed = 0;
					stats.singlesPlayerPointsWonOnServe = 0;
					stats.singlesPlayerGamesWonOnServe = 0;			
					stats.BreakPointsAgainstSelf = 0;
					stats.BreakPointsAgainstOpponent = 0;
					stats.singlesPlayerBreakPointConversions = 0;
					stats.singlesPlayerBreakPointsSaved = 0;
					stats.singlesPlayerGamePointsWon = 0;
					stats.singlesPlayerDeucePointsWon = 0;
					stats.maxSinglesPlayerPointStreak = 0;
					//stats.singlesPlayerTiebreaksWon = 0;


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
							
							stats.GamePoints += item.MatchData.GamePoints
							stats.totalGamesPlayed += (item.MatchData.RedTeamTotalGamesWon + item.MatchData.BlueTeamTotalGamesWon);
							stats.totalPointsPlayed += (item.MatchData.RedTeamTotalPointsWon + item.MatchData.BlueTeamTotalPointsWon);
							
							if (item.Red1PlayerID == playerKey) {

								if (!(item.MatchData.RedTeamTotalPointsWon === undefined || item.MatchData.RedTeamTotalPointsWon === null)) {
									stats.singlesPlayerTotalPointsWon += item.MatchData.RedTeamTotalPointsWon;
								};

								if (!(item.MatchData.RedTeamTotalGamesWon === undefined || item.MatchData.RedTeamTotalGamesWon === null)) {
									stats.singlesPlayerTotalGamesWon += item.MatchData.RedTeamTotalGamesWon;
								};							

								if (!(item.MatchData.RedPointsServed === undefined || item.MatchData.RedPointsServed === null)) {
									stats.singlesPlayerPointsServed += item.MatchData.RedPointsServed;
								};							

								if (!(item.MatchData.RedGamesServed === undefined || item.MatchData.RedGamesServed === null)) {
									stats.singlesPlayerGamesServed += item.MatchData.RedGamesServed;
								};								

								if (!(item.MatchData.RedPointsWonOnServe === undefined || item.MatchData.RedPointsWonOnServe === null)) {
									stats.singlesPlayerPointsWonOnServe += item.MatchData.RedPointsWonOnServe;
								};								

								if (!(item.MatchData.RedGamesWonOnServe === undefined || item.MatchData.RedGamesWonOnServe === null)) {
									stats.singlesPlayerGamesWonOnServe += item.MatchData.RedGamesWonOnServe;
								};							

								if (!(item.MatchData.BreakPointsAgainstRed === undefined || item.MatchData.BreakPointsAgainstRed === null)) {
									stats.BreakPointsAgainstSelf += item.MatchData.BreakPointsAgainstRed;
								};							

								if (!(item.MatchData.BreakPointsAgainstBlue === undefined || item.MatchData.BreakPointsAgainstBlue === null)) {
									stats.BreakPointsAgainstOpponent += item.MatchData.BreakPointsAgainstBlue;
								};								

								if (!(item.MatchData.RedBreakPointConversions === undefined || item.MatchData.RedBreakPointConversions === null)) {
									stats.singlesPlayerBreakPointConversions += item.MatchData.RedBreakPointConversions;
								};							

								if (!(item.MatchData.RedBreakPointsSaved === undefined || item.MatchData.RedBreakPointsSaved === null)) {
									stats.singlesPlayerBreakPointsSaved += item.MatchData.RedBreakPointsSaved;
								};							

								if (!(item.MatchData.RedGamePointsWon === undefined || item.MatchData.RedGamePointsWon === null)) {
									stats.singlesPlayerGamePointsWon += item.MatchData.RedGamePointsWon;
								};								

								if (!(item.MatchData.RedDeucePointsWon === undefined || item.MatchData.RedDeucePointsWon === null)) {
									stats.singlesPlayerDeucePointsWon += item.MatchData.RedDeucePointsWon;
								};							

								if (!(item.MatchData.MaxRedPointStreak === undefined || item.MatchData.MaxRedPointStreak === null)) {
									stats.maxSinglesPlayerPointStreak += 	item.MatchData.MaxRedPointStreak;
								};

								//if (!(item.MatchData.RedTiebreaksWon === undefined || item.MatchData.RedTiebreaksWon === null)) {
									//stats.singlesPlayerTiebreaksWon += item.MatchData.RedTiebreaksWon;
								//};																																										
								
							} else if (item.Blue1PlayerID == playerKey) {
								
								if (!(item.MatchData.BlueTeamTotalPointsWon === undefined || item.MatchData.BlueTeamTotalPointsWon === null)) {
									stats.singlesPlayerTotalPointsWon += item.MatchData.BlueTeamTotalPointsWon;
								};

								if (!(item.MatchData.BlueTeamTotalGamesWon === undefined || item.MatchData.BlueTeamTotalGamesWon === null)) {
									stats.singlesPlayerTotalGamesWon += item.MatchData.BlueTeamTotalGamesWon;
								};							

								if (!(item.MatchData.BluePointsServed === undefined || item.MatchData.BluePointsServed === null)) {
									stats.singlesPlayerPointsServed += item.MatchData.BluePointsServed;
								};							

								if (!(item.MatchData.BlueGamesServed === undefined || item.MatchData.BlueGamesServed === null)) {
									stats.singlesPlayerGamesServed += item.MatchData.BlueGamesServed;
								};								

								if (!(item.MatchData.BluePointsWonOnServe === undefined || item.MatchData.BluePointsWonOnServe === null)) {
									stats.singlesPlayerPointsWonOnServe += item.MatchData.BluePointsWonOnServe;
								};								

								if (!(item.MatchData.BlueGamesWonOnServe === undefined || item.MatchData.BlueGamesWonOnServe === null)) {
									stats.singlesPlayerGamesWonOnServe += item.MatchData.BlueGamesWonOnServe;
								};							

								if (!(item.MatchData.BreakPointsAgainstBlue === undefined || item.MatchData.BreakPointsAgainstBlue === null)) {
									stats.BreakPointsAgainstSelf += item.MatchData.BreakPointsAgainstBlue;
								};							

								if (!(item.MatchData.BreakPointsAgainstRed === undefined || item.MatchData.BreakPointsAgainstRed === null)) {
									stats.BreakPointsAgainstOpponent += item.MatchData.BreakPointsAgainstRed;
								};								

								if (!(item.MatchData.BlueBreakPointConversions === undefined || item.MatchData.BlueBreakPointConversions === null)) {
									stats.singlesPlayerBreakPointConversions += item.MatchData.BlueBreakPointConversions;
								};							

								if (!(item.MatchData.BlueBreakPointsSaved === undefined || item.MatchData.BlueBreakPointsSaved === null)) {
									stats.singlesPlayerBreakPointsSaved += item.MatchData.BlueBreakPointsSaved;
								};							

								if (!(item.MatchData.BlueGamePointsWon === undefined || item.MatchData.BlueGamePointsWon === null)) {
									stats.singlesPlayerGamePointsWon += item.MatchData.BlueGamePointsWon;
								};								

								if (!(item.MatchData.BlueDeucePointsWon === undefined || item.MatchData.BlueDeucePointsWon === null)) {
									stats.singlesPlayerDeucePointsWon += item.MatchData.BlueDeucePointsWon;
								};							

								if (!(item.MatchData.MaxBluePointStreak === undefined || item.MatchData.MaxBluePointStreak === null)) {
									stats.maxSinglesPlayerPointStreak += 	item.MatchData.MaxBluePointStreak;
								};

								//if (!(item.MatchData.BlueTiebreaksWon === undefined || item.MatchData.BlueTiebreaksWon === null)) {
									//stats.singlesPlayerTiebreaksWon += item.MatchData.BlueTiebreaksWon;
								//};							
													
							};						
						});
					});		
											
					console.log('stats before division = ' + JSON.stringify(stats) );							
					
					// now divide each stat by the number of matches to get the avg stat per match
					for (var specificStat in stats) {
						if (stats.hasOwnProperty(specificStat)) {
							stats[specificStat] /= stats.numberOfMatches;
						};
					};				
											
					//console.log('stats after division = ' + JSON.stringify(stats) );
								
					callback(stats);
					
				});		
			
			} else { // the team specified to retrieve history from does not have an associated signed in player
				stats.numberOfMatches = 0;
				callback(stats);
			};

		}
    };		

})();
console.log('exiting singlesPlayerHistory.js');
module.exports = singlesPlayerHistory;




