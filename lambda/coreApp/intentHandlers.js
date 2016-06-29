
'use strict';
console.log('entering intentHandlers.js');

var textHelper = require('./textHelper'),
    matchStorage = require('./matchStorage'),
	playerStorage = require('./playerStorage'),
	AlexaSkill = require('./AlexaSkill'),
	singlesPlayerHistory = require('./singlesPlayerHistory'),
	doublesTeamHistory = require('./doublesTeamHistory'),
	humor = require('./humor'),
	kickoffMatch = require('./kickoffMatch')
	
var speechText = '',
	pointLoser = '',
	pointWinner = '';

// Ideas for later: 
// - allow a user to create a group of player IDs and then set up a ladder for those players
// - add game point and match point
// - add official rules for serving and switching sides when the score reaches a certain point
// - add give me a little something intent and add a list of cheering, music, sayings for that (Gary Glitter - "Rock and Roll, Parts 1 and 2" (Hey Song): 1972)
// - add announce the match score before starting a new game
// - make load match work with pulling data from current session if data is there


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

function nameToSay(color, currentMatch) {
	console.log('entering nameToSay function');
	if (currentMatch.data.MatchType == 'singles') { // this is a singles match	
		if (color == 'red') {
			var name = currentMatch.data.MatchData.PlayerName.Red1
		} else {
			var name = currentMatch.data.MatchData.PlayerName.Blue1
		}
	} else { // this is a doubles match
		if (color == 'red') {
			var name = currentMatch.data.MatchData.PlayerName.Red1 + ' and ' + currentMatch.data.MatchData.PlayerName.Red2;
		} else {
			var name = currentMatch.data.MatchData.PlayerName.Blue1  + ' and ' + currentMatch.data.MatchData.PlayerName.Blue2;
		}		
	}
	return(name);
};

function fulfillNewMatch(session, response) {
	console.log('entering fulfillNewMatch function');
	matchStorage.newMatch(session, function (currentMatch) {

		// if firstToServe has already been specified then it is a doubles match and must set WhosServe. Otherwise, it will be set by who wins the Rally
		if (session.attributes.firstToServe) {
			currentMatch.data.MatchData.WhosServe = session.attributes.firstToServe;
		}
		
		currentMatch.data.MatchType = session.attributes.singlesOrDoubles;
		
		if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
			if (currentMatch.data.MatchType == 'doubles') {				
				speechText = 'Welcome doublesplayers.<break time=\"0.4s\" /> ';
	
			} else {
				speechText = 'Welcome pingpong players.<break time=\"0.4s\" /> ';
			};

			// Redirect to 'Add Player' 
			
			if (session.attributes.alreadyExplainedID == true) {
				speechText += 'Who is playing? Tell me the first player\'s four digit I.D.';					
			} else {
				speechText += 'Who is playing? Tell me the first player\'s four digit I.D.<break time=\"0.3s\" /> If you don\'t haveone yet, say register a new player.';
				session.attributes.alreadyExplainedID = true;
			} 			

			var repromptTextToSay = 'What is your four digit player I.D.?';			
		} else {
			// use few words
			speechText = 'What\'s your player I.D.?';
			var repromptTextToSay = 'What\'s your player I.D.?';			
		};	

		askSpeechAndSave(speechText, repromptTextToSay, currentMatch, response);	
	});	
};

function fulfillAddPlayer(session, response) {
	// Both the one-shot and dialog based paths lead to this method to issue the add player request, and
	// respond to the user with confirmation.
	console.log('entering fulfillAddPlayer');
	console.log('session.attributes.team  ' + session.attributes.team);
	console.log('session.attributes.phoneKey  ' + session.attributes.phoneKey);
	
	matchStorage.loadMatch(session, function (currentMatch) { // need to get match data because we will add player data to it and re-save
		if (typeof(currentMatch) == 'string') {
			matchNotFound(currentMatch, response);
			return;
		};	
		session.attributes.currentMatch = currentMatch;
		playerStorage.loadPlayer(session, function (newMatchPlayer) {
			if (newMatchPlayer == 'errorLoadingPlayer') {
				var speechText = 'There was a problem accessing the registered players list. Please try again.';
				var repromptTextToSay = 'Would you like to add a player, register a new player, or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);
				return;
			}			
			if (newMatchPlayer == 'playerNotFound') {
				var speechText = 'Hmm, I wasn\'t able to find that 4 digit player I.D.<break time=\"0.3s\" />Please try again.';
				speechText += ' Or, you can register that number by saying: Register a new player.';
				var repromptTextToSay = 'Would you like to add a player, register a new player, or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);
				return;
			}
			
			if (session.attributes.team == 'red') {
				if (currentMatch.data.MatchType == 'singles') {
					// use the Red1/Blue1PlayerID
					if (currentMatch.data.Red1PlayerID == 0) {
						currentMatch.data.Red1PlayerID = newMatchPlayer.data.Phone;
						currentMatch.data.MatchData.PlayerName.Red1 = newMatchPlayer.data.Name;
					} else {
						var speechText = 'There is already a player assigned to the red team.'; 
						speechText += ' You can start a new match or add a player to the blue team if that was your intent.';
						var repromptTextToSay = 'You can start a new match or add a player to the blue team if that was your intent.';
						askSpeech(speechText, repromptTextToSay, response);						
					};
				} else {
					// this is a doubles match. Check to see if the player should be assigned Red/Blue1 or Red/Blue2
					if (currentMatch.data.Red1PlayerID == 0) {
						currentMatch.data.Red1PlayerID = newMatchPlayer.data.Phone;
						currentMatch.data.MatchData.PlayerName.Red1 = newMatchPlayer.data.Name;
						currentMatch.data.MatchData.PlayerAlias.Red1 = 'alpha';
						var callSign = currentMatch.data.MatchData.PlayerName.Red1;
					} else if (currentMatch.data.Red2PlayerID == 0) {
						console.log('assigning new player to red 2');
						currentMatch.data.Red2PlayerID = newMatchPlayer.data.Phone;
						console.log('currentMatch.data.Red2PlayerID = ' + currentMatch.data.Red2PlayerID);
						currentMatch.data.MatchData.PlayerName.Red2 = newMatchPlayer.data.Name;
						currentMatch.data.MatchData.PlayerAlias.Red2 = 'bravo';
						var callSign = currentMatch.data.MatchData.PlayerName.Red2;						
					} else {
						var speechText = 'Both doubles partners are already assigned to the red team.'; 
						speechText += ' You can start a new match or add a player to the blue team if that was your intent.';
						var repromptTextToSay = 'You can start a new match or add a player to the blue team if that was your intent.';
						askSpeech(speechText, repromptTextToSay, response);
					};
				};	
			} else if (session.attributes.team == 'blue') {
				if (currentMatch.data.MatchType == 'singles') {
					// use the Red1/Blue1PlayerID
					if (currentMatch.data.Blue1PlayerID == 0) {
						currentMatch.data.Blue1PlayerID = newMatchPlayer.data.Phone;
						currentMatch.data.MatchData.PlayerName.Blue1 = newMatchPlayer.data.Name;
					} else {
						var speechText = 'There is already a player assigned to the blue team.'; 
						speechText += ' You can start a new match or add a player to the red team if that was your intent.';
						var repromptTextToSay = 'You can start a new match or add a player to the red team if that was your intent.';						
						askSpeech(speechText, repromptTextToSay, response);						
					};
				} else {
					// this is a doubles match. Check to see if the player should be assigned Red/Blue1 or Red/Blue2
					if (currentMatch.data.Blue1PlayerID == 0) {
						currentMatch.data.Blue1PlayerID = newMatchPlayer.data.Phone;
						currentMatch.data.MatchData.PlayerName.Blue1 = newMatchPlayer.data.Name;
						currentMatch.data.MatchData.PlayerAlias.Blue1 = 'yankee';
						var callSign = currentMatch.data.MatchData.PlayerName.Blue1;						
					} else if (currentMatch.data.Blue2PlayerID == 0) {
						console.log('assigning new player to red 2');
						currentMatch.data.Blue2PlayerID = newMatchPlayer.data.Phone;
						console.log('currentMatch.data.Blue2PlayerID = ' + currentMatch.data.Blue2PlayerID);
						currentMatch.data.MatchData.PlayerName.Blue2 = newMatchPlayer.data.Name;
						currentMatch.data.MatchData.PlayerAlias.Blue2 = 'zulu';
						var callSign = currentMatch.data.MatchData.PlayerName.Blue2;						
					} else {
						var speechText = 'Both doubles partners are already assigned to the blue team.'; 
						speechText += ' You can start a new match or add a player to the red team if that was your intent.';
						var repromptTextToSay = 'You can start a new match or add a player to the red team if that was your intent.';
						askSpeech(speechText, repromptTextToSay, response);
					};
				};				
			};
		
			var speechText = 'Welcome ' + newMatchPlayer.data.Name; 			
			speechText += ', you are playing on the  ';
			speechText += session.attributes.team;	
			speechText += ' team.';	
			console.log('speechText = ' + speechText);		
			
			if (currentMatch.data.MatchType == 'doubles') {
				// if the serve order has not yet been fully defined (both red and blue teams selected who serves first), then define in order of players added
				if (session.attributes.team == 'red' && currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo' ) {
					currentMatch.data.MatchData.FirstRedToServe = 'alpha';
					speechText += '<break time=\"0.3s\" /> You will be first to serve on your team.';
				} else if (session.attributes.team == 'blue' && currentMatch.data.MatchData.FirstBlueToServe == 'YankeeOrZulu') {
					currentMatch.data.MatchData.FirstBlueToServe = 'yankee';
					speechText += '<break time=\"0.3s\" /> You will be first to serve on your team.';
				};
			}
			
			// cleanup session variables in prep for adding a different player later
			delete session.attributes.phoneKey;
			delete session.attributes.team;						
						
			if (	// if we have all the players signed in
					(currentMatch.data.MatchType == 'singles' && 
					 currentMatch.data.Red1PlayerID != 0 && 
					 currentMatch.data.Blue1PlayerID != 0 ) ||
					 
					(currentMatch.data.MatchType == 'doubles' && 
					 currentMatch.data.Red1PlayerID != 0 && 
					 currentMatch.data.Blue1PlayerID != 0 &&
					 currentMatch.data.Red2PlayerID != 0 && 
					 currentMatch.data.Blue2PlayerID != 0 )	) {
				if (currentMatch.data.MatchType == 'doubles')	{
					speechText += '<break time=\"0.3s\" /> All players added.';
				};
				var allPlayersAdded = true;
				// set flag expecting user to invoke WhoWonRallyIntent
				currentMatch.data.MatchData.RallyForTheServe = true;
				// have players rally for the serve and then say who will be serving first
				speechText += ' Rally for the serve, and then tell me who wins. For example say, use ping pong and ';
				speechText += 'first to serve is ' + currentMatch.data.MatchData.PlayerName.Red1 + '.';
									
			} else { // all players are not yet signed in
				if (currentMatch.data.MatchType == 'singles') {
					if (currentMatch.data.Red1PlayerID != 0) { // red singles player was added
						if (currentMatch.data.MatchData.ExperiencedUserMode == false) {	
							speechText += '<break time=\"0.3s\" />Who else is playing? Tell me your player I.D.';
							var repromptTextToSay = 'What is the 4 digit player I.D. of the other player?';	
						} else {
							speechText += '<break time=\"0.3s\" />Who else is playing?';
							var repromptTextToSay = 'What is the 4 digit player I.D. of the other player?';
						}							
					} else {
						if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
							speechText += '<break time=\"0.3s\" />Who else is playing? Tell me your player I.D.';
							var repromptTextToSay = 'What is the 4 digit player I.D. of the other player?';	
						} else {
							speechText += '<break time=\"0.3s\" />Who else is playing?';
							var repromptTextToSay = 'What is the 4 digit player I.D. of the other player?';							
						}							
					};
				} else { // this is a doubles match					
					// there is at least 1 player of the 4	that has not yet been added, it may be 1 or it may be 3		
					if (currentMatch.data.MatchData.PlayerName.Red1 == 'TBD' || 
						currentMatch.data.MatchData.PlayerName.Blue1 == 'TBD' ) { // 1 player has not yet been added to each team
						if (currentMatch.data.MatchData.FirstRedToServe == 'alpha' || currentMatch.data.MatchData.FirstRedToServe == 'bravo') {
							if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
								speechText += '<break time=\"0.3s\" /> Now add a player to the blue team by telling me their 4 digit player I.D.';
								var repromptTextToSay = 'Blue team player, what is your four digit player I.D.?';
							};									
						} else {
							if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
								speechText += '<break time=\"0.3s\" /> Now add a player to the red team by telling me their 4 digit player I.D.';
								var repromptTextToSay = 'Red team player, what is your four digit player I.D.?';
							};									
						};
					} else { // 2 players are signed in (at least one player to each team), but not all 4 
						if (currentMatch.data.Red1PlayerID != 0 && currentMatch.data.Red2PlayerID != 0 ) { // both red players are signed in
							if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
								speechText += '<break time=\"0.3s\" /> Both red players are now signed in. Now add a player to the blue team by telling me their 4 digit player I.D.';
								console.log('speechText d = ' + speechText);
								var repromptTextToSay = 'Blue player two, what is your player I.D.?';
							};									
						} else if (currentMatch.data.Blue1PlayerID != 0 && currentMatch.data.Blue2PlayerID != 0) { // both blue players are signed in
							if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
								speechText += '<break time=\"0.3s\" /> Both blue players are now signed in. Now add a player to the red team by telling me their 4 digit player I.D.?';
								console.log('speechText e = ' + speechText);
								var repromptTextToSay = 'Red player two, what is your player I.D.??';
							};									
						} else {
							if (currentMatch.data.MatchData.ExperiencedUserMode == false) { // one or both of the 2nd red and blue team players are not yet signed in
								if (currentMatch.data.Red2PlayerID == 0) {
									speechText += '<break time=\"0.3s\" /> Now add the second player to the red team by telling me their 4 digit player I.D.';
									var repromptTextToSay = 'Red player two, what is your 4 digit player I.D.?';
								} else if (currentMatch.data.Blue2PlayerID == 0) {
									speechText += '<break time=\"0.3s\" /> Now add the second player to the blue team by telling me their 4 digit player I.D.';
									var repromptTextToSay = 'Blue player two, what is your 4 digit player I.D.?';						
								}
							};									
						};
					};																														
				};
			};
				
			if (!allPlayersAdded) {
				askSpeechAndSave(speechText, repromptTextToSay, currentMatch, response);
			} else {
				tellSpeechAndSave(speechText, currentMatch, response);
			};							
        });
    });
};

function fulfillSavePreferences(session, response) {
	// When player I.D. confirmed, store the current match settings in given player's profile
	// These include:
	// 		SwitchSides: flag to indicate whether players want to switch sides during the match. Default = true
	// 		PlayGamePoint: flag to indicate whether players want to play No Ad scoring or not. Default = false
	// 		ExperiencedUserMode: flag to indicate whether minimal words should be spoken. Default = false
	//		AnnounceServe: flag to indicate whether or not to announce who's serve it is when starting a new game
	//		AnnounceScore: flag to indicate whether or not to announce the score when starting a new game
	
	console.log('entering fulfillAddPlayer');
	matchStorage.loadMatch(session, function (currentMatch) { // need to get match data because we will add player data to it and re-save
		if (typeof(currentMatch) == 'string') {
			matchNotFound(currentMatch, response);
			return;
		};	
 		
		session.attributes.currentMatch = currentMatch;
		playerStorage.loadPlayer(session, function (loadedPlayer) {
			if (loadedPlayer == 'errorLoadingPlayer') {
				var speechText = 'There was a problem accessing the registered players list. Please try again.';
				var repromptTextToSay = 'Would you like to add a player, register a new player, or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);
				return;
			}			
			if (loadedPlayer == 'playerNotFound') {
				var speechText = 'Hmm, I wasn\'t able to find that four digit player I.D.<break time=\"0.3s\" />Please try again.';
				speechText += ' Or, you can register that number by saying: Register a new player.';
				var repromptTextToSay = 'Would you like to add a player, register a new player, save preferences, or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);
				return;
			}
			
			if (loadedPlayer.data.Phone != currentMatch.data.Red1PlayerID && 
				loadedPlayer.data.Phone != currentMatch.data.Red2PlayerID &&
				loadedPlayer.data.Phone != currentMatch.data.Blue1PlayerID &&
				loadedPlayer.data.Phone != currentMatch.data.Blue2PlayerID) {
				var speechText = 'That number didn\'t match any of the players that are currently signed in.<break time=\"0.3s\" />Please try again.';
				speechText += ' Or, you can register a number by saying: Register a new player.';
				var repromptTextToSay = 'Would you like to add a player, register a new player, save preferences, or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);
				return;
			}			
			
			loadedPlayer.data.Preferences.TwentyOnePointer = currentMatch.data.MatchData.TwentyOnePointer;
			loadedPlayer.data.Preferences.GamesPerMatch = currentMatch.data.MatchData.GamesPerMatch;
			loadedPlayer.data.Preferences.SassMeter = currentMatch.data.MatchData.SassMeter;
			loadedPlayer.data.Preferences.SwitchSides = currentMatch.data.MatchData.SwitchSides;
			loadedPlayer.data.Preferences.ExperiencedUserMode = currentMatch.data.MatchData.ExperiencedUserMode;

			loadedPlayer.save(session, function () {
				response.tell('Preferences successfully saved');	
			});							
        });
    });
};

function fulfillLoadPreferences(session, response) {
	// When four digit player I.D. confirmed, retrieve the user's preferences and apply them to the current match 
	// These include:
	//				TwentyOnePointer: false, // set if players call for a 21 point game
	//				GamesPerMatch: 1, // number of games per match, either 1 or 5 (best 3 out of 5)
	//				SassMeter: 5, // specifies the likelyhood of telling a joke after a point is played, between 0 (no jokes) and 10 (a joke every time)					
	//				SwitchSides: true, // flag to indicate whether players want to switch sides during the match. Default = true
	//				AnnounceServe: true, // flag to indicate whether or not to announce who's serve it is when starting a new game
	//				ExperiencedUserMode: false // flag to indicate whether minimal words should be spoken. Default = false
	console.log('entering fulfillAddPlayer');
	matchStorage.loadMatch(session, function (currentMatch) { // need to get match data because we will add player data to it and re-save
		if (typeof(currentMatch) == 'string') {
			matchNotFound(currentMatch, response);
			return;
		};	
 		
		session.attributes.currentMatch = currentMatch;
		playerStorage.loadPlayer(session, function (loadedPlayer) {
			if (loadedPlayer == 'errorLoadingPlayer') {
				var speechText = 'There was a problem accessing the registered players list. Please try again.';
				var repromptTextToSay = 'Would you like to add a player, register a new player, save preferences, or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);
				return;
			}			
			if (loadedPlayer == 'playerNotFound') {
				var speechText = 'Hmm, I wasn\'t able to find that four digit player I.D.<break time=\"0.3s\" /> Please try again.';
				speechText += ' Or, you can register that number by saying: Register a new player.';
				var repromptTextToSay = 'Would you like to add a player, register a new player, save preferences, or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);
				return;
			}						

			currentMatch.data.MatchData.TwentyOnePointer = loadedPlayer.data.Preferences.TwentyOnePointer;
			currentMatch.data.MatchData.GamesPerMatch = loadedPlayer.data.Preferences.GamesPerMatch;
			currentMatch.data.MatchData.SassMeter = loadedPlayer.data.Preferences.SassMeter;
			currentMatch.data.MatchData.SwitchSides = loadedPlayer.data.Preferences.SwitchSides;
			currentMatch.data.MatchData.ExperiencedUserMode = loadedPlayer.data.Preferences.ExperiencedUserMode;
						
			speechText = 'Preferences applied.';
			tellSpeechAndSave(speechText, currentMatch, response)
        });		
    });
};

function matchNotFound(currentMatch, response) {
	console.log('entering matchNotFound function');
	if (currentMatch == 'errorLoadingMatch') {
		var speechText = 'There was a problem communicating with the match database. ';
	} else {
		var speechText = 'Hmm, I wasn\'t able to find a match played with this Echo in the last two hours. ';	
	}
	speechText += 'If you would like to start a new match say, start a match.';	
	var repromptOutput = 'If you would like to start a new match say, start a match.';
	response.ask(speechText, repromptOutput);
};
		
function askSpeech(textToSay, repromptTextToSay, response) {
	console.log('entering askSpeech function');
	console.log('textToSay = ' + textToSay);
	//console.log('response = ' + JSON.stringify(response));
	var speechOutput = {
		speech: '<speak>' + textToSay + '</speak>',
		type: AlexaSkill.speechOutputType.SSML
	};
	var repromptOutput = {
		speech: '<speak>' + repromptTextToSay + '</speak>',
		type: AlexaSkill.speechOutputType.SSML
    };
	response.ask(speechOutput, repromptOutput);	
};

function askSpeechAndSave(textToSay, repromptTextToSay, currentMatch, response) {
	console.log('entering askSpeechAndSave function');
	console.log('textToSay = ' + textToSay);
	//console.log('response = ' + JSON.stringify(response));
	var speechOutput = {
		speech: '<speak>' + textToSay + '</speak>',
		type: AlexaSkill.speechOutputType.SSML
	};
	var repromptOutput = {
		speech: '<speak>' + repromptTextToSay + '</speak>',
		type: AlexaSkill.speechOutputType.SSML
    };
	currentMatch.save(function () {
		response.ask(speechOutput, repromptOutput);	                
	});		
};		
	
function tellSpeech(textToSay, currentMatch, response) {
	console.log('entering tellSpeech function');
	console.log('textToSay = ' + textToSay);
	//console.log('response = ' + JSON.stringify(response));
	var speechOutput = {
		speech: '<speak>' + textToSay + '</speak>',
		type: AlexaSkill.speechOutputType.SSML
	};
	response.tell(speechOutput);                 	
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

function formatMatchScore(currentMatch, speechOrText) {
	console.log('entering formatMatchScore function');	
	if (currentMatch.data.MatchData.RedTeamTotalGamesWon > currentMatch.data.MatchData.BlueTeamTotalGamesWon) {
		var matchLeaderScore = currentMatch.data.MatchData.RedTeamTotalGamesWon.toString();
		var otherTeamScore = currentMatch.data.MatchData.BlueTeamTotalGamesWon.toString();
		if (currentMatch.data.MatchType == 'singles') {
			var matchLeader = ', ' + currentMatch.data.MatchData.PlayerName.Red1;
		} else {
			var matchLeader = ', Red Team';
		}		
	} else if (currentMatch.data.MatchData.RedTeamTotalGamesWon == currentMatch.data.MatchData.BlueTeamTotalGamesWon) {
		var matchLeaderScore = currentMatch.data.MatchData.RedTeamTotalGamesWon.toString();
		var otherTeamScore = currentMatch.data.MatchData.BlueTeamTotalGamesWon.toString();
		var matchLeader = '';
	} else {
		var matchLeaderScore = currentMatch.data.MatchData.BlueTeamTotalGamesWon.toString();
		var otherTeamScore = currentMatch.data.MatchData.RedTeamTotalGamesWon.toString();
		if (currentMatch.data.MatchType == 'singles') {
			var matchLeader = ', ' + currentMatch.data.MatchData.PlayerName.Blue1;
		} else {
			var matchLeader = ', Blue Team';
		}
	};
	
	var middlePart = '';
	if (speechOrText == 'text') {
		middlePart = '-';
	} else { // speechOrText = 'speech'
		if (matchLeaderScore == 1 ) {
			middlePart = ' game to ';
		} else if (matchLeaderScore > 1) {
			middlePart = ' games to ';
		};		
	}

	var formattedMatchScore = matchLeaderScore + middlePart + otherTeamScore + matchLeader;		
	return formattedMatchScore;
};

function formatGameScore(gameToSay, sayTeam, speechOrText, currentMatch) {
	console.log('entering formatGameScore function');
	if (gameToSay == 1) {
		var rawScores = currentMatch.data.MatchData.Game1Score.split(" ");				
	} else if (gameToSay == 2) {
		var rawScores = currentMatch.data.MatchData.Game2Score.split(" ");
	} else if (gameToSay == 3) {
		var rawScores = currentMatch.data.MatchData.Game3Score.split(" ");
	} else if (gameToSay == 4) {
		var rawScores = currentMatch.data.MatchData.Game4Score.split(" ");
	} else if (gameToSay == 5) {
		var rawScores = currentMatch.data.MatchData.Game5Score.split(" ");		
	};

	if (speechOrText == 'speech') {
		var formattedGameScore = rawScores[0] + ' to ' + rawScores[1] + ' ';
		if ( (rawScores[2]) && sayTeam == true ) {
			formattedGameScore += rawScores[2];
		};		
	} else { // speechOrText = 'text'
		var formattedGameScore = rawScores[0] + '-' + rawScores[1]
		if ( (rawScores[2]) ) {
			formattedGameScore += ', ' + rawScores[2] 
		};		
	};
	
	return formattedGameScore;
};

function pointToPlayer(colorWinner, currentMatch, response) {
	console.log('entering pointToPlayer function');
	//console.log('currentMatch in intentHandlers = ' + JSON.stringify(currentMatch) );
	console.log('Red Team game score before = ' + currentMatch.data.MatchData.RedTeamGameScore);
	console.log('Blue Team game score before = ' + currentMatch.data.MatchData.BlueTeamGameScore);
	console.log('Current Server = ' + currentMatch.data.MatchData.WhosServe);
	
	// check to ensure match is still in progress
	if (currentMatch.data.MatchData.MatchWinner != 0) {
		speechText = 'This match is over. To hear results, say, give me a summary of the match. Otherwise you can start a new match or say, all done.';
		var repromptTextToSay = '';
		askSpeech(speechText, repromptTextToSay, response);	
		return;
	};
	
	// check to make sure players are signed in
	if (currentMatch.data.MatchData.PlayerName.Red1 == 'TBD' || currentMatch.data.MatchData.PlayerName.Blue1 == 'TBD') {
		// Redirect to 'Add Player' 
		speechText = 'First I need to know who is playing. Tell me the first player\'s four digit I.D.<break time=\"0.3s\" /> If you don\'t haveone yet, say register a new player.';
		var repromptTextToSay = 'What is your four digit player I.D.?';			
		askSpeechAndSave(speechText, repromptTextToSay, currentMatch, response);
		return;
	};
	
	// check to make server has been specified
	if (currentMatch.data.MatchData.WhosServe == 'TBDServer') {
		// Redirect to rally for the serve 
		speechText = 'First I need to know who is serving. Rally for the serve, and then tell me who wins. For example say, use ping pong and ';
		speechText += 'first to serve is ' + currentMatch.data.MatchData.PlayerName.Blue1 + '.';
		currentMatch.data.MatchData.RallyForTheServe = true;
		tellSpeechAndSave(speechText, currentMatch, response);		
		return;
	};	
		
	// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later	
	for (var stat in currentMatch.data.MatchData) {
		if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
			currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
		};
	};

	// set the start of match time to time of first point
	if (currentMatch.data.MatchData.TimeOfFirstPoint == '0') {
		currentMatch.data.MatchData.TimeOfFirstPoint = new Date().getTime();
		console.log('TimeOfFirstPoint = ' + currentMatch.data.MatchData.TimeOfFirstPoint);
	};	
	
	// update ScoreLastUpdated for future match duration calcs
	currentMatch.data.MatchData.ScoreLastUpdated = new Date().getTime();
	console.log('ScoreLastUpdated = ' + currentMatch.data.MatchData.ScoreLastUpdated);	
	
	var currentServer = currentMatch.data.MatchData.WhosServe;	
	if (currentServer == 'red') {
		currentMatch.data.MatchData.RedPointsServed++;
	} else {
		currentMatch.data.MatchData.BluePointsServed++;
	};
	// establish who got the point and set values appropriately
	if (colorWinner == 'point red') { // red won the point
		// increment pointWinner's total points won in the match
		currentMatch.data.MatchData.RedTeamTotalPointsWon++;
		currentMatch.data.MatchData.BluePointStreak = 0; // reset the opposing team's point streak
		currentMatch.data.MatchData.PointWinner = 'red'; // will be referred to under nMinusOne to determine who won prior point
		pointWinner = 'red';
		if (currentMatch.data.nMinusOne.PointWinner == 'red') { // extend point streaks as applicable
			if (currentMatch.data.MatchData.RedPointStreak == 0) {
				currentMatch.data.MatchData.RedPointStreak++; // give credit for the 1st point of the streak
			}
			currentMatch.data.MatchData.RedPointStreak++; // increment the streak
			if (currentMatch.data.MatchData.RedPointStreak > currentMatch.data.MatchData.MaxRedPointStreak) {
				currentMatch.data.MatchData.MaxRedPointStreak = currentMatch.data.MatchData.RedPointStreak;
			};
		};
		pointLoser = 'blue';
		currentMatch.data.MatchData.RedTeamGameScore++; // increment Blue team game score
		var pointWinnerScore = currentMatch.data.MatchData.RedTeamGameScore;
		var pointLoserScore = currentMatch.data.MatchData.BlueTeamGameScore;
		if (currentMatch.data.MatchData.WhosServe == 'red') {
			var serverWonPoint = true;
			currentMatch.data.MatchData.RedPointsWonOnServe++;
		} else if (currentMatch.data.MatchData.WhosServe == 'blue') {
			var serverWonPoint = false;
			currentMatch.data.MatchData.RedPointsWonOffServe++;
		};
	} else { // blue won the point
		// increment pointWinner's total points won in the match
		currentMatch.data.MatchData.BlueTeamTotalPointsWon++;
		currentMatch.data.MatchData.RedPointStreak = 0; // reset the opposing team's point streak
		currentMatch.data.MatchData.PointWinner = 'blue'; // will be referred to under nMinusOne to determine who won prior point
		pointWinner = 'blue';
		if (currentMatch.data.nMinusOne.PointWinner == 'blue') { // extend point streaks as applicable
			if (currentMatch.data.MatchData.BluePointStreak == 0) {
				currentMatch.data.MatchData.BluePointStreak++; // give credit for the 1st point of the streak
			}		
			currentMatch.data.MatchData.BluePointStreak++; // increment the streak
			if (currentMatch.data.MatchData.BluePointStreak > currentMatch.data.MatchData.MaxBluePointStreak) {
				currentMatch.data.MatchData.MaxBluePointStreak = currentMatch.data.MatchData.BluePointStreak;
			};
		};
		pointLoser = 'red';
		currentMatch.data.MatchData.BlueTeamGameScore++; // increment Blue team game score
		var pointWinnerScore = currentMatch.data.MatchData.BlueTeamGameScore;
		var pointLoserScore = currentMatch.data.MatchData.RedTeamGameScore;	
		if (currentMatch.data.MatchData.WhosServe == 'blue') {
			var serverWonPoint = true;
			currentMatch.data.MatchData.BluePointsWonOnServe++;
		} else if (currentMatch.data.MatchData.WhosServe == 'red') {
			var serverWonPoint = false;
			currentMatch.data.MatchData.BluePointsWonOffServe++;
		};
	};	
			
	// see if someone wins the game
	if (currentMatch.data.MatchData.TwentyOnePointer == false) { // this is an 11 point game
		if ( Math.abs(currentMatch.data.MatchData.RedTeamGameScore - currentMatch.data.MatchData.BlueTeamGameScore) >= 2 &&
			 ( currentMatch.data.MatchData.RedTeamGameScore >=11 || currentMatch.data.MatchData.BlueTeamGameScore >=11) ) { // someone wins the game
				// construct the score to say
				speechText = constructScoreOutput(currentMatch, currentServer);
				pointWinnerWinsGame();
				return;
		};			
	} else { // this is a 21 point game
		if ( Math.abs(currentMatch.data.MatchData.RedTeamGameScore - currentMatch.data.MatchData.BlueTeamGameScore) >= 2 &&
			 ( currentMatch.data.MatchData.RedTeamGameScore >=21 || currentMatch.data.MatchData.BlueTeamGameScore >=21) ) { // someone wins the game
				// construct the score to say
				speechText = constructScoreOutput(currentMatch, currentServer);
				pointWinnerWinsGame();
				return;
		};			
	};
					
	// If this is a singles match, serve goes to the next team after each team serves either 2 or 5 points
	if (currentMatch.data.MatchType == 'singles') {
		if (timeToSwitchServe(currentMatch, currentMatch.data.MatchData.BlueTeamGameScore + currentMatch.data.MatchData.RedTeamGameScore) ) {
			var priorServer = currentMatch.data.MatchData.WhosServe;			
			if (priorServer == 'red') {
				currentServer = 'blue';			
			} else {
				currentServer = 'red';
			};			
			currentMatch.data.MatchData.WhosServe = currentServer;
			
			// construct the score to say
			speechText = constructScoreOutput(currentMatch, currentServer);
			
			speechText += '<break time=\"0.4s\" />It is '; 			
			var serverName = getServerName(currentMatch);
			speechText += serverName;
			speechText += '\'s serve.';			
		} else {
			// construct the score to say
			speechText = constructScoreOutput(currentMatch, currentServer);
		};			

	// If this is a doubles match, serve goes to the next team after each team serves either 2 or 5 points
	} else if (currentMatch.data.MatchType == 'doubles') { 

		if (timeToSwitchServe(currentMatch, currentMatch.data.MatchData.BlueTeamGameScore + currentMatch.data.MatchData.RedTeamGameScore) ) {
			var priorServer = currentMatch.data.MatchData.WhosServe;			
			if (priorServer == 'red') {
				currentServer = 'blue';			
			} else {
				currentServer = 'red';
			};			
			currentMatch.data.MatchData.WhosServe = currentServer;
			
			// figure out which doubles partner should now be serving	
			var priorDoublesServerIndex = currentMatch.data.MatchData.DoublesServeSequence.indexOf(currentMatch.data.MatchData.DoublesServer);
			var nextDoublesServer = priorDoublesServerIndex+1;
			if (priorDoublesServerIndex < 3) {
				currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[nextDoublesServer];
			} else {
				currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[0];
			};				
			
			// construct the score to say			
			speechText = constructScoreOutput(currentMatch, currentServer);
			
			speechText += '<break time=\"0.4s\" /> It is ';			
			var serverName = getServerName(currentMatch);
			speechText += serverName;
			speechText += '\'s serve.';	
			
		} else {
			// construct the score to say
			speechText = constructScoreOutput(currentMatch, currentServer);
		};
	};		
	
	// figure out if it is time to switch sides (in the 5th game, if either team reaches 5 points)	
	if ( currentMatch.data.MatchData.Game == 5 && ( (currentMatch.data.MatchData.RedTeamGameScore == 5) || (currentMatch.data.MatchData.BlueTeamGameScore == 5) ) && currentMatch.data.MatchData.SwitchSides == true) {
		if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
			speechText += '<break time=\"0.5s\" />Time to switch sides.';
		} else {
			speechText += '<break time=\"0.5s\" />Switch sides.';
		};
	};
	
	var winnerName = nameToSay(pointWinner, currentMatch);
	var loserName = nameToSay(pointLoser, currentMatch);
	
	// if it is empty, fill (or refill) the array of after point joke index numbers to draw from
	console.log('currentMatch.data.MatchData.AfterPointJokes.length = ' + currentMatch.data.MatchData.AfterPointJokes.length);
	if (currentMatch.data.MatchData.AfterPointJokes.length == 0) {
		humor.storeJokes('endOfPoint', currentMatch);
	}
	
	// go get a joke, depending on sassMeter it may return a random joke or may skip
	humor.pickJoke( 'endOfPoint', winnerName, loserName, currentMatch, function (joke) {

		speechText += '<break time=\"0.5s\" /> ' + joke + ' <break time=\"0.5s\" /> ';

		// tell the score, whether or not to switch serve, whether or not to switch sides, and maybe a joke
		tellSpeechAndSave(speechText, currentMatch, response);

	});


	function timeToSwitchServe(currentMatch, num) { 
		if (num == 0) {
			return false;
		} else {
			var realNum = num / currentMatch.data.MatchData.PointsToServe;
			var timeToSwitch = Math.round(realNum) === realNum; // Will evaluate to true if the variable is evenly divisible by currentMatch.data.MatchData.PointsToServe
			console.log('timeToSwitchServe = ' + timeToSwitch);
			return timeToSwitch; 				
		};
		return num % currentMatch.data.MatchData.PointsToServe;
	};			
					
	// makes all updates when a point is a game winner
	function pointWinnerWinsGame() { //when a game is won ****************************************************************************************
		console.log('entering pointWinnerWinsGame');											
		console.log('pointWinner = ' + pointWinner);
				
		if (pointWinner == 'red') { // red won the point and the game so update stats
			currentMatch.data.MatchData.RedTeamTotalGamesWon++;
			var pointWinnerGamesWon = currentMatch.data.MatchData.RedTeamTotalGamesWon;			
		} else { // blue won the point and the game so update stats
			currentMatch.data.MatchData.BlueTeamTotalGamesWon++;
			var pointWinnerGamesWon = currentMatch.data.MatchData.BlueTeamTotalGamesWon;			
		};
		
		var winnerName = nameToSay(pointWinner, currentMatch);
		var loserName = nameToSay(pointLoser, currentMatch);
		
		if (currentMatch.data.MatchType == 'singles') {
			speechText = 'Game, ' + winnerName + '. ';
		} else {
			if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
				speechText = 'Game, ' + pointWinner + ' team. ';
			} else {
				speechText = 'Game, ' + pointWinner + '. ';
			};			
		}

		// if it is empty, fill (or refill) the array of after game joke index numbers to draw from
		console.log('currentMatch.data.MatchData.AfterGameJokes.length = ' + currentMatch.data.MatchData.AfterGameJokes.length);
		if (currentMatch.data.MatchData.AfterGameJokes.length == 0) {
			humor.storeJokes('endOfGame', currentMatch);
		}		
		
		// go get an after the game joke, depending on sassMeter it may return a random joke or may skip
		humor.pickJoke( 'endOfGame', winnerName, loserName, currentMatch, function (joke) {

			speechText += '<break time=\"0.5s\" /> ' + joke + ' <break time=\"0.5s\" /> ';
			
			// check to see if pointWinner also wins the match
			if (pointWinnerGamesWon == 3 || (currentMatch.data.MatchData.GamesPerMatch == 1 && pointWinnerGamesWon == 1) ) { // pointWinner wins the match ****************************************************************
				speechText += '<break time=\"0.8s\" />'
								
				if (currentMatch.data.MatchType == 'singles') {
					speechText += 'The match goes to ' + winnerName + ', ';
				} else {	
					if (pointWinner == 'red') {
						var doublesWinnerNames = currentMatch.data.MatchData.PlayerName.Red1 + ' and ' + currentMatch.data.MatchData.PlayerName.Red2
					} else {
						currentMatch.data.MatchData.PlayerName.Blue1 + ' and ' + currentMatch.data.MatchData.PlayerName.Blue2
					}				
					speechText += 'The match goes to ' + doublesWinnerNames + ' , ';
				}
				
				if (currentMatch.data.MatchData.RedTeamTotalGamesWon > currentMatch.data.MatchData.BlueTeamTotalGamesWon) {
					var matchLeaderScore = currentMatch.data.MatchData.RedTeamTotalGamesWon.toString();
					var otherTeamScore = currentMatch.data.MatchData.BlueTeamTotalGamesWon.toString();
				} else {
					var matchLeaderScore = currentMatch.data.MatchData.BlueTeamTotalGamesWon.toString();
					var otherTeamScore = currentMatch.data.MatchData.RedTeamTotalGamesWon.toString();
				};							
				var formattedMatchScore = matchLeaderScore + ' game'
				if (currentMatch.data.MatchData.GamesPerMatch != 1) {
					formattedMatchScore += 's';
				}
				formattedMatchScore += ' to ' + otherTeamScore + '. <break time=\"0.4s\" />';						
																	
				speechText += formattedMatchScore;	

				updateGameXScoresParam(currentMatch); // update Game1Score, Game2Score, Game3Score, Game4Score or Game5Score				
				
				var counter = 6;
				console.log('counter before = ' + counter);
				
				var formatted2ndGameScore = formatGameScore(2, false, 'speech', currentMatch);
				var secondGameScores = formatted2ndGameScore.split(" ");
				var noCommaSecondGameScore = secondGameScores[2].split(""); // must remove comma in "0 to 0,"
				if (secondGameScores[0] == '0' && noCommaSecondGameScore[0] == '0') { // the 2nd game wasn't played
					counter--;
					console.log('counter after = ' + counter);
				};				
				
				var formatted3rdGameScore = formatGameScore(3, false, 'speech', currentMatch);
				var thirdGameScores = formatted3rdGameScore.split(" ");
				var noCommaThirdGameScore = thirdGameScores[2].split(""); // must remove comma in "0 to 0,"
				if (thirdGameScores[0] == '0' && noCommaThirdGameScore[0] == '0') { // the 3rd game wasn't played
					counter--;
					console.log('counter after = ' + counter);
				};				
				
				var formatted4thGameScore = formatGameScore(4, false, 'speech', currentMatch);
				var fourthGameScores = formatted4thGameScore.split(" ");
				var noCommaFourthGameScore = fourthGameScores[2].split(""); // must remove comma in "0 to 0,"
				if (fourthGameScores[0] == '0' && noCommaFourthGameScore[0] == '0') { // the 4th game wasn't played
					counter--;
					console.log('counter after = ' + counter);
				};
				
				var formatted5thGameScore = formatGameScore(5, false, 'speech', currentMatch);
				var fifthGameScores = formatted5thGameScore.split(" ");
				console.log('fifthGameScores[0] = ' + fifthGameScores[0]);
				console.log('fifthGameScores[2] = ' + fifthGameScores[2]);
				var noCommaFifthGameScore = fifthGameScores[2].split(""); // must remove comma in "0 to 0,"
				if (fifthGameScores[0] == '0' && noCommaFifthGameScore[0] == '0') { // the 5th game wasn't played
					counter--;
					console.log('counter after = ' + counter);
				};			
				
				var i;
				for (i = 1; i < counter; i++) { 
					console.log('i = ' + i);
					var formattedGameScore = formatGameScore(i, false, 'speech', currentMatch);
					if (i == 1) {
						if (currentMatch.data.MatchData.GamesPerMatch == 1) {
							speechText += 'Game score, ';
						} else {
							speechText += 'First game, ';
						}
					} else if (i == 2) {
						speechText += 'Second game, ';
					} else if (i == 3) {
						speechText += 'Third game, ';
					} else if (i == 4) {
						speechText += 'Fourth game, ';
					} else if (i == 5) {
						speechText += 'Fifth game, ';					
					};						
					speechText += formattedGameScore;
					speechText += '<break time=\"0.3s\" />';
				};
				
				if (currentMatch.data.MatchType == 'singles') { // for singles matches, store the match winner's playerID
				
					if (currentMatch.data.Red1PlayerID == 0) { // players were not signed in so use code 77777 indicating players chose 'use ping pong and let's play'
						currentMatch.data.MatchData.MatchWinner = 77777
					} else { // players were signed in 
						if (pointWinner == 'red') {
							currentMatch.data.MatchData.MatchWinner = currentMatch.data.Red1PlayerID;
						} else {
							currentMatch.data.MatchData.MatchWinner = currentMatch.data.Blue1PlayerID;
						}						
					}
				
				} else { // for doubles matches, store 88888 for red, 99999 for blue
					if (pointWinner == 'red') {
						currentMatch.data.MatchData.MatchWinner = 88888;
					} else {
						currentMatch.data.MatchData.MatchWinner = 99999;
					}				
				}
				
				// tell the score, whether or not to switch serve, whether or not to switch sides, and maybe a joke
				tellSpeechAndSave(speechText, currentMatch, response);						
				return; // *********************************** exit the loadMatch function **********************************
									
			} else { // the game was won, but the match continues with a new game
				updateGameXScoresParam(currentMatch); // update Game1Score, Game2Score, Game3Score, Game4Score or Game5Score		
				currentMatch.data.MatchData.Game++;	// increment to game being played next	
				speechText += '<break time=\"0.8s\" />Starting the ';
				speechText += currentMatch.data.MatchData.Game;
				if (currentMatch.data.MatchData.Game == 2) {
					speechText += 'nd game';	
				} else if (currentMatch.data.MatchData.Game == 3) {
					speechText += 'rd game';	
				} else if (currentMatch.data.MatchData.Game == 4) {
					speechText += 'th game';	
				} else if (currentMatch.data.MatchData.Game == 5) {
					speechText += 'th game';	
				};
				startNewGame(currentMatch, response);							
				return; // *********************************** exit the loadMatch function **********************************						
			};				
		
		});		
																											
	};			
};

function updateGameXScoresParam(currentMatch) {
	console.log('entering updateGameXScoresParam function');		
	if (currentMatch.data.MatchData.RedTeamGameScore > currentMatch.data.MatchData.BlueTeamGameScore) {
		var gameLeaderScore = currentMatch.data.MatchData.RedTeamGameScore.toString();
		var otherTeamScore = currentMatch.data.MatchData.BlueTeamGameScore.toString();
		if (currentMatch.data.MatchType == 'singles') {
			var gameLeader = ', ' + currentMatch.data.MatchData.PlayerName.Red1;
		} else {
			var gameLeader = ', Red-Team';
		}			
	} else if (currentMatch.data.MatchData.RedTeamGameScore == currentMatch.data.MatchData.BlueTeamGameScore) {
		var gameLeaderScore = currentMatch.data.MatchData.RedTeamGameScore.toString();
		var otherTeamScore = currentMatch.data.MatchData.BlueTeamGameScore.toString();
		var gameLeader = '';
	} else if (currentMatch.data.MatchData.RedTeamGameScore < currentMatch.data.MatchData.BlueTeamGameScore) {
		var gameLeaderScore = currentMatch.data.MatchData.BlueTeamGameScore.toString();
		var otherTeamScore = currentMatch.data.MatchData.RedTeamGameScore.toString();
		if (currentMatch.data.MatchType == 'singles') {
			var gameLeader = ', ' + currentMatch.data.MatchData.PlayerName.Blue1;
		} else {
			var gameLeader = ', Blue-Team';
		}			
	};
	var formattedGameScore = gameLeaderScore + ' ' + otherTeamScore + gameLeader;
	console.log('formattedGameScore = ' + formattedGameScore);
	
	if (currentMatch.data.MatchData.Game == 1) {
		currentMatch.data.MatchData.Game1Score = formattedGameScore;
		console.log('Game1Score = ' + currentMatch.data.MatchData.Game1Score);
	} else if (currentMatch.data.MatchData.Game == 2) {
		currentMatch.data.MatchData.Game2Score = formattedGameScore;
		console.log('Game2Score = ' + currentMatch.data.MatchData.Game2Score);
	} else if (currentMatch.data.MatchData.Game == 3) {
		currentMatch.data.MatchData.Game3Score = formattedGameScore;
		console.log('Game3Score = ' + currentMatch.data.MatchData.Game3Score);
	} else if (currentMatch.data.MatchData.Game == 4) {
		currentMatch.data.MatchData.Game4Score = formattedGameScore;
		console.log('Game4Score = ' + currentMatch.data.MatchData.Game4Score);
	} else if (currentMatch.data.MatchData.Game == 5) {
		currentMatch.data.MatchData.Game5Score = formattedGameScore;
		console.log('Game5Score = ' + currentMatch.data.MatchData.Game5Score);
	};	
};			

function startNewGame(currentMatch, response) {
	console.log('entering startNewGame function');
	var priorServer = currentMatch.data.MatchData.WhosServe;
	if (priorServer == 'red') {
		var currentServer = 'blue';		
	} else {
		var currentServer = 'red';
	};		
	currentMatch.data.MatchData.WhosServe = currentServer;
		
	if (currentMatch.data.MatchData.Game == 1) {
		var rawScores = currentMatch.data.MatchData.Game1Score.split(" ");				
	} else if (currentMatch.data.MatchData.Game == 2) {
		var rawScores = currentMatch.data.MatchData.Game2Score.split(" ");
	} else if (currentMatch.data.MatchData.Game == 3) {
		var rawScores = currentMatch.data.MatchData.Game3Score.split(" ");
	} else if (currentMatch.data.MatchData.Game == 4) {
		var rawScores = currentMatch.data.MatchData.Game4Score.split(" ");
	} else if (currentMatch.data.MatchData.Game == 5) {
		var rawScores = currentMatch.data.MatchData.Game5Score.split(" ");
	};
	
	// announce the score if match settings specify it
	if (currentMatch.data.MatchData.AnnounceScore == true) {
		speechText += '<break time=\"0.3s\" />'
		var gameScoreToSay = rawScores[0] + ' to ' + rawScores[1] + ', ';
		if (rawScores[2]) { // if it isn't a tie (the leader's name or blue/red exists in the GameXScore) 
			if (currentMatch.data.MatchData.ExperiencedUserMode == false) { // e.g. 'blue team leads the match, 5 to 4'
				speechText += rawScores[2] + ' ' + rawScores[3]+ ' <phoneme alphabet="ipa" ph="l.i%.ds">leads</phoneme> the match, ' + rawScores[0] + ' to ' + rawScores[1];
			} else { // e.g. '5 to 4 Blue'
				speechText += rawScores[0] + ' to ' + rawScores[1] + rawScores[2];
			};
		} else if ( rawScores[0] != '0' && rawScores[1] != '0' ) { // don't say it is tied if the score is 0-0
			if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
				speechText += 'The set is tied, ' + rawScores[0] + ' to ' + rawScores[1];
			} else { // e.g. '3 3'
				speechText += rawScores[0] + ' to ' + rawScores[1];
			};
		};		
	};
		
	// announce the serve if match settings specify it
	if (currentMatch.data.MatchData.AnnounceServe == true) {
		if (currentMatch.data.MatchType == 'singles') { // If this is a singles match, serve goes to the next team
			if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
				speechText += '<break time=\"0.4s\" />It is ';
			};
			var serverName = getServerName(currentMatch);			
			speechText += serverName +  '\'s serve.';
			
		// If this is a doubles match, figure out who is serving next	
		} else if (currentMatch.data.MatchType == 'doubles') {
			if (currentMatch.data.MatchData.TiebreakFirstToServe != "TBDServer") { // a tiebreak was just played previously, so
				// whichever team serves the first point of the tiebreak, the opponent’s side serves the first game of the new set.		
				var priorDoublesServerIndex = currentMatch.data.MatchData.DoublesServeSequence.indexOf(currentMatch.data.MatchData.TiebreakFirstToServe);
				currentMatch.data.MatchData.TiebreakFirstToServe = "TBDServer" // reset the flag
			} else {
				var priorDoublesServerIndex = currentMatch.data.MatchData.DoublesServeSequence.indexOf(currentMatch.data.MatchData.DoublesServer);
			};			
			var nextDoublesServer = priorDoublesServerIndex+1;
			if (priorDoublesServerIndex < 3) {
				currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[nextDoublesServer];
			} else {
				currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[0];
			};
			// override currentServer to be based on which callsign is serving, because if tiebreaker proceeded game, serve rotation could be different
			if (currentMatch.data.MatchData.DoublesServer == 'alpha' || currentMatch.data.MatchData.DoublesServer == 'bravo'  ) {
				currentMatch.data.MatchData.WhosServe = 'red';			
			} else {
				currentMatch.data.MatchData.WhosServe = 'blue';
			};
			if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
				currentServer = currentMatch.data.MatchData.WhosServe;
				speechText += '<break time=\"0.4s\" />It is ';
				speechText += currentMatch.data.MatchData.DoublesServer;
				speechText += '\'s serve on the ';
				speechText += currentServer;
				speechText += ' team.';
			} else {
				speechText += currentMatch.data.MatchData.DoublesServer;
				speechText += '\'s serve.';			
			};
		};
	};			
	
	// switch sides after every game if match settings specify it
	if (currentMatch.data.MatchData.SwitchSides == true && (currentMatch.data.MatchData.RedTeamTotalGamesWon + currentMatch.data.MatchData.BlueTeamTotalGamesWon != 0) ) {
		if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
			speechText += '<break time=\"0.5s\" />Time to switch sides.';
		} else {
			speechText += '<break time=\"0.5s\" />Switch sides.';
		};
	};	
	
	
	function isOdd(num) {
		return num % 2;
	};	

	// reset the game scores to 0 for the new game
	currentMatch.data.MatchData.RedTeamGameScore = 0;	
	currentMatch.data.MatchData.BlueTeamGameScore = 0;
	
	tellSpeechAndSave(speechText, currentMatch, response);
};

function constructScoreOutput(currentMatch, currentServer) {
	console.log('entering constructScoreOutput function');
	var speechOutput = ' ';
	if (currentServer == 'red') { 
		var scoreOutput = currentMatch.data.MatchData.RedTeamGameScore;
		scoreOutput += ' to ';
		scoreOutput += currentMatch.data.MatchData.BlueTeamGameScore;
		speechOutput += scoreOutput;
		console.log('speechOutput = ' + speechOutput);
	} else {
		var scoreOutput = currentMatch.data.MatchData.BlueTeamGameScore;
		scoreOutput += ' to ';
		scoreOutput += currentMatch.data.MatchData.RedTeamGameScore;
		speechOutput += scoreOutput;
		console.log('speechOutput = ' + speechOutput);
	};
	return speechOutput;
};

function setColor(colorIn) {
	console.log('entering setColor function');
	
	if (colorIn == 'blue serve' ||
		colorIn == 'blue team serve' || 				
		colorIn == "blue team's serve" ||
		colorIn == 'blue team service' ||
		colorIn == "blue team's service" ||
		colorIn == 'team blue serve' ||
		colorIn == "team blue's serve" || 
		colorIn == 'team blue service' ||
		colorIn == "team blue's service" ) { 
		
			var colorOut = 'blue'; 
			
	} else if (		
		colorIn == 'red serve' ||
		colorIn == 'red team serve' ||				
	    colorIn == "red team's serve" ||
		colorIn == 'red team service' ||
		colorIn == "red team's service" ||
		colorIn == 'team red serve' || 
		colorIn == "team red's serve" ||
		colorIn == 'team red service' || 
		colorIn == "team red's service" ) {
			
			var colorOut = 'red';	
	};	

	return colorOut;
};

function buildArrayOfCurrentPlayers(currentMatch) {
	console.log('entering buildArrayOfCurrentPlayers function');
	var currentPlayers = [];
	if (currentMatch.data.Red1PlayerID !== 0) {
		currentPlayers.push(currentMatch.data.Red1PlayerID);
	}
	if (currentMatch.data.Blue1PlayerID !== 0) {
		currentPlayers.push(currentMatch.data.Blue1PlayerID);
	}	
	if (currentMatch.data.Red2PlayerID !== 0) {
		currentPlayers.push(currentMatch.data.Red2PlayerID);
	}	
	if (currentMatch.data.Blue2PlayerID !== 0) {
		currentPlayers.push(currentMatch.data.Blue2PlayerID);
	}	
	console.log('currentPlayers = ' + JSON.stringify(currentPlayers));
	return currentPlayers;
};
														
function getMatchElapsedTime(currentMatch, speechOrText) {
	console.log('entering getMatchElapsedTime function');	
	
	// time difference in ms
	var timeDiff = currentMatch.data.MatchData.ScoreLastUpdated - currentMatch.data.MatchData.TimeOfFirstPoint;
	console.log('timeDiff = ' + timeDiff);

	// strip the ms
	timeDiff /= 1000;

	// remove seconds from the date
	timeDiff = Math.floor(timeDiff / 60);

	// get minutes
	var minutes = Math.round(timeDiff % 60);
	console.log('minutes = ' + minutes);

	// remove minutes from the date
	timeDiff = Math.floor(timeDiff / 60);

	// get hours
	var hours = Math.round(timeDiff % 24);
	console.log('hours = ' + hours);	
	
	var elapsedTimeString = '';
	if (hours > 0) {
		if (speechOrText == 'text') {
			elapsedTimeString = hours + ' hr';
		} else { // speechOrText = 'speech'
			elapsedTimeString = hours + ' hour';
		};	
		if (hours > 1) {
			elapsedTimeString += 's and ';
		} else {
			elapsedTimeString += ' ';
		}			
	};
	
	if (speechOrText == 'text') {
		elapsedTimeString += minutes + ' min';
	} else { // speechOrText = 'speech'
		elapsedTimeString += minutes + ' minute'
		if (minutes > 1) {
			elapsedTimeString += 's ';
		};		
	};
		
	var matchElapsedTime = {};	
	matchElapsedTime.hours = hours;
	matchElapsedTime.minutes = minutes;
	matchElapsedTime.elapsedTimeString = elapsedTimeString;

	return matchElapsedTime;	
};

function setTeamSummaryStats(rawStats, teamToReport, callback) {
	console.log('entering setTeamSummaryStats function');
	console.log('rawStats input to setTeamSummaryStats = ' + JSON.stringify(rawStats));
	
	var stats = {};
	
	var TotalGamesPlayed = rawStats.RedTeamTotalGamesWon + rawStats.BlueTeamTotalGamesWon;
	var TotalPointsPlayed = rawStats.RedTeamTotalPointsWon + rawStats.BlueTeamTotalPointsWon;

	stats.GamePoints = rawStats.GamePoints;	
	
	if (teamToReport == 'red') {
		
		stats.PercentGamesWon = ((rawStats.RedTeamTotalGamesWon / TotalGamesPlayed) * 100).toFixed(0);		
		stats.PercentPointsWon = ((rawStats.RedTeamTotalPointsWon / TotalPointsPlayed) * 100).toFixed(0);		
		stats.PercentPointsWonOnServe = ((rawStats.RedPointsWonOnServe / rawStats.RedPointsServed) * 100).toFixed(0);		
		
		stats.PointsServed = rawStats.RedPointsServed;
		stats.PointStreak = rawStats.MaxRedPointStreak;		
		
	} else if (teamToReport == 'blue') { // teamToReport = blue
	
		stats.PercentGamesWon = ((rawStats.BlueTeamTotalGamesWon / TotalGamesPlayed) * 100).toFixed(0);
		stats.PercentPointsWon = ((rawStats.BlueTeamTotalPointsWon / TotalPointsPlayed) * 100).toFixed(0);	
		stats.PercentPointsWonOnServe = ((rawStats.BluePointsWonOnServe / rawStats.BluePointsServed) * 100).toFixed(0);
		
		stats.PointsServed = rawStats.BluePointsServed;
		stats.PointStreak = rawStats.MaxBluePointStreak;

	} else if (teamToReport == 'singlesOrDoublesHistory') {
		
		stats.NumberOfMatches = rawStats.NumberOfMatches;
		
		stats.PercentGamesWon = ((rawStats.SinglesOrDoublesTotalGamesWon / rawStats.TotalGamesPlayed) * 100).toFixed(0);		
		stats.PercentPointsWon = ((rawStats.SinglesOrDoublesTotalPointsWon / rawStats.TotalPointsPlayed) * 100).toFixed(0);
		stats.PercentPointsWonOnServe = ((rawStats.SinglesOrDoublesPointsWonOnServe / rawStats.SinglesOrDoublesPointsServed) * 100).toFixed(0);
		
		stats.PointsServed = rawStats.SinglesOrDoublesPointsServed;
		stats.PointStreak = rawStats.MaxSinglesOrDoublesPointStreak;
		if ( !(isNaN(rawStats.MaxSinglesOrDoublesPointStreak)) && rawStats.MaxSinglesOrDoublesPointStreak != undefined ){
			stats.PointStreak = rawStats.MaxSinglesOrDoublesPointStreak.toFixed(0);
		};
					
	};
	
	callback(stats);
};

function createCurrentMatchSpeechSummaryForTeam (currentMatch, teamToReport, callback) {
	console.log('entering createCurrentMatchSpeechSummaryForTeam function');
	
	var rawStats = currentMatch.data.MatchData;	
	
	setTeamSummaryStats(rawStats, teamToReport, function (currentMatchStats) {	// set whether we are reporting for red or blue
		console.log('currentMatchStats = ' + JSON.stringify(currentMatchStats) );	
		
		// Open the summary with 'Red team player,' or 'Blue team player,'
		
		if (currentMatch.data.MatchType == 'singles') {
			var name = nameToSay(teamToReport, currentMatch);
			speechText = '<break time=\"0.3s\" />' + name + ', ';
		} else {
			speechText = '<break time=\"0.3s\" />' + teamToReport + ' team, ';		
		}

		// percent of games won
		if ( !(isNaN(currentMatchStats.PercentGamesWon)) ) {
			speechText += 'you won ';
			speechText += currentMatchStats.PercentGamesWon;				
			speechText += ' percent of the games, <break time=\"0.2s\" />';
		} else {
			speechText += ' you haven\'t won any games yet. <break time=\"0.4s\" />';
		}

		// percent of points won
		speechText += 'You have won ';
		speechText += currentMatchStats.PercentPointsWon;
		speechText += ' percent of the overall points.';	

		
		if (currentMatchStats.PointsServed != 0) {
			if (currentMatchStats.GamesServed != 0) {
				
				// percent of games won serving
				speechText += '<break time=\"0.3s\" />. You won ';
				speechText += currentMatchStats.PercentPointsWonOnServe;
				speechText += ' percent of the points when you were serving.';

			};

		} else {
			speechText += '<break time=\"0.3s\" /> You haven\'t yet served in this match.';
		};
	
		// point streak
		speechText += '. <break time=\"0.3s\" />Your longest point streak of the match was ';
		speechText += currentMatchStats.PointStreak;
		speechText += ' points.';
		
		console.log('speechText = ' + speechText );		
		callback(speechText);	
	});	


};

function buildHistorySpeech(session, currentMatch, rawHistStats, callback) {
	console.log('entering buildHistorySpeech');
	console.log('rawHistStats = ' + JSON.stringify(rawHistStats) );
	var higherOrLower;
	var rawStats = currentMatch.data.MatchData;	
	
	setTeamSummaryStats(rawStats, session.attributes.summaryForTeam, function (currentMatchStats) {	// get red or blue team current match stats 	
		console.log('currentMatchStats = ' + JSON.stringify(currentMatchStats) );
		
		setTeamSummaryStats(rawHistStats, 'singlesOrDoublesHistory', function (histStats) { // get singles player historical stats
			console.log('histStats = ' + JSON.stringify(histStats) );
		
			console.log('histStats = ' + JSON.stringify(histStats) );
			var histSpeechText = '';
			
			if (histStats.NumberOfMatches <= 1) {
					histSpeechText += '<break time=\"0.3s\" /> This was the only match that I have record of for you. ';
					histSpeechText += 'To hear how your play compares to your historical averages, sign in before a match. ';
					
					histSpeechText += '<break time=\"0.5s\" /> You can say, continue with ' + session.attributes.opposingTeam + ' team, or, what are my other options.';
					console.log('speechSummaryForTeam = ' + JSON.stringify(histSpeechText) );

			} else {
				
				histSpeechText += '<break time=\"0.3s\" /> Let\'s compare these numbers to your historical averages.';
				
				if (!(isNaN(histStats.PercentPointsWonOnServe)) ) {
					
					// percent of points won serving	
					console.log('histStats.PercentPointsWonOnServe = ' + histStats.PercentPointsWonOnServe);
					console.log('currentMatchStats.PercentPointsWonOnServe = ' + currentMatchStats.PercentPointsWonOnServe);
					
					var diffPercentPointsWonOnServe = currentMatchStats.PercentPointsWonOnServe - histStats.PercentPointsWonOnServe;
					if (diffPercentPointsWonOnServe >= 0 ) {
						higherOrLower = 'higher';
					} else {
						higherOrLower = 'lower';
						diffPercentPointsWonOnServe = Math.abs(diffPercentPointsWonOnServe);
					};
				
					histSpeechText += '<break time=\"0.3s\" /> Your points won on serve statistic was ';
					histSpeechText += diffPercentPointsWonOnServe;
					histSpeechText += ' percent ' + higherOrLower + ' than average.';
				}
		
				
				histSpeechText += '<break time=\"0.5s\" /> You can say, continue with ' + session.attributes.opposingTeam + ' team, or, what are my other options.';
				console.log('histSpeechText = ' + histSpeechText );	
				
			};
			
			callback(histSpeechText);
		});	
	});		
};

function createSpeechSummaryForMatch (currentMatch) {
	console.log('entering createSpeechSummaryForMatch function');
	
	var matchTimeSpeech = getMatchElapsedTime(currentMatch, 'speech');						
	var matchScoreSpeech = formatMatchScore(currentMatch, 'speech'); // e.g. '1-0, Blue Team' indicating blue team leads 1 set to zero

	speechText = ''; //reset
	
	// winner of the match as applicable
	if (currentMatch.data.MatchData.MatchWinner != 0) {
		speechText += '<break time=\"0.3s\" /> ';		
		if (currentMatch.data.MatchType == 'singles') { // a singles match was won
			speechText += nameToSay(currentMatch.data.MatchData.MatchWinner, currentMatch);
		} else { // a doubles match was won
			if (currentMatch.data.MatchData.MatchWinner == 88888) { // 88888 is code for red team wins
				speechText += currentMatch.data.MatchData.PlayerName.Red1 + ' and ' + currentMatch.data.MatchData.PlayerName.Red2	
			} else if (currentMatch.data.MatchData.MatchWinner == 99999) {
				speechText += currentMatch.data.MatchData.PlayerName.Blue1 + ' and ' + currentMatch.data.MatchData.PlayerName.Blue2
			}	
		}		
		speechText += ' won the match. <break time=\"0.3s\" />';
		var matchIsOver = true;
	};

	// score of the match
	if (currentMatch.data.MatchData.RedTeamTotalGamesWon == 0 && currentMatch.data.MatchData.BlueTeamTotalGamesWon == 0) {
		speechText += 'neither team has won a game yet'; 
	} else if ( (currentMatch.data.MatchData.RedTeamTotalGamesWon == 1 && currentMatch.data.MatchData.BlueTeamTotalGamesWon == 1) ||
				(currentMatch.data.MatchData.RedTeamTotalGamesWon == 2 && currentMatch.data.MatchData.BlueTeamTotalGamesWon == 2) ) {

		speechText += 'the match is tied at ' + currentMatch.data.MatchData.RedTeamTotalGamesWon + ' game';
		if (currentMatch.data.MatchData.RedTeamTotalGamesWon == 2) {
			speechText += 's each.';
		} else {
			speechText += ' each.';
		}	
		
	} else if (!matchIsOver) {
		speechText += 'The score of the match is: ';
		speechText += '<break time=\"0.1s\" />';
		speechText += matchScoreSpeech;				
	};			

	// score of each game as applicable
	if (currentMatch.data.MatchData.Game >= 1) { // say the first Game score
		var formattedGameScore = formatGameScore(1, true, 'speech', currentMatch);
		if (currentMatch.data.MatchData.GamesPerMatch == 1) {
			speechText += '<break time=\"0.3s\" />Game score: ' + formattedGameScore;
		} else {
			speechText += '<break time=\"0.3s\" />First game: ' + formattedGameScore;
		}						
	};
	if (currentMatch.data.MatchData.Game >= 2 && currentMatch.data.MatchData.GamesPerMatch != 1) { // if 2nd game is in progress or finished, say the 2nd game score
		var formattedGameScore = formatGameScore(2, true, 'speech', currentMatch);	
		speechText += '<break time=\"0.3s\" />Second game: ' + formattedGameScore;
	};
	if (currentMatch.data.MatchData.Game >= 3) { // if 3rd game is in progress or finished, say the 3rd game score
		var formattedGameScore = formatGameScore(3, true, 'speech', currentMatch);	
		speechText += '<break time=\"0.3s\" />Third game: ' + formattedGameScore;
	};
	if (currentMatch.data.MatchData.Game >= 4) { // if 4th game is in progress or finished, say the 4th game score
		var formattedGameScore = formatGameScore(4, true, 'speech', currentMatch);	
		speechText += '<break time=\"0.3s\" />Fourth game: ' + formattedGameScore;
	};
	if (currentMatch.data.MatchData.Game >= 5) { // if 5th set is in progress or finished, say the 5th game score
		var formattedGameScore = formatGameScore(5, true, 'speech', currentMatch);	
		speechText += '<break time=\"0.3s\" />Fifth game: ' + formattedGameScore;
	};	
	
	// elapsed time of the match
	speechText += '<break time=\"0.2s\" />. You have played for ' + matchTimeSpeech.elapsedTimeString;	
		
	var totalGamesPlayed = currentMatch.data.MatchData.RedTeamTotalGamesWon + currentMatch.data.MatchData.BlueTeamTotalGamesWon;
	var totalPointsPlayed = currentMatch.data.MatchData.RedTeamTotalPointsWon + currentMatch.data.MatchData.BlueTeamTotalPointsWon;
	
	// total games played
	speechText += '<break time=\"0.3s\" />. In that time, you played a total of ';
	speechText += totalGamesPlayed;			
	speechText += ' game';
	if (totalGamesPlayed > 1 || totalGamesPlayed < 1) {
		speechText += 's';
	};
	
	// total points played
	speechText += ', and ' + totalPointsPlayed;
	speechText += ' individual point';
	if (totalPointsPlayed > 1 || totalPointsPlayed < 1) {
		speechText += 's';
	};				
	
	speechText += '<break time=\"0.5s\" /> If you\'d like to hear the stats for a specific team, say, continue with red team.';
	speechText += ' Or say, continue with blue team.';
				
	console.log('matchSummaryContent = ' + JSON.stringify(speechText) );
	
	return speechText;
};

function createSpeechSummaryForTeam(session, response) {
	console.log('entering createSpeechSummaryForTeam');	
	console.log('session.attributes.summaryForTeam = ' + session.attributes.summaryForTeam);	
	matchStorage.loadMatch(session, function (currentMatch) {
		if (typeof(currentMatch) == 'string') {
			matchNotFound(currentMatch, response);
			return;
		};	
		
		// set phoneKey(s) for whether red team summary or blue team summary, and singles or doubles
		if (session.attributes.summaryForTeam == 'red') {
			session.attributes.opposingTeam = 'blue';
			if (currentMatch.data.MatchType == 'singles') {
				session.attributes.phoneKey = currentMatch.data.Red1PlayerID;
			} else { // for doubles match
				session.attributes.player1PhoneKey = currentMatch.data.Red1PlayerID;
				session.attributes.player2PhoneKey = currentMatch.data.Red2PlayerID;
			};				
		} else { // summary was requested for blue
			session.attributes.opposingTeam = 'red';
			if (currentMatch.data.MatchType == 'singles') {
				session.attributes.phoneKey = currentMatch.data.Blue1PlayerID;
			} else { // for doubles match
				session.attributes.player1PhoneKey = currentMatch.data.Blue1PlayerID;
				session.attributes.player2PhoneKey = currentMatch.data.Blue2PlayerID;
			};			
		};	
		
		// build speech for both current match and historical stats					
		createCurrentMatchSpeechSummaryForTeam(currentMatch, session.attributes.summaryForTeam, function (speechText) {		
			
			if (currentMatch.data.MatchType == 'singles') {	
				console.log('into singles part');
				// pull stats from all matches in which this player has played
				console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey)
				singlesPlayerHistory.getSinglesPlayerHistory(session, function (rawHistStats) {
					
					buildHistorySpeech(session, currentMatch, rawHistStats, function (histSpeechToAdd) {					
						console.log('histSpeechToAdd = ' + histSpeechToAdd);				
						speechText += histSpeechToAdd;
						console.log('speechText final after current match and histSpeechToAdd = ' + speechText);				
						var repromptTextToSay = 'Say, continue with ' + session.attributes.summaryForTeam + ' team, or all done.';
						askSpeech(speechText, repromptTextToSay, response);	
					});	
				});			
			} else {
				// pull stats from all matches in which this doubles team has played together
				console.log('session.attributes.player1PhoneKey = ' + session.attributes.player1PhoneKey);
				console.log('session.attributes.player2PhoneKey = ' + session.attributes.player2PhoneKey);
				doublesTeamHistory.getDoublesTeamHistory(session, function (rawHistStats) {
					
					buildHistorySpeech(session, currentMatch, rawHistStats, function (histSpeechToAdd) {
						speechText += histSpeechToAdd;					
						var repromptTextToSay = 'Say, continue with ' + session.attributes.opposingTeam + ' team, or all done.';
						askSpeech(speechText, repromptTextToSay, response);	
					});	
				});					
			};
		});	
	});		
};

	
var registerIntentHandlers = function (intentHandlers, skillContext) {
	
	intentHandlers.LetsPlayIntent = function (intent, session, response) {
		console.log('entering LetsPlayIntent');
		// Handles intent to start a match with no input from user, and start a singles match immediately
		matchStorage.newMatch(session, function (currentMatch) {								
			currentMatch.data.MatchType = 'singles';
			currentMatch.data.MatchData.PlayerName.Red1	= 'team-red';
			currentMatch.data.MatchData.PlayerName.Blue1 = 'team-blue';	
			var speechText = 'Pick one of you to be on the red team, and the other to be on the blue team. <break time=\"0.2s\" /> I\'m going to call you team red, and team blue.'			
			// have players rally for the serve and then say who will be serving first
			speechText += '<break time=\"0.3s\" /> Rally for the serve, and then tell me who wins. For example say, use ping pong and ';
			speechText += 'first to serve is ' + currentMatch.data.MatchData.PlayerName.Blue1 + '.';
			currentMatch.data.MatchData.RallyForTheServe = true;
			tellSpeechAndSave(speechText, currentMatch, response);			
		});			
    };	

	intentHandlers.SetSassMeterIntent = function (intent, session, response) {
        console.log('entering SetSassMeterIntent');
		
		if (intent.slots.SassMeter && intent.slots.SassMeter.value) { // if SassMeter level was provided
			if (intent.slots.SassMeter.value < 0 || intent.slots.SassMeter.value > 10) { // illegal values provided
				var textToSay = 'My sass meter can be set between zero and ten. Please try again.'; 
				var repromptTextToSay = 'Please try again.';
				askSpeech(textToSay, repromptTextToSay, response);				
			} else { // set sass meter			
				matchStorage.loadMatch(session, function (currentMatch) {
					if (typeof(currentMatch) == 'string') {
						matchNotFound(currentMatch, response);
						return;
					};					
					currentMatch.data.MatchData.SassMeter = intent.slots.SassMeter.value;
					var textToSay = 'Sass meter set to ' + currentMatch.data.MatchData.SassMeter;
					tellSpeechAndSave(textToSay, currentMatch, response)
				});				
			}
		}
	};	
	
    intentHandlers.NewMatchDialogIntent = function (intent, session, response) {
		// Handles intent to add a player via an interactive dialog to get the player's 
		// four digit player I.D. and which team to assign them to 
		console.log('entering NewMatchDialogIntent');
        if (intent.slots.SinglesOrDoubles && intent.slots.SinglesOrDoubles.value) { // if match type was provided
            handleMatchTypeProvidedDialogRequest(intent, session, response);
        } else if (intent.slots.TeamServing && intent.slots.TeamServing.value) { // if team to serve was provided
            handleFirstToServeProvidedDialogRequest(intent, session, response);
        } else { // user just said 'start new match' without any specification
            handleNoSlotDialogRequest(intent, session, response);
        };
			
		/**
		 * Handles the dialog step where the user provides the match type of singles or doubles
		 */
		function handleMatchTypeProvidedDialogRequest(intent, session, response) {	
			console.log('entering handleMatchTypeProvidedDialogRequest');
			// set match type in session and start adding players with fulfillNewMatch
			session.attributes.singlesOrDoubles = intent.slots.SinglesOrDoubles.value;
			fulfillNewMatch(session, response);

		};		

		/**
		 * Handles the dialog step where the user provides no slots
		 */
		function handleNoSlotDialogRequest(intent, session, response) {
			console.log('entering handleNoSlotDialogRequest');
			// if user doesn't specify singles or doubles, assume singles
			session.attributes.singlesOrDoubles = 'singles';
			fulfillNewMatch(session, response);			
		};	
	};
		
	intentHandlers.TeamRedWonRallyIntent = function (intent, session, response) {
        console.log('entering TeamRedWonRallyIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			if (currentMatch.data.MatchData.RallyForTheServe == true) {	
				kickoffMatch.doIt('team-red', currentMatch, session, response); 
			} else {
				var speechText = 'I thought I heard you tell me who is first to serve. That only happens when starting a match. Would you like to start a match, or hear other options?';
				var repromptText = "Would you like to start a match or hear other options?";		
				askSpeech(speechText, repromptText, response);				
			}								
		});
	};

	intentHandlers.TeamBlueWonRallyIntent = function (intent, session, response) {
        console.log('entering TeamBlueWonRallyIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			if (currentMatch.data.MatchData.RallyForTheServe == true) {	
				kickoffMatch.doIt('team-blue', currentMatch, session, response);
			} else {
				var speechText = 'I thought I heard you tell me who is first to serve. That only happens when starting a match. Would you like to start a match, or hear other options?';
				var repromptText = "Would you like to start a match or hear other options?";		
				askSpeech(speechText, repromptText, response);				
			}								
		});
	};	
	
	intentHandlers.WhoWonRallyIntent = function (intent, session, response) {
        console.log('entering WhoWonRallyIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};
			console.log('currentMatch.data.MatchData.RallyForTheServe = ' + currentMatch.data.MatchData.RallyForTheServe);
			if (currentMatch.data.MatchData.RallyForTheServe == true) {	
				console.log('intent.slots.PlayerName.value = ' + intent.slots.PlayerName.value)
				console.log('currentMatch.data.MatchData.PlayerName.Red1 = ' + currentMatch.data.MatchData.PlayerName.Red1)
				console.log('currentMatch.data.MatchData.PlayerName.Blue1 = ' + currentMatch.data.MatchData.PlayerName.Blue1)
				
				var rallyWinner = intent.slots.PlayerName.value.toLowerCase();
				console.log('rallyWinner = ' + rallyWinner)
				
				if (rallyWinner != currentMatch.data.MatchData.PlayerName.Red1 && 
					rallyWinner != currentMatch.data.MatchData.PlayerName.Blue1  ) {
						currentMatch.data.MatchData.RallyForTheServe = true;
						var speechText = 'I didn\'t hear your name correctly.<break time=\"0.3s\" /> Let\'s try something else. '; 
						speechText += 'Tell me which team won the rally.<break time=\"0.3s\" /> Say for example, red won the rally.';
						var repromptText = 	'Say red won the rally, or, blue won the rally.' + currentMatch.data.MatchData.PlayerName.Blue1 + '.';
						askSpeech(speechText, repromptText, response);	
						
				} else { // the name provided matches one of the players in this match
					kickoffMatch.doIt(rallyWinner, currentMatch, session, response);								
				}	
				
			} else {
				var speechText = 'I thought I heard you tell me who is first to serve. That only happens when starting a match. Would you like to start a match, or hear other options?';
				var repromptText = "Would you like to start a match or hear other options?";		
				askSpeech(speechText, repromptText, response);				
			}
		});
	};	

	intentHandlers.RedOrBlueWonRallyIntent = function (intent, session, response) {
        console.log('entering RedOrBlueWonRallyIntent');
		// this intent handles the backup plan where a player's first name isn't recognized and instead they provide the team they are on
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			if (currentMatch.data.MatchData.RallyForTheServe == true) {
				if (intent.slots.Color.value == 'red') {
					kickoffMatch.doIt(currentMatch.data.MatchData.PlayerName.Red1, currentMatch, session, response);
				} else if (intent.slots.Color.value == 'blue') {
					kickoffMatch.doIt(currentMatch.data.MatchData.PlayerName.Blue1, currentMatch, session, response);
				} else {
					var speechText = 'I didn\'t quite get that. To specify who serves first, say, red won the rally, or, blue won the rally.';
					var repromptText = "Who won the rally?";		
					askSpeech(speechText, repromptText, response)					
				}

			} else {
				var speechText = 'I thought I heard you tell me who is first to serve. That only happens when starting a match. Would you like to start a match, or hear other options?';
				var repromptText = "Would you like to start a match or hear other options?";		
				askSpeech(speechText, repromptText, response);				
			}								
		});
	};
	
    intentHandlers.SkipSignInIntent = function (intent, session, response) {
        console.log('entering SkipSignInIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};			
			if (currentMatch.data.MatchType == 'doubles') {
				// assign doubles partner call signs according to who will serve first on each team
				if (currentMatch.data.MatchData.WhosServe == 'red') {
					currentMatch.data.MatchData.FirstRedToServe = 'alpha';
					currentMatch.data.MatchData.DoublesServeSequence.push('alpha', 'yankee', 'bravo', 'zulu');
				} else {
					currentMatch.data.MatchData.FirstBlueToServe = 'yankee';
					currentMatch.data.MatchData.DoublesServeSequence.push('yankee', 'alpha', 'zulu', 'bravo');
				};
				currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[0];
				
				// set player names to be callsigns
				currentMatch.data.MatchData.PlayerName.Red1 = 'alpha';
				currentMatch.data.MatchData.PlayerName.Red2 = 'bravo';
				currentMatch.data.MatchData.PlayerName.Blue1 = 'yankee';
				currentMatch.data.MatchData.PlayerName.Blue2 = 'zulu';				
				
				if (currentMatch.data.MatchData.ExperiencedUserMode == false) {	
					var speechText = 'In';
					speechText += ' order to keep track of who is serving, I will assign you callsigns.';
					speechText += ' The player serving first on the ';
					speechText += 'red team will be: callsign, alpha.<break time=\"0.2s\" /> Alpha\'s partner will be: callsign bravo.'
					speechText += '<break time=\"0.4s\" />The player serving first on the blue team will be callsign yankee.';
					speechText += '<break time=\"0.2s\" />yankee\'s partner will be callsign zulu.'
					
					// set flag expecting user to invoke WhoWonRallyIntent
					currentMatch.data.MatchData.RallyForTheServe = true;
					
					// have players rally for the serve and then say who will be serving first
					speechText += ' Rally for the serve, and then tell me who wins. For example say, use ping pong and ';
					speechText += 'first to serve is ' + currentMatch.data.MatchData.PlayerName.Red1 + '.';
				
				} else {
					// have players rally for the serve and then say who will be serving first
					var speechText = ' Rally for the serve, and then tell me who wins. For example say, use ping pong and ';
					speechText += 'first to serve is ' + currentMatch.data.MatchData.PlayerName.Red1 + '.';
				};
				
				tellSpeechAndSave(speechText, currentMatch, response);
				
			} else {	
				// Handles intent to start a match with no input from user, and start a singles match immediately
				matchStorage.newMatch(session, function (currentMatch) {								
					currentMatch.data.MatchType = 'singles';
					currentMatch.data.MatchData.PlayerName.Red1	= 'team-red';
					currentMatch.data.MatchData.PlayerName.Blue1 = 'team-blue';	
					var speechText = 'Pick one of you to be on the red team, and the other to be on the blue team. <break time=\"0.2s\" /> I\'m going to call you team red, and team blue.'			
					// have players rally for the serve and then say who will be serving first
					speechText += '<break time=\"0.3s\" /> Rally for the serve, and then tell me who wins. For example say, use ping pong and ';
					speechText += 'first to serve is ' + currentMatch.data.MatchData.PlayerName.Blue1 + '.';
					currentMatch.data.MatchData.RallyForTheServe = true;
					tellSpeechAndSave(speechText, currentMatch, response);			
				});						
			}
        });
    };	
		
	intentHandlers.PointToPlayerIntent = function (intent, session, response) {
        console.log('entering PointToPlayerIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};
			var colorWinner = intent.slots.PointToPlayer.value;
			pointToPlayer(colorWinner, currentMatch, response);
		});
	};
	
    intentHandlers.FixGameScoreIntent = function (intent, session, response) {
        console.log('entering ChangeGameScoreIntent');
		var speechText = 'OK. What should each team\'s score in the current game be?';
			speechText += '<break time=\"0.2s\" />For example, say red score three, blue score two';
		var repromptText = "What should the score be? Say, for example, red score three, blue score two";		
		askSpeech(speechText, repromptText, response);			
    };

    intentHandlers.SpecifyGameScoreIntent = function (intent, session, response) {
        console.log('entering SpecifyGameScoreIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};	

			// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};
			
			currentMatch.data.MatchData.RedTeamGameScore = Number(intent.slots.RedScore.value);
			currentMatch.data.MatchData.BlueTeamGameScore = Number(intent.slots.BlueScore.value);
	
			updateGameXScoresParam(currentMatch);
							
			if (currentMatch.data.MatchData.Game == 1) {
				var rawScores = currentMatch.data.MatchData.Game1Score.split(" ");				
			} else if (currentMatch.data.MatchData.Game == 2) {
				var rawScores = currentMatch.data.MatchData.Game2Score.split(" ");
			} else if (currentMatch.data.MatchData.Game == 3) {
				var rawScores = currentMatch.data.MatchData.Game3Score.split(" ");
			} else if (currentMatch.data.MatchData.Game == 4) {
				var rawScores = currentMatch.data.MatchData.Game4Score.split(" ");
			} else if (currentMatch.data.MatchData.Game == 5) {
				var rawScores = currentMatch.data.MatchData.Game5Score.split(" ");				
			};

			var gameScoreToSay = rawScores[0] + ' to ' + rawScores[1] + ' ';
			if (rawScores[2]) {
				gameScoreToSay += rawScores[2];
			};
			
			var speechText = 'game score ';
				speechText += '<break time=\"0.1s\" />';
				speechText += gameScoreToSay;
			tellSpeechAndSave(speechText, currentMatch, response);
						
        });
    };				
			
    intentHandlers.RegisterPlayerDialogIntent = function (intent, session, response) {
		// Handles intent to register a player via an interactive dialog to get the player's four digit player I.D.
		console.log('entering RegisterPlayerDialogIntent');
        if (intent.slots.Phone.value) { // if four digit player I.D. was provided
			if (intent.slots.Phone.value.toString().length != 4) { 
				var textToSay = 'I\'m not sure I got that correctly, it didn\'t have 4 digits.'; 
				textToSay += '<break time=\"0.3s\" />Please say <break time=\"0.2s\" /> Register, and then a four digit player I.D. you would like to use.';
				var repromptTextToSay = 'say register and then a four digit player I.D.';
				askSpeech(textToSay, repromptTextToSay, response);
			};
			
			// set phoneKey key temporarily
			session.attributes.phoneKey = intent.slots.Phone.value;
			
			// try and load that player, if player not found, proceed. Otherwise tell user that player ID is already in use
			playerStorage.loadPlayer(session, function (newMatchPlayer) {
				if (newMatchPlayer == 'errorLoadingPlayer') {
					var speechText = 'There was a problem accessing the registered players list. Please try again.';
					var repromptTextToSay = 'Would you like to register a new player, or cancel?';				
					askSpeech(speechText, repromptTextToSay, response);
					return;
				}			
				if (newMatchPlayer == 'playerNotFound') { // confirmed that this is a new player and we can proceed with registration	

					if (session.attributes.firstNumber) { // if the user provided the number twice and they match, move forward with registration
						if (session.attributes.firstNumber == intent.slots.Phone.value) {
							session.attributes.firstNumber = null;
							session.attributes.newPlayerPhone = intent.slots.Phone.value;
							// session.attributes.newPlayerPhone now set, so now get session.attributes.newPlayerName
							var textToSay = 'Got it.<break time=\"0.2s\" /> But I don\'t want to call you <break time=\"0.1s\" /> <say-as interpret-as="digits">'+ session.attributes.newPlayerPhone + '</say-as> <break time=\"0.3s\" />What\'s your first name?'; 
							var repromptTextToSay = 'What\'s your first name?';
							// set flag to indicate player registration is active so mis-reads of stopIntent etc can be dealt with
							session.attributes.registeringPlayer = true;
							askSpeech(textToSay, repromptTextToSay, response);					
						} else {
							session.attributes.firstNumber = null;
							var textToSay = 'Hmm, sorry if I heard you wrong, but those numbers didn\t match.'; 
							textToSay += '<break time=\"0.3s\" />Let\'s try again. Say <break time=\"0.2s\" /> Register, and then a four digit player I.D. you would like to use.';
							var repromptTextToSay = '';
							askSpeech(textToSay, repromptTextToSay, response);					
						};
					} else { // this is the first time they are providing the four digit player I.D. to register, so reprompt them to do it again.
						console.log('in first time go round - intent.slots.Phone.value = ' + intent.slots.Phone.value);
						session.attributes.firstNumber = intent.slots.Phone.value;
						var textToSay = 'Please say it again to make sure I got it right.'; 
						textToSay += '<break time=\"0.2s\" />Say <break time=\"0.2s\" /> Register, and then a four digit player I.D.';
						var repromptTextToSay = 'say register and then a four digit player I.D.';
						askSpeech(textToSay, repromptTextToSay, response);
					};
				
				} else { // player ID already registered
					session.attributes.phoneKey = null;
					var speechText = 'That player I.D. has already been registered by ' + newMatchPlayer.data.Name + '. If that\'s not you, please choose a different player I.D.';
					speechText += '<break time=\"0.3s\" /> If it is, you are all set. Would you like to register a different 4 digit player I.D.<break time=\"0.3s\" /> start a match, or, hear other options?'
					var repromptTextToSay = 'Would you like to register or cancel?';				
					askSpeech(speechText, repromptTextToSay, response);				
				}
			});					

        } else { // user just said 'register player' without any specification, so reprompt them to do it with a 4 digit code
			var textToSay = 'OK. In order to register, please say register, and then a four digit player I.D. that you\'d like to use. <break time=\"0.4s\" />I recommend the last 4 digits of your phone number.'; 
			textToSay += '<break time=\"0.4s\" />For example, say register five three zero nine.<break time=\"0.3s\" /> Let me give you a second to decide.<break time=\"1s\" />';
			textToSay += "<audio src='https://s3.amazonaws.com/pingpongsongs/whistling.mp3'/>" + '<break time=\"1s\" /> OK, whenever you\'re ready.';
			var repromptTextToSay = 'Say register, and then a four digit player I.D. that you\'d like to use.';
			askSpeech(textToSay, repromptTextToSay, response);
        };				
	};
	
    intentHandlers.GetNameIntent = function (intent, session, response) {
		// Handles intent to get a player's first name 
		console.log('entering GetNameIntent');
		// session.attributes.newPlayerPhone now set, so now get session.attributes.newPlayerName
		session.attributes.newPlayerName = intent.slots.PlayerName.value;
		var textToSay = 'I heard you say ' +  intent.slots.PlayerName.value + ', is that right? If yes, please say confirmed. If not, please say it again.'; 
		var repromptTextToSay = 'If I got it right, please say confirmed. Otherwise, say your first name again.';
		askSpeech(textToSay, repromptTextToSay, response);								
	};	

    intentHandlers.ConfirmNameIntent = function (intent, session, response) {
		// Handles intent to confirm a player's first name 
		console.log('entering ConfirmNameIntent');
		// turn off registering player flag
		session.attributes.registeringPlayer = false;
		// set item key for DynamoDB lookup to number provided as candidate for new player ID registration
		session.attributes.phoneKey = session.attributes.newPlayerPhone;
 		
		playerStorage.loadPlayer(session, function (newMatchPlayer) {
			if (newMatchPlayer == 'errorLoadingPlayer') {
				var speechText = 'There was a problem accessing the registered players list. Please try again.';
				var repromptTextToSay = 'Would you like to register a new player, or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);
				return;
			}			
			if (newMatchPlayer == 'playerNotFound') { // confirmed that this is a new player and we can proceed with registration
		
				playerStorage.newPlayer(session, function (newRegisteredPlayer) {					
					var speechText = 'Thanks ' +  session.attributes.newPlayerName + '. One time registration complete. I\'ll save your match results for bragging rights later.';
						speechText += '<break time=\"0.4s\" />When you and a friend play again together, I\'ll let you know who is currently on top of the rankings.<break time=\"0.4s\" />';
						speechText += 'Now, would you like to start a match? Or you can say, what are my other options. ';	
						var repromptTextToSay = 'Would you like to start a match? Or you can say, what are my other options.';	
					console.log('session.attributes.newPlayerPhone = ' + session.attributes.newPlayerPhone);					
					newRegisteredPlayer.save(session, function () {
						askSpeech(speechText, repromptTextToSay, response);	
					});										
				});				
				
			} else { // player ID already registered
				var speechText = 'That player I.D. has already been registered by ' + newMatchPlayer.data.Name + '. If that\'s not you, please choose a different player I.D.';
				speechText += '<break time=\"0.3s\" /> If it is, you are all set. Would you like to register a different 4 digit player I.D.<break time=\"0.1s\" /> start a match, or, hear other options?'
				var repromptTextToSay = 'Would you like to register or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);				
			}
		});															
	};	
	
	intentHandlers.OneShotAddPlayerIntent = function (intent, session, response) {
		// Handles intent to add a player with a single input from the user, but 
		// will re-direct to a dialog if the player I.D. and team are not both provided 
		console.log('entering OneShotAddPlayerIntent');

		handleOneshotAddPlayerRequest(intent, session, response);
		
		/**
		 * This handles the one-shot interaction, where the user utters a phrase like:
		 * 'Add 8485'.
		 * If there is an error in a slot, this will guide the user to the dialog approach.
		 */
		function handleOneshotAddPlayerRequest(intent, session, response) {
			console.log('entering handleOneshotAddPlayerRequest');
			if (intent.slots.Phone.value) {
				session.attributes.phoneKey = intent.slots.Phone.value
			};
			
			// Determine phone
			var playerPhone = getPhoneFromIntent(intent);
			if (playerPhone.error) {
				// Didn't get the player I.D.. Move to dialog approach
				// There is a potential of a player trying to register that just says their player I.D., so try and prevent:
				// set a flag that we are expecting a player I.D. later in the session
				if (session.attributes.alreadyExplainedID == true) {
					var textToSay = 'OK, please say your four digit player I.D.';					
				} else {
					var textToSay = 'OK. Please say your four digit player I.D.<break time=\"0.3s\" /> If you don\'t haveoneyet, say register a new player.';
					session.attributes.alreadyExplainedID = true;
				} 
				var repromptTextToSay = 'What is your four digit player I.D.? If you don\'t haveoneyet, say register a new player.';
				askSpeech(textToSay, repromptTextToSay, response);
				return;

			};

			session.attributes.phoneKey = playerPhone.phone;			
			
			matchStorage.loadMatch(session, function (currentMatch) {
				if (typeof(currentMatch) == 'string') {
					matchNotFound(currentMatch, response);
					return;
				};	

				// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later
				for (var stat in currentMatch.data.MatchData) {
					if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
						currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
					};
				};					
			
				// 1st determine team to assign
				if (!intent.slots.Team.value) {
					// Didn't get the team to assign from the user						
					if (currentMatch.data.Red1PlayerID == 0) { // no player has been assigned to the red team yet, so assign this player to red
						session.attributes.team = 'red';
					} else if (currentMatch.data.Blue1PlayerID == 0) { // else if no player assigned to blue yet, assign blue to this one
						session.attributes.team = 'blue';
					}									
								
				} else {
					// set team in session and simplify the designation to either 'red' or 'blue'
					session.attributes.team = intent.slots.Team.value;
					if (intent.slots.Team.value == 'red team') { session.attributes.team = 'red' };
					if (intent.slots.Team.value == 'team red') { session.attributes.team = 'red' };
					if (intent.slots.Team.value == 'blue team') { session.attributes.team = 'blue' };
					if (intent.slots.Team.value == 'team blue') { session.attributes.team = 'blue' };																	
				}
				
				// all slots filled and corresponding session variables set, so move to final fulfillAddPlayer
				fulfillAddPlayer(session, response);				
			
			});							
		};		

		/**
		 * Gets the phone from the intent, or returns an error
		 */
		function getPhoneFromIntent(intent) {
			console.log('entering getPhoneFromIntent');
			var phoneSlot = intent.slots.Phone;
			console.log('phoneSlot.value = ' + phoneSlot.value);
			// slots can be missing, or slots can be provided but with empty value.
			// must test for both.
			if (!phoneSlot || !phoneSlot.value) {
				return { error: true }    
			} else {
				var phone = phoneSlot.value;
				if (phone.toString().length > 2) {;
					return { phone: phone }
				} else {
					return { error: true }					
				};
			};
		};				
    };
 
    intentHandlers.AddPlayerDialogIntent = function (intent, session, response) {
		// Handles intent to add a player via an interactive dialog to get the player's 
		// player I.D. and which team to assign them to		
		console.log('entering AddPlayerDialogIntent');
        if (intent.slots.Phone.value) { // if player I.D. was provided
            handlePhoneProvidedDialogRequest(intent, session, response);
        } else if (intent.slots.Team.value) { // if team to assign was provided
            handleTeamProvidedDialogRequest(intent, session, response);
        } else { // user just said 'add player' without any specification
            handleNoSlotDialogRequest(intent, session, response);
        };
			
		/**
		 * Handles the dialog step where the user provides a player I.D.
		 */
		function handlePhoneProvidedDialogRequest(intent, session, response) {	
			console.log('entering handlePhoneProvidedDialogRequest');
			console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey);
			console.log('session.attributes.team = ' + session.attributes.team);
			// if we don't have a team assigned yet, assign one. If we have a team assigned, proceed with fulfillAddPlayer
			if (session.attributes.team) {
				session.attributes.phoneKey = intent.slots.Phone.value;
				fulfillAddPlayer(session, response);
			} else {
				console.log('no team assigned yet');
				// set phone in session and assign team
				session.attributes.phoneKey = intent.slots.Phone.value;	
				console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey);
				
				// Test to see if we are in a dialog toward adding a player to the match. If not, this
				// may be a new player that is trying to register				
				if (session.attributes.firstNumber) { 
					var textToSay = 'To register a player, be sure to first say register, and then a four digit player I.D. that you would like to use moving forward.';
					var repromptTextToSay = '';
					askSpeech(textToSay, repromptTextToSay, response);					
				} else {

					matchStorage.loadMatch(session, function (currentMatch) {
						if (typeof(currentMatch) == 'string') {
							matchNotFound(currentMatch, response);
							return;
						};	
						
						// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later
						for (var stat in currentMatch.data.MatchData) {
							if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
								currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
							};
						};						
						console.log('currentMatch.data.Red1PlayerID = ' + currentMatch.data.Red1PlayerID);
						console.log('currentMatch.data.Blue1PlayerID = ' + currentMatch.data.Blue1PlayerID);
						if (currentMatch.data.MatchType == 'singles') { // this is a singles match
							if (currentMatch.data.Red1PlayerID == 0) { // no player has been assigned to the red team yet, so assign this one
								session.attributes.team = 'red';
							} else if (currentMatch.data.Blue1PlayerID == 0) { // no player has been assigned to the blue team yet, so assign this one
								session.attributes.team = 'blue';
							}							
						} else { // this is a doubles match
							if (currentMatch.data.Red1PlayerID == 0) { // no player has been assigned to the red team yet, so assign this one
								session.attributes.team = 'red';
							} else if (currentMatch.data.Blue1PlayerID == 0) { // no player has been assigned to the blue team yet, so assign this one
								session.attributes.team = 'blue';
							} else if (currentMatch.data.Red2PlayerID == 0) { // the 2nd player has not yet been assigned to the red team, so assign
								session.attributes.team = 'red';
							} else if (currentMatch.data.Blue2PlayerID == 0) { // the 2nd player has not yet been assigned to the blue team, so assign
								session.attributes.team = 'blue';
							}								
						}										
						
						// all slots filled and corresponding session variables set, so move to final fulfillAddPlayer
						console.log('auto filled team, now heading to fulfillAddPlayer');
						console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey);
						console.log('session.attributes.team = ' + session.attributes.team);
						fulfillAddPlayer(session, response);	
					});									
				}				
			};
		};		
		
		/**
		 * Handles the dialog step where the user provides a team that the player should be assigned to
		 */
		function handleTeamProvidedDialogRequest(intent, session, response) {
			console.log('entering handleTeamProvidedDialogRequest');
			
			// There is a potential of a player trying to register that just says their player I.D., so try and prevent:
			// set a flag that we are expecting a player I.D. later in the session
			
			// set team in session and simplify the designation to either 'red' or 'blue'
			session.attributes.team = intent.slots.Team.value;
			if (intent.slots.Team.value == 'red team') { session.attributes.team = 'red' };
			if (intent.slots.Team.value == 'team red') { session.attributes.team = 'red' };
			if (intent.slots.Team.value == 'blue team') { session.attributes.team = 'blue' };
			if (intent.slots.Team.value == 'team blue') { session.attributes.team = 'blue' };

			// if we don't have a player I.D. yet, go get it. If we have a player I.D., we perform the final request			
			if (session.attributes.phoneKey) {
				fulfillAddPlayer(session, response);
			} else {
				// prompt for phone
				var textToSay = 'OK. New player, what is your four digit player I.D.'; 
				var repromptTextToSay = 'What is the four digit I.D. of the player to add?';
				askSpeech(textToSay, repromptTextToSay, response);
			};
		};

		/**
		 * Handle no slots, or slot(s) with no values.
		 * In the case of a dialog based skill with multiple slots,
		 * when passed a slot with no value, we cannot have confidence
		 * it is the correct slot type so we rely on session state to
		 * determine the next turn in the dialog, and reprompt.
		 */
		function handleNoSlotDialogRequest(intent, session, response) {
			console.log('entering handleNoSlotDialogRequest');
			if (session.attributes.phoneKey) {
				// get team re-prompt
				var textToSay = 'What team are you playing on? Please say<break time=\"0.2s\" /> join red team, or <break time=\"0.2s\" /> join blue team';
				var repromptTextToSay = 'Please say join red team, or join blue team';
				askSpeech(textToSay, repromptTextToSay, response);
			} else {
				// get player I.D. re-prompt
				var textToSay = 'OK. New player, please say your four digit player I.D.'; 
				var repromptTextToSay = 'What is the four digit player I.D. of the player to add?';
				askSpeech(textToSay, repromptTextToSay, response);
			};
		};	
	};

	intentHandlers.ChangeMatchLengthToShortIntent = function (intent, session, response) {
        console.log('entering DontAnnounceServeIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			// copy current match stats into nMinusOne prior to changing to enable undo later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};
			
			currentMatch.data.MatchData.GamesPerMatch = 1;						
            var speechText = 'Match will be played as a single game.';		
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };	
	
	intentHandlers.ChangeMatchLengthToLongIntent = function (intent, session, response) {
        console.log('entering DontAnnounceServeIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			// copy current match stats into nMinusOne prior to changing to enable undo later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};
			
			currentMatch.data.MatchData.GamesPerMatch = 5;						
            var speechText = 'Match will be played as best three out of five games';		
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };
	
    intentHandlers.ChangeMatchScoreIntent= function (intent, session, response) {
        console.log('entering ChangeMatchScoreIntent');
		var speechText = 'OK. How many games has each team won?';
			speechText += '<break time=\"0.4s\" />For example, say: Red should have 1, and blue should have 2';
		var repromptText = "How many sets has each team won? Say, for example, say, red should have 1, and blue should have 2";		
		askSpeech(speechText, repromptText, response);				
    };
	
    intentHandlers.SpecifyMatchScoreIntent = function (intent, session, response) {
        console.log('entering SpecifyMatchScoreIntent');
		console.log('intent.slots.RedMatchScore.value = ' + intent.slots.RedMatchScore.value);
		console.log('intent.slots.BlueMatchScore.value = ' + intent.slots.BlueMatchScore.value);
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};	

			// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};
			
			currentMatch.data.MatchData.RedTeamTotalGamesWon = intent.slots.RedMatchScore.value;
			currentMatch.data.MatchData.BlueTeamTotalGamesWon = intent.slots.BlueMatchScore.value;
						
			var speechText = 'OK. The score of the match is now red team ';
				speechText += '<break time=\"0.1s\" />';
				speechText += currentMatch.data.MatchData.RedTeamTotalGamesWon;
				speechText += ' game';
			if (currentMatch.data.MatchData.RedTeamTotalGamesWon < 1 || currentMatch.data.MatchData.RedTeamTotalGamesWon > 1) {
				speechText += '\'s';
			};
				speechText += ' to blue team ';
				speechText += '<break time=\"0.1s\" />';
				speechText += currentMatch.data.MatchData.BlueTeamTotalGamesWon;
				speechText += ' game';
				if (currentMatch.data.MatchData.BlueTeamTotalGamesWon < 1 || currentMatch.data.MatchData.BlueTeamTotalGamesWon > 1) {
					speechText += '\'s';
				};
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };	
	
    intentHandlers.NewGameIntent = function (intent, session, response) {
        console.log('entering NewGameIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};	

			// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};						

			if (!intent.slots.Team.value) { 			
				var textToSay = 'OK. Who will be serving in the new game? Please say <break time=\"0.2s\" /> new game, red serve or, '; 
				textToSay += '<break time=\"0.2s\" /> new game blue serve.';
				var repromptTextToSay = 'Say <break time=\"0.2s\" /> new game red serve, or <break time=\"0.2s\" /> new game, blue serve.';
				askSpeech(textToSay, repromptTextToSay, response);					
                return;
			}

            var currentServer = intent.slots.Team.value;						
            if (currentServer == 'red team') { currentServer = 'red' };
            if (currentServer == 'blue team') { currentServer = 'blue' };
			if (currentServer == 'team red') { currentServer = 'red' };
            if (currentServer == 'team blue') { currentServer = 'blue' };
			//reset game scores to 0
			currentMatch.data.MatchData.RedTeamGameScore = 0; 
			currentMatch.data.MatchData.BlueTeamGameScore = 0;
			currentMatch.data.MatchData.WhosServe = currentServer;
			currentMatch.data.MatchData.Deuce = false;
			currentMatch.data.MatchData.BreakPoint = false;			
            var speechText = 'New game started, ';
            speechText += currentServer ;
            speechText += ' team\'s serve';			
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };
		
    intentHandlers.ChangeNumberOfServesIntent = function (intent, session, response) {
        console.log('entering ChangeNumberOfServesIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};	

			// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};						

			if (!intent.slots.Serves.value) { 			
				var textToSay = 'OK. How many points should each player serve? Please say <break time=\"0.2s\" /> serve 5 points or, '; 
				textToSay += '<break time=\"0.2s\" /> serve two points.';
				var repromptTextToSay = 'Say <break time=\"0.2s\" /> serve 5 points or <break time=\"0.2s\" /> serve two points.';
				askSpeech(textToSay, repromptTextToSay, response);					
                return;
			}

            currentMatch.data.MatchData.PointsToServe = intent.slots.Serves.value;						

            var speechText = 'Each player will serve ';
            speechText += currentMatch.data.MatchData.PointsToServe ;
            speechText += ' points.';			
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };	

    intentHandlers.ChangeGameLengthIntent = function (intent, session, response) {
        console.log('entering ChangeGameLengthIntent');
		console.log('intent.slots.Points.value = ' + intent.slots.Points.value);
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};	

			// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};						

			if ( !intent.slots.Points.value || (intent.slots.Points.value != 21 && intent.slots.Points.value != 11) ) { 			
				var textToSay = 'You can play first to 11 or first to 21. Which would you like? Please say <break time=\"0.2s\" /> play to 11, '; 
				textToSay += '<break time=\"0.2s\" /> or play to 21.';
				var repromptTextToSay = 'Say <break time=\"0.2s\" /> play to 11 <break time=\"0.2s\" /> or play to 21.';
				askSpeech(textToSay, repromptTextToSay, response);					
                return;
			}

			if (intent.slots.Points.value == 21) {
				currentMatch.data.MatchData.TwentyOnePointer = true;
			} else {
				currentMatch.data.MatchData.TwentyOnePointer = false;
			};						

            var speechText = 'Games will be played to ';
            speechText += intent.slots.Points.value;
            speechText += ' points.';			
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };		
		
	intentHandlers.DontSwitchSidesIntent = function (intent, session, response) {
        console.log('entering DontSwitchSidesIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			// copy current match stats into nMinusOne prior to changing to enable undo later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};
			
			currentMatch.data.MatchData.SwitchSides = false;						
            var speechText = 'OK, I won\'t prompt you to switch sides for this match';		
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };
	
	intentHandlers.AnnounceScoreIntent = function (intent, session, response) {
        console.log('entering DontAnnounceScoreIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			// copy current match stats into nMinusOne prior to changing to enable undo later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};
			
			currentMatch.data.MatchData.AnnounceScore = true;						
            var speechText = 'I will announce the score when starting new games in this match';		
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };

	intentHandlers.DontAnnounceScoreIntent = function (intent, session, response) {
        console.log('entering DontAnnounceScoreIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			// copy current match stats into nMinusOne prior to changing to enable undo later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};
			
			currentMatch.data.MatchData.AnnounceScore = false;						
            var speechText = 'I won\'t announce the score when starting a new game in this match';		
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };	

	intentHandlers.AnnounceServeIntent = function (intent, session, response) {
        console.log('entering DontAnnounceServeIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			// copy current match stats into nMinusOne prior to changing to enable undo later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};
			
			currentMatch.data.MatchData.AnnounceServe = true;						
            var speechText = 'I will announce who serves next for games in this match';		
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };	
	
	intentHandlers.DontAnnounceServeIntent = function (intent, session, response) {
        console.log('entering DontAnnounceServeIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			// copy current match stats into nMinusOne prior to changing to enable undo later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};
			
			currentMatch.data.MatchData.AnnounceServe = false;						
            var speechText = 'I won\'t announce who serves next for games in this match';		
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };	
	
	intentHandlers.ExperiencedUserModeOnIntent = function (intent, session, response) {
        console.log('entering ExperiencedUserModeOnIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};
			
			currentMatch.data.MatchData.ExperiencedUserMode = true;						
            var speechText = 'I\'ll keep it short.';		
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };	
	
	intentHandlers.ExperiencedUserModeOffIntent = function (intent, session, response) {
        console.log('entering ExperiencedUserModeOnIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};
			
			currentMatch.data.MatchData.ExperiencedUserMode = false;						
            var speechText = 'I\'ll give you more information as we go now.';		
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };	
			
	intentHandlers.SavePreferencesIntent = function (intent, session, response) {
        console.log('entering savePreferencesIntent');		
		if (intent.slots.Phone.value) { // if player I.D. was provided
			if (intent.slots.Phone.value.toString().length != 4) { 
				var textToSay = 'I\'m not sure I got that correctly, it didn\'t have four digits.'; 
				textToSay += '<break time=\"0.3s\" />Please say <break time=\"0.2s\" /> save preferences to, and then your four digit player I.D.';
				var repromptTextToSay = 'say save preferences to and then say your four digit player I.D.';
				askSpeech(textToSay, repromptTextToSay, response);
			} else {
				session.attributes.phoneKey = intent.slots.Phone.value;
				fulfillSavePreferences(session, response);
			}
		} else { // user just said 'save preferences' without any specification, so reprompt them to do it with a player I.D.
			var textToSay = 'OK. In order to save these match settings, say: save preferences to, and then your four digit player I.D.'; 
			textToSay += '<break time=\"0.3s\" />For example, say, save preferences to five three zero nine.';
			var repromptTextToSay = 'say: save preferences to, and then your four digit player I.D.';
			askSpeech(textToSay, repromptTextToSay, response);
		};						      
    };	
	
	intentHandlers.LoadPreferencesIntent = function (intent, session, response) {
        console.log('entering loadPreferencesIntent');		
		if (intent.slots.Phone.value) { // if player I.D. was provided
			console.log('intent.slots.Phone.value = ' + intent.slots.Phone.value);
			if (intent.slots.Phone.value.toString().length != 4) { 
				var textToSay = 'I\'m not sure I got that correctly, it didn\'t have four digits.'; 
				textToSay += '<break time=\"0.3s\" />Please say <break time=\"0.2s\" /> load preferences from, and then your four digit player I.D.';
				var repromptTextToSay = 'say load preferences from and then say your four digit player I.D.';
				askSpeech(textToSay, repromptTextToSay, response);
			} else {
				session.attributes.phoneKey = intent.slots.Phone.value;
				fulfillLoadPreferences(session, response);
			}
		} else { // user just said 'load preferences' without any specification, so reprompt them to do it with a player I.D.
			var textToSay = 'OK. In order to apply your preferences to this match, say: load preferences from, and then your four digit player I.D.'; 
			textToSay += '<break time=\"0.3s\" />For example, say, load preferences from five three zero nine.';
			var repromptTextToSay = 'say: load preferences from, and then your four digit player I.D.';
			askSpeech(textToSay, repromptTextToSay, response);
		};						      
    };		

    intentHandlers.TellMatchSummaryIntent = function (intent, session, response) {
		console.log('entering TellMatchSummaryIntent');
		matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};			
			// reply to the user with the stats on the match				
			var matchSummaryContent = createSpeechSummaryForMatch(currentMatch);
			var repromptTextToSay = 'Say, continue with red team, continue with blue team, or all done';
			askSpeech(matchSummaryContent, repromptTextToSay, response);
        });			
    };	
	
    intentHandlers.RedTeamSummaryIntent = function (intent, session, response) {
		console.log('entering RedTeamSummaryIntent');
		session.attributes.summaryForTeam = 'red';			
		createSpeechSummaryForTeam(session, response);
    };	

    intentHandlers.BlueTeamSummaryIntent = function (intent, session, response) {
		console.log('entering BlueTeamSummaryIntent');
		session.attributes.summaryForTeam = 'blue';
		createSpeechSummaryForTeam(session, response);
    };		
			
    intentHandlers.TellGameScoreIntent = function (intent, session, response) {
		console.log('entering TellGameScoreIntent');
		// reply to the user with the score of the current game
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};	
			
			var currentServer = currentMatch.data.MatchData.WhosServe;
			
			if (currentMatch.data.MatchData.Tiebreaker) { // if in a tiebreaker, report that score
				var speechOutput = constructTiebreakerScoreOutput(currentMatch, currentServer)
			} else { // otherwise report normal game score
				var speechOutput = constructScoreOutput(currentMatch, currentServer); 				
			};
                             
            response.tell(speechOutput);                            
        });
    };

	intentHandlers.TellMatchScoreIntent = function (intent, session, response) {
		console.log('entering TellMatchScoreIntent');
		// reply to the user with the set score of the current match
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};			
			var formattedMatchScore = formatMatchScore(currentMatch);

			if (currentMatch.data.MatchData.RedTeamSetsWon == 0 && currentMatch.data.MatchData.BlueTeamSetsWon == 0) {
				speechText = 'the match is still tied at love love'; 
			} else if (currentMatch.data.MatchData.RedTeamSetsWon == 1 && currentMatch.data.MatchData.BlueTeamSetsWon == 1) {
				speechText = 'the match is tied at one set each';
			} else {
				var speechText = 'match score ';
				speechText += '<break time=\"0.1s\" />';
				speechText += formattedMatchScore;				
			};
			
			tellSpeech(speechText, currentMatch, response);					                           
        });
    };	
	
	intentHandlers.TellServeIntent = function (intent, session, response) {
		console.log('entering TellServeIntent');
		// reply to the user with who's serve it is
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};			

			var speechText = 'It is ';			
			var serverName = getServerName(currentMatch);
			speechText += serverName;
			speechText += '\'s serve.';

			tellSpeech(speechText, currentMatch, response); 			
        });
    };

	intentHandlers.UndoIntent = function (intent, session, response) {
		console.log('entering undoIntent');
		// undo the last match related command
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};
			
			// roll back to previous match status
			currentMatch.data.MatchData = currentMatch.data.nMinusOne;
			
			var currentServer = currentMatch.data.MatchData.WhosServe;
			var speechText = 'Undone, it is ';
			var speechOutput = constructScoreOutput(currentMatch, currentServer);
			var revisedScore = speechText + speechOutput;
			tellSpeechAndSave(revisedScore, currentMatch, response); 			
        });
    };		
		
    intentHandlers.TellMoreHelpIntent = function (intent, session, response) {
        console.log('entering TellMoreHelpIntent');				
			var speechOutput = {
				speech: '<speak>' + textHelper.moreHelp + ' What would you like to do?' + '</speak>',
				type: AlexaSkill.speechOutputType.SSML
			};
			response.ask(speechOutput);			
    };
	
    intentHandlers.TellSettingAudioPreferencesIntent = function (intent, session, response) {
        console.log('entering TellSettingAudioPreferencesIntent');				
			var speechOutput = {
				speech: '<speak>' + textHelper.settingAudioPreferences + ' What would you like to do?' + '</speak>',
				type: AlexaSkill.speechOutputType.SSML
			};
			response.ask(speechOutput);			
    };
	
    intentHandlers.TellSaveAndLoadPreferencesIntent = function (intent, session, response) {
        console.log('entering TellSettingAudioPreferencesIntent');				
			var speechOutput = {
				speech: '<speak>' + textHelper.saveAndLoadPreferences + ' What would you like to do?' + '</speak>',
				type: AlexaSkill.speechOutputType.SSML
			};
			response.ask(speechOutput);			
    };	
	
    intentHandlers.TellEvenMoreHelpIntent = function (intent, session, response) {
        console.log('entering TellEvenMoreHelpIntent');				
			var speechOutput = {
				speech: '<speak>' + textHelper.evenMoreHelp + ' What would you like to do?' + '</speak>',
				type: AlexaSkill.speechOutputType.SSML
			};
			response.ask(speechOutput);			
    };

    intentHandlers.TellRulesOfPingPongIntent = function (intent, session, response) {
        console.log('entering TellRulesOfPingPongIntent');				
			var speechOutput = {
				speech: '<speak>' + textHelper.rulesOfPingPong + ' What would you like to do?' + '</speak>',
				type: AlexaSkill.speechOutputType.SSML
			};
			response.ask(speechOutput);			
    };		
	
    intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
			var speechOutput = {
				speech: '<speak>' + textHelper.shortHelp + ' What would you like to do?' + '</speak>',
				type: AlexaSkill.speechOutputType.SSML
			};
			response.ask(speechOutput);
        } else {
			var speechOutput = {
				speech: '<speak>' + textHelper.shortHelp + '</speak>',
				type: AlexaSkill.speechOutputType.SSML
			};
			response.tell(speechOutput);
        }
    };

    intentHandlers['AMAZON.CancelIntent'] = function (intent, session, response) {
		console.log('Intent = ' + JSON.stringify(intent));
        if (skillContext.needMoreHelp) {
            response.tell('Okay, cancelling that.');
        } else {
            response.tell('');
        }
    };

    intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
		console.log('Intent = ' + JSON.stringify(intent));
		if (session.attributes.registeringPlayer == true) {
			var speechOutput = {
				speech: '<speak>' + 'Sorry, I didn\'t hear you correctly. Please say, my first name is, and then your name.' + '</speak>',
				type: AlexaSkill.speechOutputType.SSML
			};
			response.ask(speechOutput);			
		} else {
			if (skillContext.needMoreHelp) {
				response.tell('Okay, standing by.');
			} else {
				response.tell('');
			}			
		}

    };
};
console.log('exiting intentHandlers.js');
exports.register = registerIntentHandlers;
