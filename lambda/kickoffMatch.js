'use strict';
console.log('entering kickoffMatch.js');

var	async = require("async"),
	AlexaSkill = require('./AlexaSkill'),
	singlesMatchupResults = require('./queryForSinglesMatchups'),
	humor = require('./humor');
	
var kickoffMatch = (function () {

    return {
        doIt: function (rallyWinner, currentMatch, session, response) {
			console.log('entering kickoffMatch.doIt function');

			if (rallyWinner == currentMatch.data.MatchData.PlayerName.Red1) {
				console.log('rallyWinner = ' + rallyWinner)
				console.log('currentMatch.data.MatchData.PlayerName.Red1 = ' + currentMatch.data.MatchData.PlayerName.Red1)		
				currentMatch.data.MatchData.WhosServe = 'red';
				currentMatch.data.MatchData.DoublesServeSequence.push('alpha', 'yankee', 'bravo', 'zulu');
			} else {
				console.log('rallyWinner = ' + rallyWinner)
				console.log('currentMatch.data.MatchData.PlayerName.Red1 = ' + currentMatch.data.MatchData.PlayerName.Red1)
				console.log('currentMatch.data.MatchData.PlayerName.Blue1 = ' + currentMatch.data.MatchData.PlayerName.Blue1)		
				currentMatch.data.MatchData.WhosServe = 'blue'
				currentMatch.data.MatchData.DoublesServeSequence.push('yankee', 'alpha', 'zulu', 'bravo');
			}					

			currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[0];					
													
			// reset RallyForTheServe flag
			currentMatch.data.MatchData.RallyForTheServe = false;

			async.parallel([
							
				function(callback) {
					// placeholder - removed beforeMatch joke
					callback(null);
				},					

				function(callback) {
					// if this is a singles match, go get the historical record of their matchups over time
					if (currentMatch.data.MatchType == 'singles' && currentMatch.data.Red1PlayerID != 0) {

						singlesMatchupResults.getSinglesMatchupResults(currentMatch, function (matchupStats) {
							var redPlayerMatchesWon = 0;
							var bluePlayerMatchesWon = 0;
							
							// matchupStats[0] is an array of all the matches where the player was Red1
							// matchupStats[1] is an array of all the matches where the player was Blue1
							matchupStats.forEach(function(playerSlot) { // go through twice, once for Red1, once for Blue1
								playerSlot.forEach(function(item) { // each item is a match that was found where the player was signed in
									console.log('Match date: ' + item.ReadableStartTime);
									console.log('Match type: ' + item.MatchType);
									console.log('Match winner: ' + item.MatchData.MatchWinner);
									if (item.MatchType == 'singles') { 
										if (item.MatchData.MatchWinner == currentMatch.data.Red1PlayerID) {
											redPlayerMatchesWon++;
										} else if (item.MatchData.MatchWinner == currentMatch.data.Blue1PlayerID ) {
											bluePlayerMatchesWon++;
										}
									}
								});
							});
														
							var matchupResults = {
								matchesPlayed: (matchupStats[0].length + matchupStats[1].length),
								redPlayerMatchesWon: redPlayerMatchesWon,
								bluePlayerMatchesWon: bluePlayerMatchesWon
							};
							
							callback(null, matchupResults)
																
						});
					} else {
						callback(null);
					}																
				}		
				
			//This function gets called after the two tasks have called their "task callbacks"
			], function(err, results) { // results contains [matchupResults]			
				var speechText = '';
				// provide players matchup record if playing singles and players are signed in
				if (currentMatch.data.MatchType == 'singles' && currentMatch.data.Red1PlayerID != 0 ) {
					if (results[1].matchesPlayed > 1) { // >1 because this match counts as one
						var matchUps = results[1].matchesPlayed -1;
						speechText += 'You have played each other ' + matchUps + ' time';
						if (results[1].matchesPlayed > 2) {
							speechText += 's. ';
						}
						speechText += '<break time=\"0.3s\" />' + currentMatch.data.MatchData.PlayerName.Red1 + ' has won ' + results[1].redPlayerMatchesWon + ' of those, ';
						speechText += 'and ' + currentMatch.data.MatchData.PlayerName.Blue1 + ' has won ' + results[1].bluePlayerMatchesWon + '. ';										
					} else {
						speechText += 'This is the first match between you that I have record of. Later, I\'ll tell you how history stacks up when the two of you face off.<break time=\"0.3s\" />';
					}
				}				

				// kickoff the match
				var serverName = getServerName(currentMatch);
				if (currentMatch.data.MatchData.ExperiencedUserMode == false) {				
					speechText += 'When a team wins a point, say either: Point red, or point blue.<break time=\"0.2s\" /> New ';
					if (currentMatch.data.MatchType == 'doubles') {
						speechText += currentMatch.data.MatchType + ' ';
					}
					speechText += 'match starting now. ';					
					speechText += serverName;
					speechText += '\'s serve.';	
				} else {
					speechText += 'Match starting now.<break time=\"0.3s\" /> ';
					speechText += serverName;
					speechText += '\'s serve.';						
				};
				
				tellSpeechAndSave(speechText, currentMatch, response);
														
			});


			function getServerName(currentMatch) {
				console.log('entering getServerName function');	
				var serverName = '';
				if (currentMatch.data.MatchType == 'singles') { // this is a singles match
					if (currentMatch.data.MatchData.WhosServe == 'red') {
						serverName = currentMatch.data.MatchData.PlayerName.Red1
					} else {
						serverName = currentMatch.data.MatchData.PlayerName.Blue1
					}
				} else { // this is a doubles match

					switch(currentMatch.data.MatchData.DoublesServer) {
						case 'alpha': 
							serverName = currentMatch.data.MatchData.PlayerName.Red1;
							break;
						case 'bravo':
							serverName = currentMatch.data.MatchData.PlayerName.Red2;
							break;
						case 'yankee':
							serverName = currentMatch.data.MatchData.PlayerName.Blue1;
							break;
						case 'zulu':
							serverName = currentMatch.data.MatchData.PlayerName.Blue2;
							break;				
					}		
					
				}
				return(serverName);
			};

			function tellSpeechAndSave(textToSay, currentMatch, response) {
				console.log('entering tellSpeechAndSave function');
				console.log('textToSay = ' + textToSay);
				//console.log('response = ' + JSON.stringify(response));
				var speechOutput = {
					speech: '<speak>' + textToSay + '</speak>',
					type: AlexaSkill.speechOutputType.SSML
				};
				currentMatch.save(function () {	
					response.tell(speechOutput);                 
				});	
			};
			
		}
	}		

})();
console.log('exiting kickoffMatch.js');
module.exports = kickoffMatch;
		



