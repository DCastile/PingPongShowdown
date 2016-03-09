
'use strict';
console.log('entering intentHandlers.js');

var textHelper = require('./textHelper'),
    matchStorage = require('./matchStorage'),
	playerStorage = require('./playerStorage'),
	AlexaSkill = require('./AlexaSkill'),
	playerSMS = require('./playerSMS'),
	singlesPlayerHistory = require('./singlesPlayerHistory'),
	doublesTeamHistory = require('./doublesTeamHistory'),	
	async = require("async");
	
var speechText = '';

function fulfillNewMatch(session, response) {
	console.log('entering fulfillNewMatch function');
	matchStorage.newMatch(session, function (currentMatch) {
		currentMatch.data.MatchData.WhosServe = session.attributes.firstToServe;			
		currentMatch.data.MatchType = session.attributes.singlesOrDoubles;
		
		if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
			if (currentMatch.data.MatchType == 'doubles') {
				speechText = 'Welcome doublesplayers.<break time=\"0.4s\" /> ';
			} else {
				speechText = 'Welcome singlesplayers.<break time=\"0.4s\" /> ';
			};

			// Redirect to either 'Add Player' or 'Skip Sign In' and start a new match.
			speechText += 'To have your match statistics saved, please sign in. To do that, say, add a player.';
			speechText += ' To just start playing, say skipsign-in.';
			var repromptTextToSay = 'Would you like to add a player or skip sign in?';			
		} else {
			// use few words
			speechText = 'Now, add a player, or skip sign in';
			var repromptTextToSay = 'Now, add a player or, skip sign in';			
		};	

		askSpeechAndSave(speechText, repromptTextToSay, currentMatch, response);	
	});	
};

function fulfillAddPlayer(session, response) {
	// Both the one-shot and dialog based paths lead to this method to issue the add player request, and
	// respond to the user with confirmation.
	console.log('entering fulfillAddPlayer');
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
				var speechText = 'Hmm, I wasn\'t able to find that phone number. Please try again.';
				speechText += ' Or, you can register that number by saying: Register a new player.';
				var repromptTextToSay = 'Would you like to add a player, register a new player, or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);
				return;
			}
			
			var startFast = false; // if startFast (set below) is true, the match is started immediately instead of saying 'begin the match'
			
			if (session.attributes.team == 'red') {
				if (currentMatch.data.MatchType == 'singles') {
					// use the Red1/Blue1PlayerID
					if (currentMatch.data.Red1PlayerID == 0) {
						currentMatch.data.Red1PlayerID = newMatchPlayer.data.Phone;
					} else {
						var speechText = 'There is already a player assigned to the red team of this singles match.'; 
						speechText += ' You can start a new match or add a player to the blue team if that was your intent.';
						var repromptTextToSay = 'You can start a new match or add a player to the blue team if that was your intent.';
						askSpeech(speechText, repromptTextToSay, response);						
					};
				} else {
					// this is a doubles match. Check to see if the player should be assigned Red/Blue1 or Red/Blue2
					if (currentMatch.data.Red1PlayerID == 0) {
						currentMatch.data.Red1PlayerID = newMatchPlayer.data.Phone;
						currentMatch.data.MatchData.PlayerAlias.Red1 = 'alpha';
						var callSign = currentMatch.data.MatchData.PlayerAlias.Red1;
					} else if (currentMatch.data.Red2PlayerID == 0) {
						currentMatch.data.Red2PlayerID = newMatchPlayer.data.Phone;
						currentMatch.data.MatchData.PlayerAlias.Red2 = 'bravo';
						var callSign = currentMatch.data.MatchData.PlayerAlias.Red2;						
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
					} else {
						var speechText = 'There is already a player assigned to the blue team of this singles match.'; 
						speechText += ' You can start a new match or add a player to the red team if that was your intent.';
						var repromptTextToSay = 'You can start a new match or add a player to the red team if that was your intent.';						
						askSpeech(speechText, repromptTextToSay, response);						
					};
				} else {
					// this is a doubles match. Check to see if the player should be assigned Red/Blue1 or Red/Blue2
					if (currentMatch.data.Blue1PlayerID == 0) {
						currentMatch.data.Blue1PlayerID = newMatchPlayer.data.Phone;
						currentMatch.data.MatchData.PlayerAlias.Blue1 = 'charlie';
						var callSign = currentMatch.data.MatchData.PlayerAlias.Blue1;						
					} else if (currentMatch.data.Blue2PlayerID == 0) {
						currentMatch.data.Blue2PlayerID = newMatchPlayer.data.Phone;
						currentMatch.data.MatchData.PlayerAlias.Blue2 = 'delta';
						var callSign = currentMatch.data.MatchData.PlayerAlias.Blue2;						
					} else {
						var speechText = 'Both doubles partners are already assigned to the blue team.'; 
						speechText += ' You can start a new match or add a player to the red team if that was your intent.';
						var repromptTextToSay = 'You can start a new match or add a player to the red team if that was your intent.';
						askSpeech(speechText, repromptTextToSay, response);
					};
				};				
			};
			
			// possible future enhancement - add in here .mp3 sound file with player name 'added to the match'
			// example: speechText += "<audio src='https://s3.amazonaws.com/ask-storage/tidePooler/OceanWaves.mp3'/>"

			if (currentMatch.data.MatchData.ExperiencedUserMode == false) {			
				var speechText = 'Welcome';				
				speechText += ', you have been added to the match on the  ';
				speechText += session.attributes.team;	
				speechText += ' team.';	
				console.log('speechText = ' + speechText);
			} else {
				var speechText = 'Added';
			}
				
			// if this is a doubles match, tell player their call sign	
			if (currentMatch.data.MatchType == 'doubles') {
				if (currentMatch.data.MatchData.ExperiencedUserMode == false) {	
					speechText += ' Your call sign for this match is ';
					speechText += callSign;
				} else {
					speechText += ' as callsign ';
					speechText += callSign;					
				};

				if (callSign == 'alpha') {
					var partnerCallSign = 'bravo';
				} else if (callSign == 'bravo') {
					var partnerCallSign = 'alpha';
				} else if (callSign == 'charlie') {
					var partnerCallSign = 'delta';
				} else if (callSign == 'delta') {
					var partnerCallSign = 'charlie';
				};
				
				if ( (session.attributes.team == 'red' && currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo') ||
					 (session.attributes.team == 'blue' && currentMatch.data.MatchData.FirstBlueToServe == 'CharlieOrDelta') ) {
					if (currentMatch.data.MatchData.ExperiencedUserMode == false) {	
						speechText += '.<break time=\"0.2s\" />. Your partner\'s callsign will be ';
						speechText += partnerCallSign;
						speechText += '.<break time=\"0.2s\" /> I\'ll use them when it\'s your turn to serve.';
					} else {
						speechText += '.<break time=\"0.3s\" />. Your partner is ';
						speechText += partnerCallSign;						
					};
				};					
				// if the serve order has not yet been fully defined (both red and blue teams selected who serves first), then ask the user.
				if ( (session.attributes.team == 'red' && currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo') ||
					 (session.attributes.team == 'blue' && currentMatch.data.MatchData.FirstBlueToServe == 'CharlieOrDelta') ) {
					// we need to know which doubles player will be serving first, so set up getDoublesPlayerServingIntent
					if (currentMatch.data.MatchData.ExperiencedUserMode == false) {					
						speechText += ' Which one of you will be serving first, will it be: ';
						if (session.attributes.team == 'red') {
							speechText += ' Alpha, or Bravo?';
							var repromptTextToSay = 'Who will be serving first, Alpha or Bravo?';
						} else {
							speechText += ' Charlie, or Delta?';
							var repromptTextToSay = 'Who will be serving first, Charlie or Delta?';
						};
					} else {
						speechText += '. Who is serving first? '
					};
					delete session.attributes.phoneKey;
					delete session.attributes.team;					
					askSpeechAndSave(speechText, repromptTextToSay, currentMatch, response);
					return;
				};
			};

			delete session.attributes.phoneKey;
			delete session.attributes.team;	
			
			if (	// if we have all the players signed in
					(currentMatch.data.MatchType == 'singles' && 
					 currentMatch.data.Red1PlayerID !== 0 && 
					 currentMatch.data.Blue1PlayerID !== 0 ) ||
					 
					(currentMatch.data.MatchType == 'doubles' && 
					 currentMatch.data.Red1PlayerID !== 0 && 
					 currentMatch.data.Blue1PlayerID !== 0 &&
					 currentMatch.data.Red2PlayerID !== 0 && 
					 currentMatch.data.Blue2PlayerID !== 0 )	) {
				if (currentMatch.data.MatchType == 'singles')	{
					speechText += '<break time=\"0.3s\" /> Both ';
				} else {
					speechText += '<break time=\"0.3s\" /> All ';
				};
				if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
					speechText += 'players have now been added. If you are ready to start, say, begin the match.';
					var repromptTextToSay = 'If you are ready to start, say, begin the match.';
				} else {
					var startFast = true;
					speechText += 'players added. New match starting now. <break time=\"0.3s\" />';					
					if (currentMatch.data.MatchType == 'singles')	{
						speechText += currentMatch.data.MatchData.WhosServe;
					} else {
						speechText += currentMatch.data.MatchData.DoublesServer;						
					};
					speechText += '\'s serve.';						
				};					
			} else {
				if (currentMatch.data.MatchType == 'singles') {
					if (currentMatch.data.Red1PlayerID != 0) { // red singles player was added
						if (currentMatch.data.MatchData.ExperiencedUserMode == false) {	
							speechText += '<break time=\"0.3s\" />Now, you can add a player to the blue team, or begin the match.';
							var repromptTextToSay = 'Please say add a player or, begin the match.';	
						} else {
							speechText += '<break time=\"0.3s\" />Add player to blue? Or begin the match?';
							var repromptTextToSay = 'Add a player or, begin the match?';
						}							
					} else {
						if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
							speechText += '<break time=\"0.3s\" />Now, you can add a player to the red team, or begin the match.';
							var repromptTextToSay = 'Please say add a player or, begin the match.';	
						} else {
							speechText += '<break time=\"0.3s\" />Want to add player to red? Or begin the match?';
							var repromptTextToSay = 'Add a player or, begin the match?';							
						}							
					};
				} else { // this is a doubles match					
					// there is at least 1 player of the 4	that has not yet been added			
						if (currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo' || 
							currentMatch.data.MatchData.FirstBlueToServe == 'CharlieOrDelta' ) { // 1 player has not yet been added to each team
							if (currentMatch.data.MatchData.FirstRedToServe == 'alpha' || currentMatch.data.MatchData.FirstRedToServe == 'bravo') {
								if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
									speechText += '<break time=\"0.3s\" /> You\'ve successfully added a player to the red team, now add a player to the blue team.';
									var repromptTextToSay = 'Please say add another player.';
								};									
							} else {
								if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
									speechText += '<break time=\"0.3s\" /> You\'ve successfully added a player to the blue team, now add a player to the red team.';
									var repromptTextToSay = 'Please say add another player.';
								};									
							};
						} else { // 2 players are signed in (at least one player to each team), but not all 4 
							if (currentMatch.data.Red1PlayerID != 0 && currentMatch.data.Red2PlayerID != 0 ) { // both red players are signed in
								if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
									speechText += '<break time=\"0.3s\" /> Both red players are now signed in. Would you like to add another player to the blue team, or begin the match?';
									console.log('speechText d = ' + speechText);
									var repromptTextToSay = 'Would you like to add another player or, begin the match?';
								};									
							} else if (currentMatch.data.Blue1PlayerID != 0 && currentMatch.data.Blue2PlayerID != 0) { // both blue players are signed in
								if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
									speechText += '<break time=\"0.3s\" /> Both blue players are now signed in. Would you like to add another player to the red team, or begin the match?';
									console.log('speechText e = ' + speechText);
									var repromptTextToSay = 'Would you like to add another player or, begin the match?';
								};									
							} else {
								if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
									speechText += '<break time=\"0.3s\" /> Would you like to add another player, or begin the match?';
									console.log('speechText f = ' + speechText);
									var repromptTextToSay = 'Would you like to add another player or, begin the match?';
								};									
							};
						};
					};																														
				};
			if (startFast == false) {
				askSpeechAndSave(speechText, repromptTextToSay, currentMatch, response);
			} else {
				tellSpeechAndSave(speechText, currentMatch, response);
			};							
        });
    });
};

function fulfillSavePreferences(session, response) {
	// When phone number confirmed, store the current match settings in given player's profile
	// These include:
	// 		SwitchSides: flag to indicate whether players want to switch sides during the match. Default = true
	// 		PlayGamePoint: flag to indicate whether players want to play No Ad scoring or not. Default = false
	// 		ExperiencedUserMode: flag to indicate whether minimal words should be spoken. Default = false
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
				var speechText = 'Hmm, I wasn\'t able to find that phone number. Please try again.';
				speechText += ' Or, you can register that number by saying: Register a new player.';
				var repromptTextToSay = 'Would you like to add a player, register a new player, save preferences, or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);
				return;
			}			
			
			loadedPlayer.data.Preferences.SwitchSides = currentMatch.data.MatchData.SwitchSides;
			loadedPlayer.data.Preferences.PlayGamePoint = currentMatch.data.MatchData.PlayGamePoint;
			loadedPlayer.data.Preferences.ExperiencedUserMode = currentMatch.data.MatchData.ExperiencedUserMode;

			loadedPlayer.save(session, function () {
				response.tell('Preferences successfully saved');	
			});							
        });
    });
};

function fulfillLoadPreferences(session, response) {
	// When phone number confirmed, retrieve the user's preferences and apply them to the current match 
	// These include:
	// 		SwitchSides: flag to indicate whether players want to switch sides during the match. Default = true
	// 		PlayGamePoint: flag to indicate whether players want to play No Ad scoring or not. Default = false
	// 		ExperiencedUserMode: flag to indicate whether minimal words should be spoken. Default = false
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
				var speechText = 'Hmm, I wasn\'t able to find that phone number. Please try again.';
				speechText += ' Or, you can register that number by saying: Register a new player.';
				var repromptTextToSay = 'Would you like to add a player, register a new player, save preferences, or cancel?';				
				askSpeech(speechText, repromptTextToSay, response);
				return;
			}			
			
			currentMatch.data.MatchData.SwitchSides = loadedPlayer.data.Preferences.SwitchSides;
			currentMatch.data.MatchData.PlayGamePoint = loadedPlayer.data.Preferences.PlayGamePoint;
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
		var speechText = 'Hmm, I wasn\'t able to find a match played with this Echo in the last 4 hours. ';	
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
	if (currentMatch.data.MatchData.RedTeamSetsWon > currentMatch.data.MatchData.BlueTeamSetsWon) {
		var matchLeaderScore = currentMatch.data.MatchData.RedTeamSetsWon.toString();
		var otherTeamScore = currentMatch.data.MatchData.BlueTeamSetsWon.toString();
		var matchLeader = ', Red Team';
	} else if (currentMatch.data.MatchData.RedTeamSetsWon == currentMatch.data.MatchData.BlueTeamSetsWon) {
		var matchLeaderScore = currentMatch.data.MatchData.RedTeamSetsWon.toString();
		var otherTeamScore = currentMatch.data.MatchData.BlueTeamSetsWon.toString();
		var matchLeader = '';
	} else {
		var matchLeaderScore = currentMatch.data.MatchData.BlueTeamSetsWon.toString();
		var otherTeamScore = currentMatch.data.MatchData.RedTeamSetsWon.toString();
		var matchLeader = ', Blue Team';
	};
	
	var middlePart = '';
	if (speechOrText == 'text') {
		middlePart = '-';
	} else { // speechOrText = 'speech'
		if (matchLeaderScore == 1 ) {
			middlePart = ' set to ';
		} else if (matchLeaderScore > 1) {
			middlePart = ' sets to ';
		};		
	}

	var formattedMatchScore = matchLeaderScore + middlePart + otherTeamScore + matchLeader;		
	return formattedMatchScore;
};

function formatSetScore(setToSay, sayTeam, speechOrText, currentMatch) {
	console.log('entering formatSetScore function');
	if (setToSay == 1) {
		var rawScores = currentMatch.data.MatchData.Set1Score.split(" ");				
	} else if (setToSay == 2) {
		var rawScores = currentMatch.data.MatchData.Set2Score.split(" ");
	} else if (setToSay == 3) {
		var rawScores = currentMatch.data.MatchData.Set3Score.split(" ");
	};

	if (speechOrText == 'speech') {
		var formattedSetScore = rawScores[0] + ' to ' + rawScores[1] + ', ';
		if ( (rawScores[2]) && sayTeam == true ) {
			formattedSetScore += rawScores[2] + ' ' + rawScores[3];
		};		
	} else { // speechOrText = 'text'
		var formattedSetScore = rawScores[0] + '-' + rawScores[1]
		if ( (rawScores[2]) ) {
			formattedSetScore += ', ' + rawScores[2] + ' ' + rawScores[3] + "\n";;
		} else {
			formattedSetScore += "\n";
		}			
	};
	
	return formattedSetScore;
};

function pointToPlayer(colorWinner, currentMatch, response) {
	console.log('entering pointToPlayer function');
	//console.log('currentMatch in intentHandlers = ' + JSON.stringify(currentMatch) );
	console.log('Red Team game score before = ' + currentMatch.data.MatchData.RedTeamGameScore);
	console.log('Blue Team game score before = ' + currentMatch.data.MatchData.BlueTeamGameScore);
	console.log('Current Server = ' + currentMatch.data.MatchData.WhosServe);

	// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later	
	for (var stat in currentMatch.data.MatchData) {
		if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
			currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
		};
	};
	
	var currentServer = currentMatch.data.MatchData.WhosServe;	
	if (currentServer == 'red') {
		currentMatch.data.MatchData.RedPointsServed++
	} else {
		currentMatch.data.MatchData.BluePointsServed++
	};
	// establish who got the point and set values appropriately
	if (colorWinner == 'point red') { // red won the point
		// increment pointWinner's total points won in the match
		currentMatch.data.MatchData.RedTeamTotalPointsWon++;
		currentMatch.data.MatchData.BluePointStreak = 0; // reset the opposing team's point streak
		currentMatch.data.MatchData.PointWinner = 'red'; // will be referred to under nMinusOne to determine who won prior point
		var pointWinner = 'red';
		if (currentMatch.data.nMinusOne.PointWinner == 'red') { // extend point streaks as applicable
			if (currentMatch.data.MatchData.RedPointStreak == 0) {
				currentMatch.data.MatchData.RedPointStreak++; // give credit for the 1st point of the streak
			}
			currentMatch.data.MatchData.RedPointStreak++; // increment the streak
			if (currentMatch.data.MatchData.RedPointStreak > currentMatch.data.MatchData.MaxRedPointStreak) {
				currentMatch.data.MatchData.MaxRedPointStreak = currentMatch.data.MatchData.RedPointStreak;
			};
		};
		var pointLoser = 'blue';
		var pointWinnerScore = incrementPlayerGameScore(currentMatch.data.MatchData.RedTeamGameScore);
		var pointLoserScore = currentMatch.data.MatchData.BlueTeamGameScore;
		var pointWinnerSetScore = currentMatch.data.MatchData.RedTeamSetScore;
		var pointLoserSetScore = currentMatch.data.MatchData.BlueTeamSetScore;
		var pointWinnerSetsWon = currentMatch.data.MatchData.RedTeamSetsWon;
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
		var pointWinner = 'blue';
		if (currentMatch.data.nMinusOne.PointWinner == 'blue') { // extend point streaks as applicable
			if (currentMatch.data.MatchData.BluePointStreak == 0) {
				currentMatch.data.MatchData.BluePointStreak++; // give credit for the 1st point of the streak
			}		
			currentMatch.data.MatchData.BluePointStreak++; // increment the streak
			if (currentMatch.data.MatchData.BluePointStreak > currentMatch.data.MatchData.MaxBluePointStreak) {
				currentMatch.data.MatchData.MaxBluePointStreak = currentMatch.data.MatchData.BluePointStreak;
			};
		};
		var pointLoser = 'red';
		var pointWinnerScore = incrementPlayerGameScore(currentMatch.data.MatchData.BlueTeamGameScore);
		var pointLoserScore = currentMatch.data.MatchData.RedTeamGameScore;
		var pointWinnerSetScore = currentMatch.data.MatchData.BlueTeamSetScore;
		var pointLoserSetScore = currentMatch.data.MatchData.RedTeamSetScore;
		var pointWinnerSetsWon = currentMatch.data.MatchData.BlueTeamSetsWon;	
		if (currentMatch.data.MatchData.WhosServe == 'blue') {
			var serverWonPoint = true;
			currentMatch.data.MatchData.BluePointsWonOnServe++;
		} else if (currentMatch.data.MatchData.WhosServe == 'red') {
			var serverWonPoint = false;
			currentMatch.data.MatchData.BluePointsWonOffServe++;
		};
	};	
	
	if (currentMatch.data.MatchData.Tiebreaker == true) {
		if (colorWinner == 'point red') { // red won the tiebreaker point
			currentMatch.data.MatchData.TiebreakRedScore++;
		} else if (colorWinner == 'point blue') { // blue won the tiebreaker point
			currentMatch.data.MatchData.TiebreakBlueScore++;
		};
		playTiebreaker(currentMatch, response);
		return;
	};
	
	if (pointWinnerScore == 50) { // winner had 40 and then won the point, don't know what loser had yet
		if (currentMatch.data.MatchData.PlayGamePoint == true) { // this is being played as a game point match, so pointWinner wins the game	
			if (pointLoserScore == 40) { // it was game point
				if (pointWinner == 'red') { // red won the game point so update stats
					currentMatch.data.MatchData.RedGamePointsWon++;
				} else { // blue won the game point so update stats
					currentMatch.data.MatchData.BlueGamePointsWon++;			
				};
			};			
			currentMatch.data.MatchData.BreakPoint = false;
			pointWinnerWinsGame();
			return;
		};
		if (pointLoserScore == 40) { // point was deuce, now advantage pointWinner
			currentMatch.data.MatchData.BreakPoint = false;
			if (serverWonPoint) { 
				var updatedMatch = updateScores(currentMatch, 'add in', currentServer);
			} else {
				var updatedMatch = updateScores(currentMatch, 'add out', currentServer);
			};
			speechText = constructScoreOutput(updatedMatch, currentServer);
			tellSpeechAndSave(speechText, currentMatch, response);
			return; // *********************************** exit the loadMatch function **********************************
			
		} else { // point was 40 to 30 or below , so pointWinner wins game					
			pointWinnerWinsGame();
			return;			
		};
	};
	if (pointWinnerScore != 50 && pointLoserScore != 0) { // prior to this point, pointWinner had 30 or below and pointLoser had 15 or above, must handle format separately
		if (serverWonPoint) {
			var combinedScore = ("" + pointWinnerScore + pointLoserScore );
			// check to see if it was break point against the server
			if (currentMatch.data.MatchData.BreakPoint) {
				// this was a break point saved, so increment break points saved counter
				if (currentMatch.data.MatchData.WhosServe == 'red') {
					currentMatch.data.MatchData.RedBreakPointsSaved++;
				} else {
					currentMatch.data.MatchData.BlueBreakPointsSaved++;
				};
			};
		} else { 
			var combinedScore = ("" + pointLoserScore + pointWinnerScore );
		};
		var scoreAsString = addAComma(combinedScore);
		console.log('score as a string = ' + scoreAsString);
		// now update the score
		var updatedMatch = updateScores(currentMatch, scoreAsString, currentServer);		
	} else { // pointWinner had 30 or below and pointLoser had 0, must handle format separately
		if (serverWonPoint) {
			var combinedScore = ("" + pointWinnerScore + " " + pointLoserScore );
		} else {
			var combinedScore = ("" + pointLoserScore + " " + pointWinnerScore );
		};
		console.log('score as a string with a zero = ' + combinedScore);
		// now update the score	
		var updatedMatch = updateScores(currentMatch, combinedScore, currentServer);
	};
	console.log('Red Team game score after = ' + updatedMatch.data.MatchData.RedTeamGameScore);
	console.log('Blue Team game score after = ' + updatedMatch.data.MatchData.BlueTeamGameScore); 	
	speechText = constructScoreOutput(updatedMatch, currentServer);
	console.log('speechText = '	+ speechText);
	if (updatedMatch.data.MatchData.TimeOfFirstPoint == '0') {
		updatedMatch.data.MatchData.TimeOfFirstPoint = new Date().getTime();
		console.log('TimeOfFirstPoint = ' + updatedMatch.data.MatchData.TimeOfFirstPoint);
	};
	updatedMatch.data.MatchData.ScoreLastUpdated = new Date().getTime();
	console.log('ScoreLastUpdated = ' + updatedMatch.data.MatchData.ScoreLastUpdated);
	tellSpeechAndSave(speechText, updatedMatch, response);

	// makes all updates when a point is a game winner
	function pointWinnerWinsGame() { //when a game is won ****************************************************************************************
		console.log('entering pointWinnerWinsGame');

		// update the score of the current set whether it was a game win or a tiebreaker win
		pointWinnerSetScore++; // update the score of the current set (e.g. 3-4 or 7-6)
		if (pointWinner == 'red') { // red won the point so update the set scores
			currentMatch.data.MatchData.RedTeamSetScore = pointWinnerSetScore; // update the score of the current set (e.g. 3-4 or 7-6)
		} else { // blue won the point so update game and set scores
			currentMatch.data.MatchData.BlueTeamSetScore = pointWinnerSetScore; // update the score of the current set (e.g. 3-4 or 7-6)
		};			
						
		if (currentMatch.data.MatchData.Tiebreaker == true) { // in the case of a tiebreaker win ***********************************************
			if (currentMatch.data.MatchData.SuperTiebreaker == false) { // this was a 7 point tiebreaker to determine who wins a set
				speechText = '<break time=\"0.4s\" />Tiebreaker goes to the ' + pointWinner + ' team, ';				
			} else { // this was a 10 point super tiebreaker to determine who wins the match
				speechText = '<break time=\"0.4s\" />Super Tiebreaker goes to the ' + pointWinner + ' team, ';				
			}
			speechText += constructTiebreakerScoreOutput(currentMatch, pointWinner);
			speechText += '.';			
			if (pointWinner == 'red') { // update red stats
				currentMatch.data.MatchData.RedTiebreaksWon++;
			} else { // update blue stats
				currentMatch.data.MatchData.BlueTiebreaksWon++;
			};
			// a tiebreaker was just played, so must switch sides for next game. Set the flag for start of next game.			
			currentMatch.data.MatchData.SwitchSidesAfterTiebreak = true;
			console.log('currentMatch.data.MatchData.SwitchSidesAfterTiebreak = ' + currentMatch.data.MatchData.SwitchSidesAfterTiebreak);			

		} else { // in the case of a game win *************************************************************************************************
			// this was not a tiebreaker win, it was a game win, so update those stats and announce game winner
			if (currentMatch.data.MatchData.WhosServe == 'red') {
				currentMatch.data.MatchData.RedGamesServed++
			} else {
				currentMatch.data.MatchData.BlueGamesServed++
			};

			if (pointWinner == 'red') { // red won the point and the game so update stats
				currentMatch.data.MatchData.RedTeamTotalGamesWon++;
				if (currentMatch.data.MatchData.BreakPoint) { // it was a break point
					currentMatch.data.MatchData.RedBreakPointConversions++; 
				}
				if (currentMatch.data.MatchData.Deuce) { // it had been deuce previously in this game
					currentMatch.data.MatchData.GamesWonWithDeuce++; 
					currentMatch.data.MatchData.RedDeucePointsWon++; 
				}			
				if (serverWonPoint) {
					currentMatch.data.MatchData.RedGamesWonOnServe++;
				};
			} else { // blue won the point and the game so update stats
				currentMatch.data.MatchData.BlueTeamTotalGamesWon++;
				if (currentMatch.data.MatchData.BreakPoint) { // it was a break point
					currentMatch.data.MatchData.BlueBreakPointConversions++; 
				};	
				if (currentMatch.data.MatchData.Deuce) { // it had been deuce previously in this game
					currentMatch.data.MatchData.GamesWonWithDeuce++; 
					currentMatch.data.MatchData.BlueDeucePointsWon++; 
				}				
				if (serverWonPoint) {
					currentMatch.data.MatchData.BlueGamesWonOnServe++;
				};				
			};			
								
			if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
				speechText = 'Game, ' + pointWinner + ' team.';
			} else {
				speechText = 'Game, ' + pointWinner + '.';
			};
		};

		// check to see if pointWinner also wins the set	
		if ( 	(pointWinnerSetScore == 6 && pointLoserSetScore < 5) || 
				(pointWinnerSetScore == 7 && pointLoserSetScore < 6) ||
				(currentMatch.data.MatchData.Tiebreaker == true) ||
				(currentMatch.data.MatchData.SuperTiebreaker == true)		) { // pointWinner wins the set *****************************				

			pointWinnerSetsWon++; // increment the number of sets won for pointWinner
			
			if (pointWinner == 'red') { // update red sets won
				currentMatch.data.MatchData.RedTeamSetsWon = pointWinnerSetsWon;
			} else { // update blue sets won
				currentMatch.data.MatchData.BlueTeamSetsWon = pointWinnerSetsWon;
			};
						
			// set the tiebreak flags to false now that the tiebreak is finished and reset tiebreak scores to 0
			console.log('currentMatch.data.MatchData.Tiebreaker before = ' + currentMatch.data.MatchData.Tiebreaker);
			console.log('currentMatch.data.MatchData.SuperTiebreaker before = ' + currentMatch.data.MatchData.SuperTiebreaker);
			currentMatch.data.MatchData.Tiebreaker = false;
			currentMatch.data.MatchData.SuperTiebreaker = false;
			currentMatch.data.MatchData.TiebreakRedScore = 0;
			currentMatch.data.MatchData.TiebreakBlueScore = 0;
			console.log('currentMatch.data.MatchData.Tiebreaker after = ' + currentMatch.data.MatchData.Tiebreaker);
			console.log('currentMatch.data.MatchData.SuperTiebreaker after = ' + currentMatch.data.MatchData.SuperTiebreaker);
			
			updateSetXScoresParam(currentMatch); // update Set1Score, Set2Score or Set3Score
		
			speechText += '<break time=\"0.8s\" />';
			if (currentMatch.data.MatchData.Set == 1) {
				speechText += ' First ';					
			} else if (currentMatch.data.MatchData.Set == 2) {
				speechText += ' Second ';	
			} else if (currentMatch.data.MatchData.Set == 3) {
				speechText += ' Third ';	
			} else if (currentMatch.data.MatchData.Set == 4) {
				speechText += ' Fourth ';	
			} else if (currentMatch.data.MatchData.Set == 5) {
				speechText += ' Fifth ';	
			};				
			speechText += 'set goes to the ' + pointWinner + ' team, ';
			var formattedSetScore = formatSetScore(currentMatch.data.MatchData.Set, false, 'speech', currentMatch);
			speechText += formattedSetScore;
			
			// check to see if pointWinner also wins the match
			if (pointWinnerSetsWon == 2) { // pointWinner wins the match ****************************************************************
				speechText += '<break time=\"0.8s\" />'
				speechText += 'The match goes to the ' + pointWinner + ' team, ';
				
				if (currentMatch.data.MatchData.RedTeamSetsWon > currentMatch.data.MatchData.BlueTeamSetsWon) {
					var matchLeaderScore = currentMatch.data.MatchData.RedTeamSetsWon.toString();
					var otherTeamScore = currentMatch.data.MatchData.BlueTeamSetsWon.toString();
				} else {
					var matchLeaderScore = currentMatch.data.MatchData.BlueTeamSetsWon.toString();
					var otherTeamScore = currentMatch.data.MatchData.RedTeamSetsWon.toString();
				};							
				var formattedMatchScore = matchLeaderScore + ' sets to ' + otherTeamScore + '. <break time=\"0.4s\" />';						
																	
				speechText += formattedMatchScore;
				
				var counter = 4;
				console.log('counter before = ' + counter);
				var formatted3rdSetScore = formatSetScore(3, false, 'speech', currentMatch);
				var thirdSetScores = formatted3rdSetScore.split(" ");
				console.log('thirdSetScores[0] = ' + thirdSetScores[0]);
				console.log('thirdSetScores[2] = ' + thirdSetScores[2]);
				var noCommaThirdSetScore = thirdSetScores[2].split(""); // must remove comma in "0 to 0,"
				if (thirdSetScores[0] == '0' && noCommaThirdSetScore[0] == '0') { // the 3rd set wasn't played
					counter--;
					console.log('counter after = ' + counter);
				};
				
				var i;
				for (i = 1; i < counter; i++) { 
					console.log('i = ' + i);
					var formattedSetScore = formatSetScore(i, false, 'speech', currentMatch);
					if (i == 1) {
						speechText += 'First set, ';
					} else if (i == 2) {
						speechText += 'Second set, ';
					} else if (i == 3) {
						speechText += 'Third set, ';
					};						
					speechText += formattedSetScore;
					speechText += '<break time=\"0.3s\" />';
				};
									
				currentMatch.data.MatchData.MatchWinner = pointWinner;
				tellSpeechAndSave(speechText, currentMatch, response);						
				return; // *********************************** exit the loadMatch function **********************************
									
			} else { // the game was won, the set was won, but the match continues with a new set							
				currentMatch.data.MatchData.Set++;
				currentMatch.data.MatchData.RedTeamSetScore = 0;
				currentMatch.data.MatchData.BlueTeamSetScore = 0;
				speechText += '<break time=\"0.8s\" />Starting the ';
				speechText += currentMatch.data.MatchData.Set;
				if (currentMatch.data.MatchData.Set == 2) {
					speechText += 'nd set';	
				} else if (currentMatch.data.MatchData.Set == 3) {
					speechText += 'rd set';	
				} else if (currentMatch.data.MatchData.Set == 4) {
					speechText += 'th set';	
				} else if (currentMatch.data.MatchData.Set == 5) {
					speechText += 'th set';	
				};
				startNewGame(currentMatch, response);							
				return; // *********************************** exit the loadMatch function **********************************						
			};						
		}; 

		updateSetXScoresParam(currentMatch); // update Set1Score, Set2Score or Set3Score

		if ( (pointWinnerSetScore == 6 && pointLoserSetScore == 6) ) { // it is now time to go into a 7 point tiebreaker
			currentMatch.data.MatchData.Tiebreaker = true;
			speechText += ' The set is tied 6 all. Moving to a tiebreaker. ';
			playTiebreaker(currentMatch, response);	
			return;	
		} else {
			startNewGame(currentMatch, response); // the match continues with a new game, either in a new set or the old set
			return; // *********************************** exit the loadMatch function **********************************			
		};															
	};
	
	function playTiebreaker(currentMatch, response) {
		console.log('entering playTiebreaker function');
		
		var totalGamesPlayedInTieBreaker = 	currentMatch.data.MatchData.TiebreakRedScore + 
											currentMatch.data.MatchData.TiebreakBlueScore;
		
		var currentServer = currentMatch.data.MatchData.WhosServe;
				
		// see if someone wins the tiebreaker
		if (currentMatch.data.MatchData.SuperTiebreaker == false) { // this is a 7 point tiebreaker
			if ( Math.abs(currentMatch.data.MatchData.TiebreakRedScore - currentMatch.data.MatchData.TiebreakBlueScore) >= 2 &&
				 ( currentMatch.data.MatchData.TiebreakRedScore >=7 || currentMatch.data.MatchData.TiebreakBlueScore >=7) ) { // someone wins the tiebreaker
					speechText = constructTiebreakerScoreOutput(currentMatch, currentServer);
					pointWinnerWinsGame();
					return;
			};			
		} else { // this is a 10 point super tiebreaker
			if ( Math.abs(currentMatch.data.MatchData.TiebreakRedScore - currentMatch.data.MatchData.TiebreakBlueScore) >= 2 &&
				 ( currentMatch.data.MatchData.TiebreakRedScore >=10 || currentMatch.data.MatchData.TiebreakBlueScore >=10) ) { // someone wins the tiebreaker
					speechText = constructTiebreakerScoreOutput(currentMatch, currentServer);
					pointWinnerWinsGame();
					return;
			};			
		};
						
		// If this is a singles match, serve goes to the next team after the first point, and every odd point after
		if (currentMatch.data.MatchType == 'singles') {
			if (totalGamesPlayedInTieBreaker == 0 || isOdd(totalGamesPlayedInTieBreaker) ) {
				var priorServer = currentMatch.data.MatchData.WhosServe;
				if (priorServer == 'red') {
					currentServer = 'blue';			
				} else {
					currentServer = 'red';
				};		
				currentMatch.data.MatchData.WhosServe = currentServer;
				if (totalGamesPlayedInTieBreaker == 0) {
					// whichever team serves the first point of the tiebreak, the opponent’s side serves the first game of the new set,
					// so must set TiebreakFirstToServe for later use					
					currentMatch.data.MatchData.TiebreakFirstToServe = currentServer;
					speechText += '<break time=\"0.4s\" />It is ';
				} else {
					speechText = 'Now '; // this is the first thing to say
				}
				speechText += currentServer;
				speechText += ' team\'s serve. <break time=\"0.4s\" />';
				speechText += constructTiebreakerScoreOutput(currentMatch, currentServer);
			} else {
				speechText = constructTiebreakerScoreOutput(currentMatch, currentServer);
			};	

		// If this is a doubles match, serve goes to the next team/player in rotation after the first point, and every odd point after	
		} else if (currentMatch.data.MatchType == 'doubles') { 

			if (totalGamesPlayedInTieBreaker == 0 || isOdd(totalGamesPlayedInTieBreaker) ) {
				
				// figure out which team should now be serving
				var priorServer = currentMatch.data.MatchData.WhosServe;
				console.log('priorServer = ' + priorServer);
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
																
				if (totalGamesPlayedInTieBreaker == 0) {
					// whichever team serves the first point of the tiebreak, the opponent’s side serves the first game of the new set, 
					// so must set TiebreakFirstToServe for later use
					currentMatch.data.MatchData.TiebreakFirstToServe = currentMatch.data.MatchData.DoublesServer; 
					speechText += '<break time=\"0.4s\" />It is ';
				} else {
					speechText = 'Now '; // this is the first thing to say
				}
				if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
					speechText += currentMatch.data.MatchData.DoublesServer;
					speechText += '\'s serve on the ';
					speechText += currentServer;
					speechText += ' team.';
										
				} else {
					speechText += currentMatch.data.MatchData.DoublesServer;
					speechText += '\'s serve.';					
				}	
				speechText += constructTiebreakerScoreOutput(currentMatch, currentServer);
			} else {
				speechText = constructTiebreakerScoreOutput(currentMatch, currentServer);
			};
		};		
		
		// figure out if it is time to switch sides (every 6 points)	
		if ( timeToSwitchSides(totalGamesPlayedInTieBreaker) && currentMatch.data.MatchData.SwitchSides == true) {
			if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
				speechText += '<break time=\"0.5s\" />Time to switch sides.';
			} else {
				speechText += '<break time=\"0.5s\" />Switch sides.';
			};
		};

		tellSpeechAndSave(speechText, currentMatch, response);

		function isOdd(num) { // calculate whether a number is odd or even
			console.log('is odd = ' + num % 2);
			return num % 2;
		};			

		function timeToSwitchSides(num) {
			if (num == 0) {
				return false;
			} else {
				var realNum = num / 6;
				var timeToSwitch = Math.round(realNum) === realNum; // Will evaluate to true if the variable is evenly divisible by 6
				console.log('timeToSwitch = ' + timeToSwitch);
				return timeToSwitch; 				
			};
		};		
	};			
};

function updateSetXScoresParam(currentMatch) {
	console.log('entering updateSetXScoresParam function');	
	if (currentMatch.data.MatchData.RedTeamSetScore > currentMatch.data.MatchData.BlueTeamSetScore) {
		var gameLeaderScore = currentMatch.data.MatchData.RedTeamSetScore.toString();
		var otherTeamScore = currentMatch.data.MatchData.BlueTeamSetScore.toString();
		var gameLeader = ' Red Team';
	} else if (currentMatch.data.MatchData.RedTeamSetScore == currentMatch.data.MatchData.BlueTeamSetScore) {
		var gameLeaderScore = currentMatch.data.MatchData.RedTeamSetScore.toString();
		var otherTeamScore = currentMatch.data.MatchData.BlueTeamSetScore.toString();
		var gameLeader = '';
	} else {
		var gameLeaderScore = currentMatch.data.MatchData.BlueTeamSetScore.toString();
		var otherTeamScore = currentMatch.data.MatchData.RedTeamSetScore.toString();
		var gameLeader = ' Blue Team';
	};
	var formattedSetScore = gameLeaderScore + ' ' + otherTeamScore + gameLeader;
	
	if (currentMatch.data.MatchData.Set == 1) {
		currentMatch.data.MatchData.Set1Score = formattedSetScore;
		console.log('Set1Score = ' + currentMatch.data.MatchData.Set1Score);
	} else if (currentMatch.data.MatchData.Set == 2) {
		currentMatch.data.MatchData.Set2Score = formattedSetScore;
		console.log('Set2Score = ' + currentMatch.data.MatchData.Set2Score);
	} else if (currentMatch.data.MatchData.Set == 3) {
		currentMatch.data.MatchData.Set3Score = formattedSetScore;
		console.log('Set3Score = ' + currentMatch.data.MatchData.Set3Score);
	};		
};
		
function incrementPlayerGameScore(existingScore) {
	console.log('entering incrementPlayerGameScore function');
	if (existingScore == 0) {return 15}
	else if (existingScore == 15) {return 30}
	else if (existingScore == 30) {return 40}
	else {return 50};               
}; 	

function addAComma(inputStr) { // accepts a string like '3040' and adds a comma like '3,040' which Alexa hears when you say 30-40
	console.log('entering addAComma function');
	console.log('inputStr = ' + inputStr);
	var comboNumber = Number(inputStr);
	return comboNumber.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

function startNewGame(currentMatch, response) {
	console.log('entering startNewGame function');
	console.log('currentMatch.data.MatchData.SwitchSidesAfterTiebreak in startNewGame = ' + currentMatch.data.MatchData.SwitchSidesAfterTiebreak);
	var priorServer = currentMatch.data.MatchData.WhosServe;
	if (priorServer == 'red') {
		var currentServer = 'blue';		
	} else {
		var currentServer = 'red';
	};		
	currentMatch.data.MatchData.WhosServe = currentServer;
		
	if (currentMatch.data.MatchData.Set == 1) {
		var rawScores = currentMatch.data.MatchData.Set1Score.split(" ");				
	} else if (currentMatch.data.MatchData.Set == 2) {
		var rawScores = currentMatch.data.MatchData.Set2Score.split(" ");
	} else if (currentMatch.data.MatchData.Set == 3) {
		var rawScores = currentMatch.data.MatchData.Set3Score.split(" ");
	};

	speechText += '<break time=\"0.3s\" />'
	var setScoreToSay = rawScores[0] + ' to ' + rawScores[1] + ', ';
	if (rawScores[2]) { // if it isn't a tie (the word blue or red exists in the SetXScore) 
		if (currentMatch.data.MatchData.ExperiencedUserMode == false) { // e.g. 'blue team leads the set, 5 to 4'
			speechText += rawScores[2] + ' ' + rawScores[3]+ ' leads the set, ' + rawScores[0] + ' to ' + rawScores[1];
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
	
	if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
		speechText += '<break time=\"0.4s\" />Now starting a new game.';
	} else {
		speechText += '<break time=\"0.4s\" />New game, ';
	}
	
	// If this is a singles match, serve goes to the next team
	if (currentMatch.data.MatchType == 'singles') {
		if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
			speechText += '<break time=\"0.4s\" />It is ';
		};
		if (currentMatch.data.MatchData.TiebreakFirstToServe != "TBDServer") { // a tiebreak was just played previously, so
			// whichever team serves the first point of the tiebreak, the opponent’s side serves the first game of the new set.		
			if (currentMatch.data.MatchData.TiebreakFirstToServe == 'red') {
				currentMatch.data.MatchData.WhosServe = 'blue';
			} else {
				currentMatch.data.MatchData.WhosServe = 'red';
			};
			currentServer = currentMatch.data.MatchData.WhosServe;
			currentMatch.data.MatchData.TiebreakFirstToServe = "TBDServer" // reset the flag
		};
		speechText += currentServer;
		if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
			speechText += ' team\'s serve.';
		} else {
			speechText += ' serve.';
		};
		
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

	// figure out if it is time to switch sides
	if (currentMatch.data.MatchData.SwitchSidesAfterTiebreak == true) { // a tiebreak was just played, so must switch sides for this new game
		speechText += '<break time=\"0.5s\" />Time to switch sides.';
		console.log('currentMatch.data.MatchData.SwitchSidesAfterTiebreak before resetting = ' + currentMatch.data.MatchData.SwitchSidesAfterTiebreak);
		console.log('switched sides because tiebreak played previously');
		currentMatch.data.MatchData.SwitchSidesAfterTiebreak == false; // reset the flag
		console.log('currentMatch.data.MatchData.SwitchSidesAfterTiebreak after resetting = ' + currentMatch.data.MatchData.SwitchSidesAfterTiebreak);
	} else {
		var totalGamesPlayedInSet = currentMatch.data.MatchData.RedTeamSetScore + 
									currentMatch.data.MatchData.BlueTeamSetScore;
		console.log('totalGamesPlayedInSet = ' + totalGamesPlayedInSet);							
		if ( isOdd(totalGamesPlayedInSet) && currentMatch.data.MatchData.SwitchSides == true) {
			if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
				speechText += '<break time=\"0.5s\" />Time to switch sides.';
			} else {
				speechText += '<break time=\"0.5s\" />Switch sides.';
			};
		};		
	};
	
	function isOdd(num) {
		return num % 2;
	};	

	// reset the game scores to 0 for the new game
	currentMatch.data.MatchData.RedTeamGameScore = 0;	
	currentMatch.data.MatchData.BlueTeamGameScore = 0;
	currentMatch.data.MatchData.Deuce = false;
	currentMatch.data.MatchData.BreakPoint = false;
	tellSpeechAndSave(speechText, currentMatch, response);
};

function constructScoreOutput(currentMatch, currentServer) {
	console.log('entering constructScoreOutput function');
	//console.log('incoming currentMatch = ' + JSON.stringify(currentMatch, null, 2));
	//console.log('incoming currentServer = ' + currentServer);
	var speechOutput = ' ';
	if (currentServer == 'red') { 
		var scoreOutput = currentMatch.data.MatchData.RedTeamGameScore;
		scoreOutput += ' to ';
		scoreOutput += currentMatch.data.MatchData.BlueTeamGameScore;
		var tennisLingoSpeechOutput = useTennisLingo( currentMatch.data.MatchData.RedTeamGameScore, 
													  currentMatch.data.MatchData.BlueTeamGameScore,
													  currentMatch.data.MatchData.Deuce,
													  currentMatch.data.MatchData.PlayGamePoint );
		console.log('tennisLingoSpeechOutput = ' + tennisLingoSpeechOutput);											  
		if (tennisLingoSpeechOutput) {	
		scoreOutput = tennisLingoSpeechOutput;
		};
		speechOutput += scoreOutput;
		console.log('speechOutput = ' + speechOutput);
	} else {
		var scoreOutput = currentMatch.data.MatchData.BlueTeamGameScore;
		scoreOutput += ' to ';
		scoreOutput += currentMatch.data.MatchData.RedTeamGameScore;
		var tennisLingoSpeechOutput = useTennisLingo( currentMatch.data.MatchData.BlueTeamGameScore, 
													  currentMatch.data.MatchData.RedTeamGameScore,
													  currentMatch.data.MatchData.Deuce,
													  currentMatch.data.MatchData.PlayGamePoint );	
		console.log('tennisLingoSpeechOutput = ' + tennisLingoSpeechOutput);											  
		if (tennisLingoSpeechOutput) {	
		scoreOutput = tennisLingoSpeechOutput;
		};
		speechOutput += scoreOutput;
		console.log('speechOutput = ' + speechOutput);
	};
	return speechOutput;
};

function constructTiebreakerScoreOutput(currentMatch, currentServer) {
	console.log('entering constructTiebreakerScoreOutput function');
	var speechOutput = ' ';
	if (currentServer == 'red') { 
		var scoreOutput = currentMatch.data.MatchData.TiebreakRedScore;
		scoreOutput += ' to ';
		scoreOutput += currentMatch.data.MatchData.TiebreakBlueScore;
		speechOutput += scoreOutput;
		console.log('speechOutput = ' + speechOutput);
	} else {
		var scoreOutput = currentMatch.data.MatchData.TiebreakBlueScore;
		scoreOutput += ' to ';
		scoreOutput += currentMatch.data.MatchData.TiebreakRedScore;
		speechOutput += scoreOutput;
		console.log('speechOutput = ' + speechOutput);
	};
	return speechOutput;
};

function useTennisLingo( serverScore, receiverScore, deuceFlag, gamePointFlag ) {
	console.log('entering useTennisLingo function');	
	var tennisLingoSpeech = null;
	if (serverScore == 0 && receiverScore == 0) {
		tennisLingoSpeech = "love all";
	} else if (serverScore == 0 && receiverScore == 15) {
		tennisLingoSpeech = "love 15";
	} else if (serverScore == 0 && receiverScore == 30) {
		tennisLingoSpeech = "love 30";
	} else if (serverScore == 0 && receiverScore == 40) {
		tennisLingoSpeech = "love 40";
	} else if (serverScore == 15 && receiverScore == 0) {
		tennisLingoSpeech = "15 love";
	} else if (serverScore == 30 && receiverScore == 0) {
		tennisLingoSpeech = "30 love";
	} else if (serverScore == 40 && receiverScore == 0) {
		tennisLingoSpeech = "40 love";		
	} else if (serverScore == 15 && receiverScore == 15) {
		tennisLingoSpeech = "15 all";
	} else if (serverScore == 30 && receiverScore == 30) {
		tennisLingoSpeech = "30 all";
	} else if (serverScore == 40 && receiverScore == 40) {
		if (gamePointFlag == true) {
			tennisLingoSpeech = "game point";
		} else {
			tennisLingoSpeech = "deuce";
		};
	} else if (serverScore == 40 && receiverScore == 30 && deuceFlag == true) {
		tennisLingoSpeech = "add in";
	} else if (serverScore == 30 && receiverScore == 40 && deuceFlag == true) {
		tennisLingoSpeech = "add out";	
	};	
	return tennisLingoSpeech;
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
														
function updateScores(currentMatch, currentGameScore, currentServer) {
	console.log('entering updateScores function');
            
	// love all
	if (currentGameScore == 'love all' ||
		currentGameScore == 'zeroes' ||
		currentGameScore == 'love love' ||
		currentGameScore == 'zero zero' ||
		currentGameScore == '00') {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	};
	// 15 love
	if (currentGameScore == '15 love' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 15;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	} else if (currentGameScore == '15 love' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 15;
	};
	if (currentGameScore == '15 0' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 15;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	} else if (currentGameScore == '15 0' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 15;
	};	
	// 30 love
	if (currentGameScore == '30 love' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 30;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	} else if (currentGameScore == '30 love' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
	};
	if (currentGameScore == '30 0' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 30;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	} else if (currentGameScore == '30 0' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
	};
	// 40 love
	if (currentGameScore == '40 love' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	} else if (currentGameScore == '40 love' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;
	};
	if (currentGameScore == '40 0' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	} else if (currentGameScore == '40 0' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;
	};
	// love 15
	if (currentGameScore == 'love 15' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 15;
	} else if (currentGameScore == 'love 15' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 15;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	};
	if (currentGameScore == '0 15' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 15;
	} else if (currentGameScore == '0 15' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 15;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	};
	// love 30
	if (currentGameScore == 'love 30' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
	} else if (currentGameScore == 'love 30' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 30;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	};
	if (currentGameScore == '0 30' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
	} else if (currentGameScore == '0 30' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 30;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	};
	// love 40
	if (currentGameScore == 'love 40' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;
		currentMatch.data.MatchData.BreakPoint = true;
		currentMatch.data.MatchData.BreakPointsAgainstRed++;
	} else if (currentGameScore == 'love 40' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
		currentMatch.data.MatchData.BreakPoint = true;
		currentMatch.data.MatchData.BreakPointsAgainstBlue++;
	};
	if (currentGameScore == '0 40' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;
		currentMatch.data.MatchData.BreakPoint = true;
		currentMatch.data.MatchData.BreakPointsAgainstRed++;
	} else if (currentGameScore == '0 40' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
		currentMatch.data.MatchData.BreakPoint = true;
		currentMatch.data.MatchData.BreakPointsAgainstBlue++;
	};
	// 15 all
	if (currentGameScore == '15 all' ||
		currentGameScore == '1,515') {
		currentMatch.data.MatchData.RedTeamGameScore = 15;
		currentMatch.data.MatchData.BlueTeamGameScore = 15;
	};
	// 15 30
	if (currentGameScore == '1,530' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 15;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
	} else if (currentGameScore == '1,530' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 30;
		currentMatch.data.MatchData.BlueTeamGameScore = 15;
	};
	// 15 40
	if (currentGameScore == '1,540' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 15;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;
		currentMatch.data.MatchData.BreakPoint = true;
		currentMatch.data.MatchData.BreakPointsAgainstRed++;
	} else if (currentGameScore == '1,540' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 15;
		currentMatch.data.MatchData.BreakPoint = true;
		currentMatch.data.MatchData.BreakPointsAgainstBlue++;
	};
	// 30 15
	if (currentGameScore == '3,015' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 30;
		currentMatch.data.MatchData.BlueTeamGameScore = 15;
	} else if (currentGameScore == '3,015' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 15;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
	};
	// 40 15
	if (currentGameScore == '4,015' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 15;
	} else if (currentGameScore == '4,015' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 15;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;
	};
	// 30 all
	if (currentGameScore == '30 all' ||
		currentGameScore == '3,030') {
		currentMatch.data.MatchData.RedTeamGameScore = 30;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
	};
	// 30 40
	if (currentGameScore == '3,040' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 30;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;
		currentMatch.data.MatchData.BreakPoint = true;
		currentMatch.data.MatchData.BreakPointsAgainstRed++;
	} else if (currentGameScore == '3,040' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
		currentMatch.data.MatchData.BreakPoint = true;
		currentMatch.data.MatchData.BreakPointsAgainstBlue++;
	};
	// 40 30
	if (currentGameScore == '4,030' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
	} else if (currentGameScore == '4,030' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 30;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;
	};
	// 40 all
	if (currentGameScore == '40 all' ||
		currentGameScore == '4,040' ||
		currentGameScore == 'deuce' ||
		currentGameScore == 'game point') {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;		
		if (currentMatch.data.MatchData.PlayGamePoint == true) {
			currentMatch.data.MatchData.GamePoints++;
		} else {
			currentMatch.data.MatchData.Deuce = true;
		};		
	};
	// add in
	if (currentGameScore == 'add in' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
	} else if (currentGameScore == 'add in' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 30;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;
	};     
	// add out
	if (currentGameScore == 'add out' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 30;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;
	} else if (currentGameScore == 'add out' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
	};	

	return currentMatch;
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
			elapsedTimeString += 's ';
		} else {
			elapsedTimeString += ' ';
		}			
	};
	
	if (speechOrText == 'text') {
		elapsedTimeString += minutes + ' min';
	} else { // speechOrText = 'speech'
		elapsedTimeString += 'and ' + minutes + ' minute'
	};
	if (minutes > 1) {
		elapsedTimeString += 's ';
	};	
	
	var matchElapsedTime = {};	
	matchElapsedTime.hours = hours;
	matchElapsedTime.minutes = minutes;
	matchElapsedTime.elapsedTimeString = elapsedTimeString;

	return matchElapsedTime;	
};

function setTeamSummaryStats(rawStats, teamToReport) {
	//console.log('rawStats input to setTeamSummaryStats = ' + JSON.stringify(rawStats));
	
	var stats = {};
	
	var totalGamesPlayed = rawStats.RedTeamTotalGamesWon + rawStats.BlueTeamTotalGamesWon;
	var totalPointsPlayed = rawStats.RedTeamTotalPointsWon + rawStats.BlueTeamTotalPointsWon;

	stats.GamePoints = rawStats.GamePoints;	
	
	if (teamToReport == 'red') {
		
		stats.PercentGamesWon = ((rawStats.RedTeamTotalGamesWon / totalGamesPlayed) * 100).toFixed(0);		
		stats.PercentPointsWon = ((rawStats.RedTeamTotalPointsWon / totalPointsPlayed) * 100).toFixed(0);
		stats.PercentGamesWonOnServe = ((rawStats.RedGamesWonOnServe / rawStats.RedGamesServed) * 100).toFixed(0);		
		stats.PercentPointsWonOnServe = ((rawStats.RedPointsWonOnServe / rawStats.RedPointsServed) * 100).toFixed(0);
		stats.PercentBreakPointConversions = ((rawStats.RedBreakPointConversions / rawStats.BreakPointsAgainstBlue) * 100).toFixed(0);	
		stats.PercentBreakPointsSaved = ((rawStats.RedBreakPointsSaved / rawStats.BreakPointsAgainstRed) * 100).toFixed(0);		
		stats.PercentGamePointConversions = ((rawStats.RedGamePointsWon / rawStats.GamePoints) * 100).toFixed(0);	
		
		stats.PointsServed = rawStats.RedPointsServed;
		stats.GamesServed = rawStats.RedGamesServed;
		stats.BreakPointConversions = rawStats.RedBreakPointConversions;
		stats.BreakPointsAgainstOpponent = rawStats.BreakPointsAgainstBlue;
		stats.BreakPointsSaved = rawStats.RedBreakPointsSaved;
		stats.BreakPointAgainstSelf = rawStats.BreakPointsAgainstRed;
		stats.GamePointsWon = rawStats.RedGamePointsWon;
		stats.DeucePointsWon = rawStats.RedDeucePointsWon;
		stats.PointStreak = rawStats.MaxRedPointStreak;		
		
	} else if (teamToReport == 'blue') { // teamToReport = blue
	
		stats.PercentGamesWon = ((rawStats.BlueTeamTotalGamesWon / totalGamesPlayed) * 100).toFixed(0);
		stats.PercentPointsWon = ((rawStats.BlueTeamTotalPointsWon / totalPointsPlayed) * 100).toFixed(0);	
		stats.PercentGamesWonOnServe = ((rawStats.BlueGamesWonOnServe / rawStats.BlueGamesServed) * 100).toFixed(0);
		stats.PercentPointsWonOnServe = ((rawStats.BluePointsWonOnServe / rawStats.BluePointsServed) * 100).toFixed(0);
		stats.PercentBreakPointConversions = ((rawStats.BlueBreakPointConversions / rawStats.BreakPointsAgainstRed) * 100).toFixed(0);	
		stats.PercentBreakPointsSaved = ((rawStats.BlueBreakPointsSaved / rawStats.BreakPointsAgainstBlue) * 100).toFixed(0);		
		stats.PercentGamePointConversions = ((rawStats.BlueGamePointsWon / rawStats.GamePoints) * 100).toFixed(0);	
		
		stats.PointsServed = rawStats.BluePointsServed;
		stats.GamesServed = rawStats.BlueGamesServed;
		stats.BreakPointConversions = rawStats.BlueBreakPointConversions;		
		stats.BreakPointsAgainstOpponent = rawStats.BreakPointsAgainstRed;
		stats.BreakPointsSaved = rawStats.BlueBreakPointsSaved;
		stats.BreakPointAgainstSelf = rawStats.BreakPointsAgainstBlue;
		stats.GamePointsWon = rawStats.BlueGamePointsWon;
		stats.DeucePointsWon = rawStats.BlueDeucePointsWon;
		stats.PointStreak = rawStats.MaxBluePointStreak;

	} else if (teamToReport == 'singlesPlayerHistory') {
		
		stats.numberOfMatches = rawStats.numberOfMatches;
		
		stats.PercentGamesWon = ((rawStats.singlesPlayerTotalGamesWon / rawStats.totalGamesPlayed) * 100).toFixed(0);		
		stats.PercentPointsWon = ((rawStats.singlesPlayerTotalPointsWon / rawStats.totalPointsPlayed) * 100).toFixed(0);
		stats.PercentGamesWonOnServe = ((rawStats.singlesPlayerGamesWonOnServe / rawStats.singlesPlayerGamesServed) * 100).toFixed(0);		
		stats.PercentPointsWonOnServe = ((rawStats.singlesPlayerPointsWonOnServe / rawStats.singlesPlayerPointsServed) * 100).toFixed(0);
		stats.PercentBreakPointConversions = ((rawStats.singlesPlayerBreakPointConversions / rawStats.BreakPointsAgainstOpponent) * 100).toFixed(0);	
		stats.PercentBreakPointsSaved = ((rawStats.singlesPlayerBreakPointsSaved / rawStats.BreakPointsAgainstSelf) * 100).toFixed(0);		
		stats.PercentGamePointConversions = ((rawStats.singlesPlayerGamePointsWon / rawStats.GamePoints) * 100).toFixed(0);	
		
		stats.PointsServed = rawStats.singlesPlayerPointsServed;
		stats.GamesServed = rawStats.singlesPlayerGamesServed;
		stats.BreakPointConversions = rawStats.singlesPlayerBreakPointConversions;
		stats.BreakPointsAgainstOpponent = rawStats.BreakPointsAgainstOpponent;
		stats.BreakPointsSaved = rawStats.singlesPlayerBreakPointsSaved;
		stats.BreakPointAgainstSelf = rawStats.BreakPointsAgainstSelf;
		stats.GamePointsWon = rawStats.singlesPlayerGamePointsWon;
		stats.DeucePointsWon = rawStats.singlesPlayerDeucePointsWon;
		stats.PointStreak = rawStats.maxSinglesPlayerPointStreak;			
	}
	
	return stats;
};

function createSpeechSummaryForTeam (currentMatch, teamToReport) {
	console.log('entering createSpeechSummaryForTeam function');
	
	var rawStats = currentMatch.data.MatchData;	
	var currentMatchStats = setTeamSummaryStats(rawStats, teamToReport) // set whether we are reporting for red or blue
							
	// Open the summary with 'Red team player,' or 'Blue team player,'
	speechText = '<break time=\"0.3s\" />' + teamToReport;
	speechText += ' team';
	if (currentMatch.data.MatchType == 'singles') {
		speechText += ' player, ';
	} else {
		speechText += ', ';
	};
	// percent of games won
	if ( !(isNaN(currentMatchStats.PercentGamesWon)) ) {
		speechText += 'you won ';
		speechText += currentMatchStats.PercentGamesWon;				
		speechText += ' percent of the games, <break time=\"0.2s\" />';
	};

	// percent of points won
	speechText += 'compared to ';
	speechText += currentMatchStats.PercentPointsWon;
	speechText += ' percent of the overall points.';	

	
	if (currentMatchStats.PointsServed != 0) {
		if (currentMatchStats.GamesServed != 0) {
			
			// percent of games won serving
			speechText += '<break time=\"0.3s\" />. You won ';
			speechText += currentMatchStats.PercentGamesWonOnServe;
			speechText += ' percent of the games when you were serving, compared to ';
		} else {
			speechText += '<break time=\"0.3s\" />. You won ';
		};
		
		// percent of points won serving
		speechText += currentMatchStats.PercentPointsWonOnServe;
		speechText += ' percent of the points.';
	} else {
		speechText += '<break time=\"0.3s\" /> You haven\'t yet served in this match.';
	};

	// break point conversions
	if (currentMatchStats.BreakPointsAgainstOpponent != 0) {
		speechText += '<break time=\"0.3s\" />. Your break point conversion was ';
		speechText += currentMatchStats.PercentBreakPointConversions;
		speechText += ' percent, or ';
		speechText += currentMatchStats.BreakPointConversions + ' out of ' + currentMatchStats.BreakPointsAgainstOpponent;
	};

	// break points saved
	if (currentMatchStats.BreakPointAgainstSelf != 0) {
		speechText += '<break time=\"0.3s\" />. You saved ';
		speechText += currentMatchStats.PercentBreakPointsSaved;
		speechText += ' percent of break points against you, or '
		speechText += currentMatchStats.BreakPointsSaved + ' out of ' + currentMatchStats.BreakPointAgainstSelf + '. <break time=\"0.3s\" />';
	};

	// game points won
	if (currentMatch.data.MatchData.PlayGamePoint) { // if the match was played with game point
		// game point conversions
		if (currentMatch.data.MatchData.GamePoints != 0) {
			speechText += '<break time=\"0.3s\" /> Your game point conversion was ';
			speechText += currentMatchStats.PercentGamePointConversions;
			speechText += ' percent, or ';
			speechText += currentMatchStats.GamePointsWon + ' out of ' + currentMatch.data.MatchData.GamePoints;						
		};


	// deuce points ultimately won
	} else { // the match was played with deuce points
		// deuce point conversions
		if (currentMatch.data.MatchData.GamePoints != 0) {
			speechText += '<break time=\"0.3s\" />. Your deuce point conversion was ';
			speechText += currentMatchStats.PercentDeucePointConversions;
			speechText += ' percent, or ';
			speechText += currentMatchStats.DeucePointsWon + ' out of ' + currentMatch.data.MatchData.GamesWonWithDeuce;						
		};						
	};	

	// point streak
	speechText += '. <break time=\"0.3s\" />Your longest point streak of the match was ';
	speechText += currentMatchStats.PointStreak;
	speechText += ' points.';
			
	return (speechText);
};

function createSpeechSummaryForMatch (currentMatch) {
	console.log('entering createMatchSummaryContent function');
	
	var matchTimeSpeech = getMatchElapsedTime(currentMatch, 'speech');						
	var matchScoreSpeech = formatMatchScore(currentMatch, 'speech'); // e.g. '1-0, Blue Team' indicating blue team leads 1 set to zero

	speechText = ''; //reset
	
	// winner of the match as applicable
	if (currentMatch.data.MatchData.MatchWinner != 'TBDWinner') {
		speechText += '<break time=\"0.3s\" /> ';
		speechText += currentMatch.data.MatchData.MatchWinner
		speechText += ' team won the match. <break time=\"0.3s\" />';
		var matchIsOver = true;
	};

	// score of the match
	if (currentMatch.data.MatchData.RedTeamSetsWon == 0 && currentMatch.data.MatchData.BlueTeamSetsWon == 0) {
		speechText += 'the match is still tied at love love'; 
	} else if (currentMatch.data.MatchData.RedTeamSetsWon == 1 && currentMatch.data.MatchData.BlueTeamSetsWon == 1) {
		speechText += 'the match is tied at one set each';
	} else if (!matchIsOver) {
		speechText += 'The score of the match is: ';
		speechText += '<break time=\"0.1s\" />';
		speechText += matchScoreSpeech;				
	};			

	// score of each set as applicable
	if (currentMatch.data.MatchData.Set >= 1) { // say the first set score
		var formattedSetScore = formatSetScore(1, true, 'speech', currentMatch);	
		speechText += '<break time=\"0.3s\" />First set: ' + formattedSetScore;				
	};
	if (currentMatch.data.MatchData.Set >= 2) { // if 2nd set is in progress or finished, say the 2nd set score
		var formattedSetScore = formatSetScore(2, true, 'speech', currentMatch);	
		speechText += '<break time=\"0.3s\" />Second set: ' + formattedSetScore;
	};
	if (currentMatch.data.MatchData.Set >= 3) { // if 3rd set is in progress or finished, say the 3rd set score
		var formattedSetScore = formatSetScore(3, true, 'speech', currentMatch);	
		speechText += '<break time=\"0.3s\" />Third set: ' + formattedSetScore;
	};
	
	// elapsed time of the match
	speechText += '<break time=\"0.2s\" />. You have played for ' + matchTimeSpeech.elapsedTimeString;	
							
	if (matchTimeSpeech.hours < 1 && matchTimeSpeech.minutes < 1) { // stop here if less than one minute has been played 
		speechText += ', there are no meaningful statistics to report yet.';
		return speechText; // *******************************************************************************************
	};
		
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

function createTextSummaryForTeam (currentMatch, teamToReport) {
	console.log('entering createMatchSummaryContent function');
	
	var rawStats = currentMatch.data.MatchData;	
	var currentMatchStats = setTeamSummaryStats(rawStats, teamToReport) // set whether we are reporting for red or blue
	
	// percent of games won
	if ( !(isNaN(currentMatchStats.PercentGamesWon)) ) {
		var teamStats = currentMatchStats.PercentGamesWon + '% of games' + "\n";
	};	
	
	// percent of points won
	teamStats += currentMatchStats.PercentPointsWon + '% of points' + "\n";

	// percent of points won serving
	if (currentMatchStats.PointsServed != 0) {
		teamStats += currentMatchStats.PercentPointsWonOnServe + '% of points on serve' + "\n";		
	} else {
		teamStats += '% of points serving: NA' + "\n";
	};
	
	// percent of games won serving
	if (currentMatchStats.GamesServed != 0) {
		teamStats += currentMatchStats.PercentGamesWonOnServe + '% of games on serve' + "\n";
	} else {
		teamStats += '% of games serving: NA' + "\n";
	};	

	// break point conversions
	teamStats += 'Break point conv: ' + currentMatchStats.PercentBreakPointConversions + '%';
	teamStats += ' (' + currentMatchStats.BreakPointConversions + '/' + currentMatchStats.BreakPointsAgainstOpponent + ')' + "\n";	
	
	// break points saved
	teamStats += 'Break points saved: ' + currentMatchStats.PercentBreakPointsSaved + '%'
	teamStats += ' (' + currentMatchStats.BreakPointsSaved + '/' + currentMatchStats.BreakPointAgainstSelf + ')' + "\n";	

	// game points won
	if (currentMatch.data.MatchData.PlayGamePoint) { // if the match was played with game point
		// game point conversions
		teamStats += 'Game point conv: ' + currentMatchStats.PercentGamePointConversions + '%';
		teamStats += ' (' + currentMatchStats.GamePointsWon + '/' + currentMatch.data.MatchData.GamePoints + ')' + "\n";

	// deuce points ultimately won
	} else { // the match was played with deuce points
		// deuce point conversions
		teamStats += 'Deuce point conv: ' + currentMatchStats.PercentDeucePointConversions + '%';
		teamStats += ' (' + currentMatchStats.DeucePointsWon + '/' + currentMatch.data.MatchData.GamesWonWithDeuce + ')' + "\n";				
	};

	// point streak
	teamStats += 'Max point streak: ' + currentMatchStats.PointStreak + ' pts' + "\n";
	
	return teamStats;
};

function createTextSummaryForMatch (currentMatch) {
	console.log('entering createMatchSummaryContent function');

	var redStats = createTextSummaryForTeam (currentMatch, 'red');
	var blueStats = createTextSummaryForTeam (currentMatch, 'blue');
	var today = new Date();
	var	dateString = (today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear().toString().substr(2,2);	// e.g. '3/14/16'
	var matchTimeText = getMatchElapsedTime(currentMatch, 'text');
	var totalGamesPlayed = currentMatch.data.MatchData.RedTeamTotalGamesWon + currentMatch.data.MatchData.BlueTeamTotalGamesWon;
	var totalPointsPlayed = currentMatch.data.MatchData.RedTeamTotalPointsWon + currentMatch.data.MatchData.BlueTeamTotalPointsWon;	
	
	var cardTitle = dateString + ' Match Stats';

	// opening: e.g. 'singles match, 2-1, blue team'
	var cardContent = currentMatch.data.MatchType + ' match, ' + formatMatchScore(currentMatch, 'text') + "\n";;	
	if (currentMatch.data.MatchData.MatchWinner != 'TBDWinner') {
		cardContent += ', ' + currentMatch.data.MatchData.MatchWinner + ' team' + "\n";
	};
	
	cardContent += 'Time played: ' + matchTimeText.elapsedTimeString + "\n";		
	cardContent += 'Set 1: ' + formatSetScore(1, true, 'text', currentMatch);
	cardContent += 'Set 2: ' + formatSetScore(2, true, 'text', currentMatch); 
	cardContent += 'Set 3: ' + formatSetScore(3, true, 'text', currentMatch);
	cardContent += 'Games played: ' + totalGamesPlayed + "\n";
	cardContent += 'Points played: ' + totalPointsPlayed + 'SPLIT'
	cardContent += 'Red Team won: ' + "\n";
	cardContent += redStats + 'SPLIT';
	cardContent += 'Blue Team won: ' + "\n";
	cardContent += blueStats
	
	var fullText = "\n" + cardTitle + "\n" + "\n" + cardContent;		
	var splitTextArray = fullText.split("SPLIT");
	
	var textToSend = [];
	textToSend[0] = splitTextArray[0];
	textToSend[1] = splitTextArray[1];
	textToSend[2] = splitTextArray[2];
	
	var textSummaryContent = {
		cardTitle: cardTitle,
		cardContent: cardContent,
		textToSend: textToSend
	};
	
	console.log('textToSend[0] = ' + textSummaryContent.textToSend[0]);
	console.log('textToSend[1] = ' + textSummaryContent.textToSend[1]);
	console.log('textToSend[2] = ' + textSummaryContent.textToSend[2]);
	
	console.log('textSummaryContent = ' + JSON.stringify(textSummaryContent) );
	
	return textSummaryContent;
};

function initializeSNSforPlayer(session, response) {
	// sets up the SNS Topic that will be used to subscribe a player to for ongoing notification from this skill
	console.log('entering initializeSNSforPlayer');
	console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey)
	playerStorage.loadPlayer(session, function (newLoadedPlayer) {
		console.log('newLoadedPlayer = ' + JSON.stringify(newLoadedPlayer) );
		if (newLoadedPlayer == 'playerNotFound') {
			speechText = 'I could not find a registered player with that phone number. ';
			speechText += 'Please try again, and say: send a confirmation text to <break time=\"0.2s\" />and then your phone number.';
			var repromptTextToSay = 'Say, send a confirmation text to <break time=\"0.2s\" />and then your phone number.';
			console.log('repromptTextToSay = ' + repromptTextToSay);
			askSpeech(speechText, repromptTextToSay, response);
			return;
		}
		playerSMS.sendTopicSubscribeRequest(newLoadedPlayer.data.Phone, function (topicArn) {
			if (!topicArn) {
				speechText = 'Hmm, there was a problem getting that set up. Please try again later.';				
			} else { // successfully created Topic ARN and sent the subscription request
				console.log('newLoadedPlayer.data.TopicARN = ' + newLoadedPlayer.data.TopicARN);
				newLoadedPlayer.data.TopicARN = topicArn;
				speechText = 'Text sent. Once you reply, you\'ll be set up to receive match summaries via text when you ask for them.';
			};	
			newLoadedPlayer.save(session, function () {
				response.tell(speechText);	
			});									
        });			
    });
};

function buildHistoryText(session, currentMatch, rawHistStats) {
	console.log('entering buildHistoryText');
	console.log('rawHistStats = ' + JSON.stringify(rawHistStats) );
	var higherOrLower;
	var rawStats = currentMatch.data.MatchData;	
	var currentMatchStats = setTeamSummaryStats(rawStats, session.attributes.summaryForTeam) // set whether we are reporting for red or blue
	console.log('currentMatchStats = ' + JSON.stringify(currentMatchStats) );
	var histStats = setTeamSummaryStats(rawHistStats, 'singlesPlayerHistory') // set to reporting for singles player history
	console.log('histStats = ' + JSON.stringify(histStats) );
	var histSpeechText = '';
	
	if (histStats.numberOfMatches < 1) {
			histSpeechText += '<break time=\"0.3s\" /> This was the only match that I have record of for you. ';
			histSpeechText += 'To hear how your play compares to your historical averages, sign in before a match. ';

	} else {
		
		if (currentMatchStats.GamesServed != 0) {
			
			// percent of games won serving	
			console.log('histStats.PercentGamesWonOnServe = ' + histStats.PercentGamesWonOnServe);
			console.log('currentMatchStats.PercentGamesWonOnServe = ' + currentMatchStats.PercentGamesWonOnServe);
			
			var diffPercentGamesWonOnServe = currentMatchStats.PercentGamesWonOnServe - histStats.PercentGamesWonOnServe;
			if (diffPercentGamesWonOnServe >= 0 ) {
				higherOrLower = 'higher';
			} else {
				higherOrLower = 'lower';
				diffPercentGamesWonOnServe = Math.abs(diffPercentGamesWonOnServe);
			};
		
			histSpeechText += '<break time=\"0.3s\" /> Your games won on serve statistic was ';
			histSpeechText += diffPercentGamesWonOnServe;
			histSpeechText += ' percent ' + higherOrLower + ' than your historical average.';
		}

		if (currentMatchStats.BreakPointsAgainstOpponent != 0) {
			
			// percent break point conversions
			var diffPercentBreakPointConversions = currentMatchStats.PercentBreakPointConversions - histStats.PercentBreakPointConversions;
			if (diffPercentGamesWonOnServe >= 0 ) {
				higherOrLower = 'higher';
			} else {
				higherOrLower = 'lower';
				diffPercentBreakPointConversions = Math.abs(diffPercentBreakPointConversions);
			};
			
			histSpeechText += '<break time=\"0.3s\" />. Your break point conversions were ';
			histSpeechText += diffPercentBreakPointConversions;
			histSpeechText += ' percent ' + higherOrLower + ' than your historical average.';
		}						

		if (currentMatchStats.BreakPointAgainstSelf != 0) {
			
			// percent break points saved
			console.log('histStats.PercentBreakPointsSaved = ' + histStats.PercentBreakPointsSaved);
			console.log('currentMatchStats.PercentBreakPointsSaved = ' + currentMatchStats.PercentBreakPointsSaved);
			var diffPercentBreakPointsSaved = currentMatchStats.PercentBreakPointsSaved - histStats.PercentBreakPointsSaved;
			if (diffPercentBreakPointsSaved >= 0 ) {
				higherOrLower = 'higher';
			} else {
				higherOrLower = 'lower';
				diffPercentBreakPointsSaved = Math.abs(diffPercentBreakPointsSaved);
			};
			
			histSpeechText += '<break time=\"0.3s\" />. The number of break points you saved was ';
			histSpeechText += diffPercentBreakPointsSaved;
			histSpeechText += ' percent ' + higherOrLower + ' than your historical average.';
		}

		if (currentMatchStats.GamePoints != 0) {
			
			// percent game points won
			var diffPercentGamePointConversions = currentMatchStats.PercentGamePointConversions - histStats.PercentGamePointConversions;
			if (diffPercentGamePointConversions >= 0 ) {
				higherOrLower = 'higher';
			} else {
				higherOrLower = 'lower';
				diffPercentGamePointConversions = Math.abs(diffPercentGamePointConversions);
			};
			
			histSpeechText += '<break time=\"0.3s\" />. The number of games points you won was ';
			histSpeechText += diffPercentGamePointConversions;
			histSpeechText += ' percent ' + higherOrLower + ' than your historical average.';
		}		
		
		histSpeechText += '<break time=\"0.5s\" /> You can say, continue with ' + session.attributes.opposingTeam + ' team. Or, ';	
		histSpeechText += '<break time=\"0.3s\" /> to text these results to players that are signed in, say, text the summary.';
		console.log('speechSummaryForTeam = ' + JSON.stringify(histSpeechText) );	
		
	};
	
	return histSpeechText; 	
}

function createTeamSummary(session, response) {
	console.log('entering createSinglesSummary');		
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
		
		// build text for either the red or blue stats on the current match				
		var speechText = createSpeechSummaryForTeam (currentMatch, session.attributes.summaryForTeam);
		
		if (currentMatch.data.MatchType = 'singles') {			
			// pull stats from all matches in which this player has played
			console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey)
			singlesPlayerHistory.getSinglesPlayerHistory(session, function (rawHistStats) {
				var histSpeechToAdd = buildHistoryText(session, currentMatch, rawHistStats);			
				speechText += histSpeechToAdd;					
				var repromptTextToSay = 'Say, continue with ' + session.attributes.summaryForTeam + ' team, text the summary, or all done.';
				askSpeech(speechText, repromptTextToSay, response);															
			});			
		} else {
			// pull stats from all matches in which this doubles team has played together
			console.log('session.attributes.player2PhoneKey = ' + session.attributes.player1PhoneKey);
			console.log('session.attributes.player2PhoneKey = ' + session.attributes.player2PhoneKey);
			doublesTeamHistory.getDoublesTeamHistory(session, function (rawHistStats) {
				var histSpeechToAdd = buildHistoryText(session, currentMatch, rawHistStats);			
				speechText += histSpeechToAdd;					
				var repromptTextToSay = 'Say, continue with ' + session.attributes.opposingTeam + ' team, text the summary, or all done.';
				askSpeech(speechText, repromptTextToSay, response);	
			});					
		};
	});		
};
	
var registerIntentHandlers = function (intentHandlers, skillContext) {

	intentHandlers.OneShotNewMatchIntent = function (intent, session, response) {
		// Handles intent to start a match with a single input from the user, but 
		// will re-direct to a dialog if singles/doubles is not specified or if who has the first serve is not provided 
		console.log('entering OneShotNewMatchIntent');
		// first fill in either session.attribute that we can
		// Determine who has the first serve
		var teamServing = getServeFromIntent(intent);
		if (!teamServing.error) { 
			session.attributes.firstToServe = teamServing.color; 
			console.log('session.attributes.firstToServe = ' + session.attributes.firstToServe);
		};
		if (intent.slots.SinglesOrDoubles.value) {
			session.attributes.singlesOrDoubles = intent.slots.SinglesOrDoubles.value;
			console.log('session.attributes.singlesOrDoubles = ' + session.attributes.singlesOrDoubles);
		};		
		
		handleOneshotNewMatchRequest(intent, session, response);
		/**
		 * This handles the one-shot interaction, where the user utters a phrase like:
		 * 'Alexa, use Keeper and start a singles match with blue team serve'.
		 * If a slot is undefined or there is an error in a slot, this will guide the user to the dialog approach.
		 */
		function handleOneshotNewMatchRequest(intent, session, response) {
			console.log('entering handleOneshotNewMatchRequest');
			// Get the match type and who serves first if either are unknown
			
			// Ask for the match type if unknown, singles or doubles.
			if (!intent.slots.SinglesOrDoubles.value) {
				// Didn't get the match type. Move to dialog approach.				
				var textToSay = 'OK. Are you playing singles or doubles?';
				var repromptTextToSay = 'Will this be a singles match or a doubles match?';
				askSpeech(textToSay, repromptTextToSay, response);
				return;
			};						
			
			// Ask who has the first serve if unknown
			if (teamServing.error) {
				// Didn't get who is serving first. Move to dialog approach
				var textToSay = 'OK. Who is serving first? Please say<break time=\"0.2s\" /> red serve, or <break time=\"0.2s\" /> blue serve'; 
				var repromptTextToSay = 'Please say<break time=\"0.2s\" /> red serve, or <break time=\"0.2s\" /> blue serve';
				askSpeech(textToSay, repromptTextToSay, response);
				return;
			};
				
			// Both slots filled and corresponding session variables set, so move to final fulfillAddPlayer
			fulfillNewMatch(session, response);
		};		

		/**
		 * Gets who has first serve from the intent, or returns an error
		 */
		function getServeFromIntent(intent) {
			console.log('entering getServeFromIntent');
			var firstToServeSlot = intent.slots.TeamServing;
			// slots can be missing, or slots can be provided but with empty value.
			// must test for both.
			if (!firstToServeSlot || !firstToServeSlot.value) {
				console.log('user did not specify who is serving first');
				return { error: true }    
			} else {
				var colorIn = firstToServeSlot.value;	
				var color = setColor(colorIn);
								
				return { color: color };			
			};
		};				
    };

    intentHandlers.NewMatchDialogIntent = function (intent, session, response) {
		// Handles intent to add a player via an interactive dialog to get the player's 
		// phone number and which team to assign them to 
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
			// if we don't know who should serve first, ask the question. If we know who is serving, move on to start the match
			if (session.attributes.firstToServe) {
				session.attributes.singlesOrDoubles = intent.slots.SinglesOrDoubles.value;
				fulfillNewMatch(session, response);
			} else {
				// set match type in session and prompt for who is serving first
				session.attributes.singlesOrDoubles = intent.slots.SinglesOrDoubles.value;
				var textToSay = 'OK. Who is serving first? Please say<break time=\"0.2s\" /> red serve, or <break time=\"0.2s\" /> blue serve'; 
				var repromptTextToSay = 'Please say<break time=\"0.2s\" /> red serve, or <break time=\"0.2s\" /> blue serve';
				askSpeech(textToSay, repromptTextToSay, response);
			};
		};		
		
		/**
		 * Handles the dialog step where the user provides a team that the player should be assigned to
		 */
		function handleFirstToServeProvidedDialogRequest(intent, session, response) {
			console.log('entering handleFirstToServeProvidedDialogRequest');

			// set firstToServe in session and simplify the designation to either 'red' or 'blue'
			session.attributes.firstToServe = intent.slots.TeamServing.value;
			if (intent.slots.TeamServing.value == 'red serve') { session.attributes.firstToServe = 'red' };
			if (intent.slots.TeamServing.value == 'blue serve') { session.attributes.firstToServe = 'blue' };

			// if we don't know if it will be a singles or doubles match yet, go ask. If we know the match type, move on to start the match			
			if (session.attributes.singlesOrDoubles) {
				fulfillNewMatch(session, response);
			} else {
				// prompt for match type
				var textToSay = 'OK. Are you playing singles or doubles?';
				var repromptTextToSay = 'Will this be a singles match or a doubles match?';
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
			if (session.attributes.singlesOrDoubles) {
				// get who is serving first re-prompt
				var textToSay = 'OK. Who is serving first? Please say<break time=\"0.2s\" /> red serve, or <break time=\"0.2s\" /> blue serve'; 
				var repromptTextToSay = 'Please say<break time=\"0.2s\" /> red serve, or <break time=\"0.2s\" /> blue serve';
				askSpeech(textToSay, repromptTextToSay, response);
			} else {
				// get match type re-prompt
				var textToSay = 'OK. Are you playing singles or doubles?';
				var repromptTextToSay = 'Will this be a singles match or a doubles match?';
				askSpeech(textToSay, repromptTextToSay, response);
			};
		};	
	};

    intentHandlers.GetDoublesPlayerServingIntent = function (intent, session, response) {
        console.log('entering getDoublesPlayerServingIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};

			// if First To Serve has not yet been defined for each team, define it for one of the teams based on the incoming intent. 
			if ( ( (intent.slots.TeamMemberServing.value == 'alpha' || intent.slots.TeamMemberServing.value == 'bravo')  && currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo') ||
				 ( (intent.slots.TeamMemberServing.value == 'Charlie' || intent.slots.TeamMemberServing.value == 'delta') && currentMatch.data.MatchData.FirstBlueToServe == 'CharlieOrDelta') ) {

				if (intent.slots.TeamMemberServing.value == 'alpha' || intent.slots.TeamMemberServing.value == 'bravo') {
					currentMatch.data.MatchData.FirstRedToServe = intent.slots.TeamMemberServing.value;
					var speechOutput = currentMatch.data.MatchData.FirstRedToServe;
					speechOutput += ' will serve first on the red team. ';
				} else if (intent.slots.TeamMemberServing.value == 'Charlie' || intent.slots.TeamMemberServing.value == 'delta') {
					currentMatch.data.MatchData.FirstBlueToServe = intent.slots.TeamMemberServing.value;
					if (currentMatch.data.MatchData.FirstBlueToServe == 'Charlie') {currentMatch.data.MatchData.FirstBlueToServe = 'charlie' };
					var speechOutput = currentMatch.data.MatchData.FirstBlueToServe;
					speechOutput += ' will serve first on the blue team. ';
				};
			};
			// if we know First To Serve for both teams, establish the DoublesServeSequence.
			if ( (currentMatch.data.MatchData.FirstRedToServe == 'alpha' || currentMatch.data.MatchData.FirstRedToServe == 'bravo' ) &&
				 (currentMatch.data.MatchData.FirstBlueToServe == 'charlie' || currentMatch.data.MatchData.FirstBlueToServe == 'delta' ) ) {

				if (currentMatch.data.MatchData.WhosServe == 'red') { // red serves first
					if (currentMatch.data.MatchData.FirstRedToServe == 'alpha') {
						if (currentMatch.data.MatchData.FirstBlueToServe == 'charlie') {
							currentMatch.data.MatchData.DoublesServeSequence.push('alpha', 'charlie', 'bravo', 'delta');
						} else {
							currentMatch.data.MatchData.DoublesServeSequence.push('alpha', 'delta', 'bravo', 'charlie');
						};
					} else {
						if (currentMatch.data.MatchData.FirstBlueToServe == 'charlie') {
							currentMatch.data.MatchData.DoublesServeSequence.push('bravo', 'charlie', 'alpha', 'delta');
						} else {
							currentMatch.data.MatchData.DoublesServeSequence.push('bravo', 'delta', 'alpha', 'charlie');
						};
					};
				} else { // blue serves first
					if (currentMatch.data.MatchData.FirstBlueToServe == 'charlie') { // it is blue charlie serve						 
						if (currentMatch.data.MatchData.FirstRedToServe == 'alpha') {
							currentMatch.data.MatchData.DoublesServeSequence.push('charlie', 'alpha', 'delta', 'bravo');
						} else {
							currentMatch.data.MatchData.DoublesServeSequence.push('charlie', 'bravo', 'delta', 'alpha');
						};
					} else { // it is blue delta serve
						if (currentMatch.data.MatchData.FirstRedToServe == 'alpha') {
							currentMatch.data.MatchData.DoublesServeSequence.push('delta', 'alpha', 'charlie', 'bravo');
						} else {
							currentMatch.data.MatchData.DoublesServeSequence.push('delta', 'bravo', 'charlie', 'alpha');
						};
					};					
				};
				currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[0];
			};
			
			if (currentMatch.data.MatchType == 'doubles' && 
					 currentMatch.data.Red1PlayerID !== 0 && 
					 currentMatch.data.Blue1PlayerID !== 0 &&
					 currentMatch.data.Red2PlayerID !== 0 && 
					 currentMatch.data.Blue2PlayerID !== 0 ) { // all players have been added

				speechText = '<break time=\"0.3s\" /> All players have now been added. If you are ready to start, say, begin the match.';
				var repromptTextToSay = 'If you are ready to start, say, begin the match.';				
			} else { // there is at least 1 player of the 4	that has not yet been added			
				if (currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo' || 
					currentMatch.data.MatchData.FirstBlueToServe == 'CharlieOrDelta' ) { // 1 player has not yet been added to each team
					if (currentMatch.data.MatchData.FirstRedToServe == 'alpha' || currentMatch.data.MatchData.FirstRedToServe == 'bravo') {
						speechText = '<break time=\"0.3s\" /> You\'ve successfully added a player to the red team, now add a player to the blue team.';
						var repromptTextToSay = 'Please say add another player.';						
					} else {
						speechText = '<break time=\"0.3s\" /> You\'ve successfully added a player to the blue team, now add a player to the red team.';
						var repromptTextToSay = 'Please say add another player.';						
					};
				} else { // 2 players are signed in (at least one player to each team), but not all 4 
					if (currentMatch.data.Red1PlayerID != 0 && currentMatch.data.Red2PlayerID != 0 ) { // both red players are signed in
						speechText = '<break time=\"0.3s\" /> Both red players are now signed in. Would you like to add another player to the blue team, or begin the match?';
						var repromptTextToSay = 'Would you like to add another player or, begin the match?';						
					} else if (currentMatch.data.Blue1PlayerID != 0 && currentMatch.data.Blue2PlayerID != 0) { // both blue players are signed in
						speechText = '<break time=\"0.3s\" /> Both blue players are now signed in. Would you like to add another player to the red team, or begin the match?';
						var repromptTextToSay = 'Would you like to add another player or, begin the match?';											
					} else {
						speechText = '<break time=\"0.3s\" /> Would you like to add another player, or begin the match?';
						var repromptTextToSay = 'Would you like to add another player or, begin the match?';					
					};
				};
			};		
		
			askSpeechAndSave(speechText, repromptTextToSay, currentMatch, response);
        });
    };

    intentHandlers.BeginMatchIntent = function (intent, session, response) {
        console.log('entering BeginMatchIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};			
			if (currentMatch.data.MatchType == 'doubles') {
				if (currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo' || currentMatch.data.MatchData.FirstBlueToServe == 'CharlieOrDelta' ) {
					var speechText = 'There aren\'t any players assigned to the ';
					if (currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo') {
						speechText += 'red team yet. Please add a player to the red team.';
						var repromptTextToSay = 'Please say: add a player to the red team.';					
					};
					if (currentMatch.data.MatchData.FirstBlueToServe == 'CharlieOrDelta') {
						speechText += 'blue team yet. Please add a player to the blue team.';
						var repromptTextToSay = 'Please say: add a player to the blue team.';
					};
					askSpeech(speechText, repromptTextToSay, response);
				} else {
					if (currentMatch.data.MatchData.ExperiencedUserModeIntent == false) {
						var speechText = 'When a team wins a point, say either: Point red, or point blue.<break time=\"0.2s\" /> New ';
						speechText += currentMatch.data.MatchType ;
						speechText += ' match starting now. ';
						speechText += currentMatch.data.MatchData.WhosServe;
						speechText += ' team\'s serve.';
						speechText += ' First to serve is call sign ';
						speechText += currentMatch.data.MatchData.WhosServe;
						speechText += '<break time=\"0.4s\" /> Good luck players!';
					} else {
						var speechText = 'Match starting now.<break time=\"0.3s\" /> ';
						speechText += currentMatch.data.MatchData.DoublesServer;
						speechText += '\'s serve.';						
					};
					
					tellSpeech(speechText, currentMatch, response);
				};
			} else {
				// this is a singles match and can be started immediately
				if (currentMatch.data.MatchData.ExperiencedUserMode == false) {				
					var speechText = 'When a team wins a point, say either: Point red, or point blue.<break time=\"0.2s\" /> New ';
					speechText += currentMatch.data.MatchType;
					speechText += ' match starting now. ';
					speechText += currentMatch.data.MatchData.WhosServe;
					speechText += ' team\'s serve.';	
					speechText += '<break time=\"0.4s\" />Good luck players!';
				} else {
					var speechText = 'Match starting now.<break time=\"0.3s\" /> ';
					speechText += currentMatch.data.MatchData.WhosServe;
					speechText += '\'s serve.';						
				};
							
				tellSpeech(speechText, currentMatch, response);
			};
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
					currentMatch.data.MatchData.DoublesServeSequence.push('alpha', 'charlie', 'bravo', 'delta');
				} else {
					currentMatch.data.MatchData.FirstBlueToServe = 'charlie';
					currentMatch.data.MatchData.DoublesServeSequence.push('charlie', 'alpha', 'delta', 'bravo');
				};
				currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[0];
				
				if (currentMatch.data.MatchData.ExperiencedUserMode == false) {	
					var speechText = 'In';
					speechText += ' order to keep track of who is serving, I will assign you callsigns.';
					speechText += ' The player serving first on the ';
					speechText += 'red team will be: callsign, alpha.<break time=\"0.2s\" /> Alpha\'s partner will be: callsign bravo.'
					speechText += '<break time=\"0.4s\" />The player serving first on the blue team will be callsign charlie.';
					speechText += '<break time=\"0.2s\" />Charlie\'s partner will be callsign delta.'
					speechText += '<break time=\"0.4s\" />When a team wins a point, say either: Point red, or point blue.<break time=\"0.2s\" /> New ';
					speechText += currentMatch.data.MatchType ;
					speechText += ' match starting now. ';
					speechText += currentMatch.data.MatchData.WhosServe;
					speechText += ' team\'s serve.<break time=\"0.4s\" />';
					speechText += currentMatch.data.MatchData.DoublesServer;
					speechText += ' will serve first.';
					speechText += '<break time=\"0.4s\" />Good luck players!';
				} else {
					var speechText = 'Match starting now.<break time=\"0.3s\" /> ';
					speechText += currentMatch.data.MatchData.DoublesServer;
					speechText += '\'s serve.';	
				};
				
				tellSpeechAndSave(speechText, currentMatch, response);
				
			} else {	
				// this is a singles match and can be started immediately			
				if (currentMatch.data.MatchData.ExperiencedUserMode == false) {					
					var speechText = 'When a team wins a point, say either: Point red, or point blue.<break time=\"0.2s\" /> New ';
					speechText += currentMatch.data.MatchType;
					speechText += ' match starting now. ';
					speechText += currentMatch.data.MatchData.WhosServe;
					speechText += ' team\'s serve.';	
					speechText += '<break time=\"0.4s\" />Good luck players!';
				} else {
					var speechText = 'Match starting now.<break time=\"0.3s\" /> ';
					speechText += currentMatch.data.MatchData.WhosServe;
					speechText += '\'s serve.';						
				};
				
				tellSpeechAndSave(speechText, currentMatch, response);					
			}
        });
    };	
	
    intentHandlers.ChangeServeIntent = function (intent, session, response) {
        console.log('entering ChangeServeIntent');	
		// 1. call matchStorage.loadMatch, and pass 'session' into it. 
		// 2. assign the results of that to the variable 'currentMatch'.
		// 3. then pass 'currentMatch' into the code in the braces.
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};
			
			console.log('intent.slots.TeamServing.value = ' + intent.slots.TeamServing.value);	

			// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later
			for (var stat in currentMatch.data.MatchData) {
				if (currentMatch.data.MatchData.hasOwnProperty(stat)) {
					currentMatch.data.nMinusOne[stat] = currentMatch.data.MatchData[stat];
				};
			};		
			
			if (!intent.slots.TeamServing.value) { 			
				var textToSay = 'OK. Who would you like to have serve now? Please say <break time=\"0.2s\" /> change to red serve or '; 
				textToSay += '<break time=\"0.2s\" /> change to blue serve.';
				var repromptTextToSay = 'Say <break time=\"0.2s\" /> change to red serve or<break time=\"0.2s\" /> change to blue serve.';
				askSpeech(textToSay, repromptTextToSay, response);					
                return;
			};
			
			var colorIn = intent.slots.TeamServing.value;	
			var currentServer = setColor(colorIn);
	
			currentMatch.data.MatchData.WhosServe = currentServer;	

			if (currentMatch.data.MatchType == 'doubles') { 
				// need to move the doubles partner serve to the next partner on the team specified by the players
				var priorDoublesServerIndex = currentMatch.data.MatchData.DoublesServeSequence.indexOf(currentMatch.data.MatchData.DoublesServer);		
				var nextDoublesServer = priorDoublesServerIndex+1;
				if (priorDoublesServerIndex < 3) {
					currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[nextDoublesServer];
				} else {
					currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[0];
				};
				console.log('currentMatch.data.MatchData.DoublesServer after 1st change = ' + currentMatch.data.MatchData.DoublesServer);
				console.log('currentServer = ' + currentServer);
				// increment priorDoublesServerIndex to match new DoublesServer just assigned to support logic below
				priorDoublesServerIndex = currentMatch.data.MatchData.DoublesServeSequence.indexOf(currentMatch.data.MatchData.DoublesServer); 
				
				// if the serving team and the current doubles server don't match, go to the next doubles server on serving team
				if (currentServer == 'red') { 
					if (currentMatch.data.MatchData.DoublesServer == 'charlie' || currentMatch.data.MatchData.DoublesServer == 'delta' ) {
						console.log('inside next change indicating there was not a match');						
						console.log('currentServer = ' + currentServer);
						console.log('currentMatch.data.MatchData.DoublesServer before 2nd change = ' + currentMatch.data.MatchData.DoublesServer);
						nextDoublesServer = priorDoublesServerIndex+1;						
						if (priorDoublesServerIndex < 3) {
							currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[nextDoublesServer];
						} else {
							currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[0];
						};
						console.log('currentMatch.data.MatchData.DoublesServer after 2nd change = ' + currentMatch.data.MatchData.DoublesServer);						
					};					
				} else if (currentServer == 'blue') {
					if (currentMatch.data.MatchData.DoublesServer == 'alpha' || currentMatch.data.MatchData.DoublesServer == 'bravo' ) {
						console.log('inside next change indicating there was not a match');						
						console.log('currentServer = ' + currentServer);
						console.log('currentMatch.data.MatchData.DoublesServer before 2nd change = ' + currentMatch.data.MatchData.DoublesServer);						
						nextDoublesServer = priorDoublesServerIndex+1;						
						if (priorDoublesServerIndex < 3) {
							currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[nextDoublesServer];
						} else {
							currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[0];
						};	
						console.log('currentMatch.data.MatchData.DoublesServer after 2nd change = ' + currentMatch.data.MatchData.DoublesServer);						
					};					
				};				
				speechText = 'It is now ';
				speechText += currentMatch.data.MatchData.DoublesServer;
				speechText += '\'s serve on the ';
				speechText += currentServer;
				speechText += ' team.';																							
			} else { // this is a singles match, so simply switch the serve
				speechText = 'It is now ';
				speechText += currentServer ;
				speechText += ' team\'s serve.'; 				
			};
			tellSpeechAndSave(speechText, currentMatch, response);			
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
            
    intentHandlers.ChangeGameScoreIntent = function (intent, session, response) {
        console.log('entering ChangeGameScoreIntent ');
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
	
			var redScoreBefore = currentMatch.data.MatchData.RedTeamGameScore; 
            var blueScoreBefore = currentMatch.data.MatchData.BlueTeamGameScore;						
			var currentServer = currentMatch.data.MatchData.WhosServe;
            		
			// update the scores based on the exact score specified by the user
			var updatedMatch = updateScores(currentMatch, intent.slots.GameScore.value, currentServer);           
			
			var redScoreAfter = updatedMatch.data.MatchData.RedTeamGameScore;
			var blueScoreAfter = updatedMatch.data.MatchData.BlueTeamGameScore;
		
			if (redScoreAfter > redScoreBefore) {
				// increment red's total points won in the match
				currentMatch.data.MatchData.RedTeamTotalPointsWon++;
			}
			else if (redScoreBefore > redScoreAfter) {
				// increment blue's total points won in the match
				// this happens in the case of deuce changing to ad out
				currentMatch.data.MatchData.BlueTeamTotalPointsWon++;
			};			
			if (blueScoreAfter > blueScoreBefore) {
				// increment blue's total points won in the match
				currentMatch.data.MatchData.BlueTeamTotalPointsWon++;
			}
			else if (blueScoreBefore > blueScoreAfter) {
				// increment red's total points won in the match
				// this happens in the case of deuce changing to ad out
				currentMatch.data.MatchData.RedTeamTotalPointsWon++;
			};			
           
			var speechOutput = constructScoreOutput(updatedMatch, currentServer);                              
            updatedMatch.save(function () {
                response.tell(speechOutput);                 
            });
        });
    };

    intentHandlers.FixGameScoreIntent = function (intent, session, response) {
        console.log('entering FixGameScoreIntent');				
		var textToSay = 'To change the score of the current game, just say what you want the score to be.'; 
		textToSay += '<break time=\"0.2s\" /> For example, say 30 all. What should the score be?';
		var repromptTextToSay = 'What should the score be?';
		askSpeech(textToSay, repromptTextToSay, response);					
    };			
			
    intentHandlers.RegisterPlayerDialogIntent = function (intent, session, response) {
		// Handles intent to register a player via an interactive dialog to get the player's phone number
		console.log('entering RegisterPlayerDialogIntent');
        if (intent.slots.Phone.value) { // if phone number was provided
			if (intent.slots.Phone.value.toString().length < 10) { // check to make sure it is a real phone number
				var textToSay = 'I\'m not sure I got that correctly, it had less than 10 digits.'; 
				textToSay += '<break time=\"0.3s\" />Please say <break time=\"0.2s\" /> Register, and then your phone number.';
				var repromptTextToSay = 'say register and then say your phone number';
				askSpeech(textToSay, repromptTextToSay, response);
			};
			if (session.attributes.firstNumber) { // if the user provided the number twice and they match, move forward with registration
				if (session.attributes.firstNumber == intent.slots.Phone.value) {
					session.attributes.newPlayerPhone = intent.slots.Phone.value;
					fulfillRegisterPlayer(session, response);
				} else {
					var textToSay = 'Hmm, those numbers didn\t match.'; 
					textToSay += '<break time=\"0.2s\" />Please try again. Say <break time=\"0.2s\" /> Register, and then your phone number.';
					var repromptTextToSay = '';
					askSpeech(textToSay, repromptTextToSay, response);					
				};
			} else { // this is the first time they are providing the phone number to register, so reprompt them to do it again.
				console.log('in first time go round - intent.slots.Phone.value = ' + intent.slots.Phone.value);
				session.attributes.firstNumber = intent.slots.Phone.value;
				var textToSay = 'Thanks. Please say it again to make sure I got it right.'; 
				textToSay += '<break time=\"0.2s\" />Say <break time=\"0.2s\" /> Register, and then your phone number.';
				var repromptTextToSay = 'say register and then say your phone number';
				askSpeech(textToSay, repromptTextToSay, response);
			};
        } else { // user just said 'register player' without any specification, so reprompt them to do it with a phone number
			var textToSay = 'OK. In order to register, please say register and then your phone number'; 
			textToSay += '<break time=\"0.3s\" />For example, say register 425-555-1212';
			var repromptTextToSay = 'say register and then say your phone number';
			askSpeech(textToSay, repromptTextToSay, response);
        };
		
		function fulfillRegisterPlayer(session, response) {
			console.log('entering fulfillRegisterPlayer');
			playerStorage.newPlayer(session, function (newRegisteredPlayer) {		
				// add in here .mp3 sound file with player name 'added to the match'			
				var speechText = 'One time registration complete. Going forward, just say <break time=\"0.2s\" />add ';
					speechText += '<say-as interpret-as="telephone">';
					speechText += session.attributes.newPlayerPhone;
					speechText += '</say-as>';					
					speechText += ' to the match. ';
					speechText += '<break time=\"0.4s\" />After a match, I can send you a text with all the statistics. Texts are only sent when you ask. ';
					speechText += 'To enable that, I send you a confirmation text and you reply to confirm. If you\'d like me to ';	
					speechText += 'do that, say <break time=\"0.2s\" />send confirmation text, or say <break time=\"0.2s\" />no thanks';
					var repromptTextToSay = 'say <break time=\"0.2s\" />send confirmation text, or say <break time=\"0.2s\" />no thanks.';	
				console.log('session.attributes.newPlayerPhone = ' + session.attributes.newPlayerPhone);					
				newRegisteredPlayer.save(session, function () {
					askSpeech(speechText, repromptTextToSay, response);	
				});										
			});
		};				
	};				
	
	intentHandlers.OneShotAddPlayerIntent = function (intent, session, response) {
		// Handles intent to add a player with a single input from the user, but 
		// will re-direct to a dialog if the phone number and team are not both provided 
		console.log('entering OneShotAddPlayerIntent');

		handleOneshotAddPlayerRequest(intent, session, response);
		
		/**
		 * This handles the one-shot interaction, where the user utters a phrase like:
		 * 'Add 425-890-8485 to blue team'.
		 * If there is an error in a slot, this will guide the user to the dialog approach.
		 */
		function handleOneshotAddPlayerRequest(intent, session, response) {
			console.log('entering handleOneshotAddPlayerRequest');
			if (intent.slots.Phone.value) {
				session.attributes.phoneKey = intent.slots.Phone.value
			};
			// 1st determine team to assign
			if (!intent.slots.Team.value) {
				// Didn't get the team to assign. Move to dialog approach.				
				var textToSay = 'What team are you playing on? Please say<break time=\"0.2s\" /> join red team, or <break time=\"0.2s\" /> join blue team';
				var repromptTextToSay = 'Please say join red team, or join blue team';
				askSpeech(textToSay, repromptTextToSay, response);
				return;
			};
			// set team in session and simplify the designation to either 'red' or 'blue'
			session.attributes.team = intent.slots.Team.value;
			if (intent.slots.Team.value == 'red team') { session.attributes.team = 'red' };
			if (intent.slots.Team.value == 'team red') { session.attributes.team = 'red' };
			if (intent.slots.Team.value == 'blue team') { session.attributes.team = 'blue' };
			if (intent.slots.Team.value == 'team blue') { session.attributes.team = 'blue' };			
			
			// Determine phone
			var playerPhone = getPhoneFromIntent(intent);
			if (playerPhone.error) {
				// Didn't get the phone number. Move to dialog approach
				var textToSay = 'OK. New player, please say your phone number'; 
				var repromptTextToSay = 'What is the phone number of the player to add?';
				askSpeech(textToSay, repromptTextToSay, response);
				return;
			};

			session.attributes.phoneKey = playerPhone.phone;
				
			// all slots filled and corresponding session variables set, so move to final fulfillAddPlayer
			fulfillAddPlayer(session, response);
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
		// phone number and which team to assign them to		
		console.log('entering AddPlayerDialogIntent');
        if (intent.slots.Phone.value) { // if phone number was provided
            handlePhoneProvidedDialogRequest(intent, session, response);
        } else if (intent.slots.Team.value) { // if team to assign was provided
            handleTeamProvidedDialogRequest(intent, session, response);
        } else { // user just said 'add player' without any specification
            handleNoSlotDialogRequest(intent, session, response);
        };
			
		/**
		 * Handles the dialog step where the user provides a phone number
		 */
		function handlePhoneProvidedDialogRequest(intent, session, response) {	
			console.log('entering handlePhoneProvidedDialogRequest');
			// if we don't have a team assigned yet, go get the team. If we have a team assigned, welcome the player
			if (session.attributes.team) {
				session.attributes.phoneKey = intent.slots.Phone.value;
				fulfillAddPlayer(session, response);
			} else {
				// set phone in session and prompt for team
				session.attributes.phoneKey = intent.slots.Phone.value;				
				// Test to see if we are in a dialog toward adding a player to the match. If not, this
				// may be a new player that is trying to register
				if (session.attributes.addingPlayer == true) {
					var textToSay = 'What team are you playing on? Please say<break time=\"0.2s\" /> join red team, or <break time=\"0.2s\" /> join blue team';
					var repromptTextToSay = 'Please say join red team, or join blue team';
					askSpeech(textToSay, repromptTextToSay, response);					
				} else if (session.attributes.firstNumber) {
					var textToSay = 'To register a player, be sure to first say register, and then your phone number.';
					var repromptTextToSay = '';
					askSpeech(textToSay, repromptTextToSay, response);					
				};
			};
		};		
		
		/**
		 * Handles the dialog step where the user provides a team that the player should be assigned to
		 */
		function handleTeamProvidedDialogRequest(intent, session, response) {
			console.log('entering handleTeamProvidedDialogRequest');
			
			// There is a potential of a player trying to register that just says their phone number, so try and prevent:
			// set a flag that we are expecting a phone number later in the session
			session.attributes.addingPlayer = true;
			
			// set team in session and simplify the designation to either 'red' or 'blue'
			session.attributes.team = intent.slots.Team.value;
			if (intent.slots.Team.value == 'red team') { session.attributes.team = 'red' };
			if (intent.slots.Team.value == 'team red') { session.attributes.team = 'red' };
			if (intent.slots.Team.value == 'blue team') { session.attributes.team = 'blue' };
			if (intent.slots.Team.value == 'team blue') { session.attributes.team = 'blue' };

			// if we don't have a phone yet, go get phone. If we have a phone, we perform the final request			
			if (session.attributes.phoneKey) {
				fulfillAddPlayer(session, response);
			} else {
				// prompt for phone
				var textToSay = 'OK. New player, please say your phone number'; 
				var repromptTextToSay = 'What is the phone number of the player to add?';
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
				// get phone re-prompt
				var textToSay = 'OK. New player, please say your phone number'; 
				var repromptTextToSay = 'What is the phone number of the player to add?';
				askSpeech(textToSay, repromptTextToSay, response);
			};
		};	
	};

    intentHandlers.TeamWinsAGameIntent = function (intent, session, response) {
        //reset scores for all existing players
        console.log('entering RedWinsAGameIntent');
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
	
			if 			(intent.slots.Team.value == 'red' ||
						 intent.slots.Team.value == 'red team' ||
						 intent.slots.Team.value == 'team red') {
						 var colorWinner = 'point red';
						 currentMatch.data.MatchData.RedTeamGameScore = 40; // set the score so red will win the game
						 currentMatch.data.MatchData.BlueTeamGameScore = 0;

			} else if 	(intent.slots.Team.value == 'blue' ||
						 intent.slots.Team.value == 'blue team' ||
						 intent.slots.Team.value == 'team blue') {
						 var colorWinner = 'point blue';
						 currentMatch.data.MatchData.RedTeamGameScore = 0; // set the score so blue will win the game
						 currentMatch.data.MatchData.BlueTeamGameScore = 40;					 
			};				
			pointToPlayer(colorWinner, currentMatch, response);
        });
    };
	
    intentHandlers.ChangeSetScoreIntent = function (intent, session, response) {
        console.log('entering ChangeSetScoreIntent');
		var speechText = 'OK. What should each team\'s score in the current set be?';
			speechText += '<break time=\"0.4s\" />For example, say red score three, blue score two';
		var repromptText = "What is the red team\s set score? Say, for example, red score three, blue score two";		
		askSpeech(speechText, repromptText, response);			
    };

    intentHandlers.SpecifySetScoreIntent = function (intent, session, response) {
        console.log('entering SpecifySetScoreIntent');
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
			
			currentMatch.data.MatchData.RedTeamSetScore = intent.slots.RedSetScore.value;
			currentMatch.data.MatchData.BlueTeamSetScore = intent.slots.BlueSetScore.value;

			updateSetXScoresParam(currentMatch);
								
			if (currentMatch.data.MatchData.Set == 1) {
				var rawScores = currentMatch.data.MatchData.Set1Score.split(" ");				
			} else if (currentMatch.data.MatchData.Set == 2) {
				var rawScores = currentMatch.data.MatchData.Set2Score.split(" ");
			} else if (currentMatch.data.MatchData.Set == 3) {
				var rawScores = currentMatch.data.MatchData.Set3Score.split(" ");
			};

			var setScoreToSay = rawScores[0] + ' to ' + rawScores[1] + ', ';
			if (rawScores[2]) {
				setScoreToSay += rawScores[2] + ' ' + rawScores[3];
			};
			
			var speechText = 'set score ';
				speechText += '<break time=\"0.1s\" />';
				speechText += setScoreToSay;
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };
	
    intentHandlers.ChangeMatchScoreIntent= function (intent, session, response) {
        console.log('entering ChangeMatchScoreIntent');
		var speechText = 'OK. How many sets has each team won?';
			speechText += '<break time=\"0.4s\" />For example, say red has 1 set and blue has none';
		var repromptText = "How many sets has each team won? Say, for example, red has 1 set and blue has none";		
		askSpeech(speechText, repromptText, response);				
    };
	
    intentHandlers.SpecifyMatchScoreIntent = function (intent, session, response) {
        console.log('entering SpecifyMatchScoreIntent');
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
			
			currentMatch.data.MatchData.RedTeamSetsWon = intent.slots.RedMatchScore.value;
			currentMatch.data.MatchData.BlueTeamSetsWon = intent.slots.BlueMatchScore.value;
						
			var speechText = 'OK. The score of the match is now red team ';
				speechText += '<break time=\"0.1s\" />';
				speechText += currentMatch.data.MatchData.RedTeamSetsWon;
				speechText += ' set';
			if (currentMatch.data.MatchData.RedTeamSetsWon < 1 || currentMatch.data.MatchData.RedTeamSetsWon > 1) {
				speechText += '\'s';
			};
				speechText += ' to blue team ';
				speechText += '<break time=\"0.1s\" />';
				speechText += currentMatch.data.MatchData.BlueTeamSetsWon;
				speechText += ' set';
				if (currentMatch.data.MatchData.BlueTeamSetsWon < 1 || currentMatch.data.MatchData.BlueTeamSetsWon > 1) {
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
	
    intentHandlers.NewSetIntent = function (intent, session, response) {
        console.log('entering NewSetIntent');
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
				var textToSay = 'OK. Who will be serving in the new set? Please say <break time=\"0.2s\" /> new set, red serve or '; 
				textToSay += '<break time=\"0.2s\" /> new set, blue serve.';
				var repromptTextToSay = 'Say <break time=\"0.2s\" /> new set, red serve or <break time=\"0.2s\" /> new set, blue serve.';
				askSpeech(textToSay, repromptTextToSay, response);					
                return;
			}				

            var currentServer = intent.slots.Team.value;			
            if (currentServer == 'red team') { currentServer = 'red' };
            if (currentServer == 'blue team') { currentServer = 'blue' };
			if (currentServer == 'team red') { currentServer = 'red' };
            if (currentServer == 'team blue') { currentServer = 'blue' };
			//reset game and set scores to 0
			currentMatch.data.MatchData.RedTeamGameScore = 0; 
			currentMatch.data.MatchData.BlueTeamGameScore = 0;
			currentMatch.data.MatchData.RedTeamSetScore = 0;
			currentMatch.data.MatchData.BlueTeamSetScore = 0;
			currentMatch.data.MatchData.WhosServe = currentServer;
			currentMatch.data.MatchData.Deuce = false;
			currentMatch.data.MatchData.BreakPoint = false;			
            var speechText = 'New set started, ';
            speechText += currentServer ;
            speechText += ' team\'s serve';			
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

			// copy current match stats into nMinusOne prior to changing the score to enable undo if needed later
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
	
	intentHandlers.ExperiencedUserModeIntent = function (intent, session, response) {
        console.log('entering experiencedUserModeIntent');
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
	
	intentHandlers.SendSubscribeTextIntent = function (intent, session, response) {
		// sets up the SNS Topic that will be used to subscribe a player to for ongoing notification from this skill
        console.log('entering SendSubscribeTextIntent');
		if (session.attributes.newPlayerPhone) { // a new player registered in this session and wants to subscribe to texts
			session.attributes.phoneKey = session.attributes.newPlayerPhone;
			console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey);
			initializeSNSforPlayer(session, response);
		} else if (intent.slots.valuePhoneKey) {
			session.attributes.phoneKey = session.attributes.newPlayerPhone;
			console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey);
			initializeSNSforPlayer(session, response);
		} else {
			if (intent.slots.PhoneKey.value) {
				session.attributes.phoneKey = intent.slots.PhoneKey.value
				initializeSNSforPlayer(session, response);				
			} else {
				var speechText = 'I need to know which player you are. Please say: send a confirmation text to <break time=\"0.2s\" />and then your phone number';					
				var repromptText = 'Say: send a confirmation text to <break time=\"0.2s\" />and then your phone number';
				repromptText += '<break time=\"0.4s\" />For example, say send a confirmation text to 425-555-1212.';				
				askSpeech(speechText, repromptText, response);				
			}

		};
    };

	intentHandlers.DontSubscribeIntent = function (intent, session, response) {
        console.log('entering DontSubscribeIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};			
			currentMatch.data.MatchData.SwitchSides = false;						
            var speechText = 'OK, if you change your mind just tell me. Ask for help and you\'ll be reminded of how to do that.';		
			response.tell(speechText);
        });
    };	
	
	intentHandlers.PlayGamePointIntent = function (intent, session, response) {
        console.log('entering PlayGamePointIntent');
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
			
			currentMatch.data.MatchData.PlayGamePoint = true;
			if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
				var speechText = 'OK, games will be played with no add scoring. Instead of deuce, it will be game point.';
			} else {
				var speechText = 'Now playing no add scoring.';
			};				
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };

	intentHandlers.PlayTiebreakerIntent = function (intent, session, response) {
        console.log('entering playTiebreakerIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};
			
			currentMatch.data.MatchData.Tiebreaker = true;						
            speechText = 'OK, tiebreaker. ';
			pointToPlayer('none', currentMatch, response);			
        });
    };	

	intentHandlers.PlaySuperTiebreakerIntent = function (intent, session, response) {
        console.log('entering playSuperTiebreakerIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};
			
			currentMatch.data.MatchData.Tiebreaker = true;
			currentMatch.data.MatchData.SuperTiebreaker = true;			
            speechText = 'OK, super tiebreaker. ';
			pointToPlayer('none', currentMatch, response);	
        });
    };	

	intentHandlers.SavePreferencesIntent = function (intent, session, response) {
        console.log('entering savePreferencesIntent');		
		if (intent.slots.Phone.value) { // if phone number was provided
			if (intent.slots.Phone.value.toString().length < 10) { // check to make sure it is a real phone number
				var textToSay = 'I\'m not sure I got that correctly, it had less than 10 digits.'; 
				textToSay += '<break time=\"0.3s\" />Please say <break time=\"0.2s\" /> save preferences to, and then your phone number.';
				var repromptTextToSay = 'say save preferences to and then say your phone number';
				askSpeech(textToSay, repromptTextToSay, response);
			} else {
				session.attributes.phoneKey = intent.slots.Phone.value;
				fulfillSavePreferences(session, response);
			}
		} else { // user just said 'save preferences' without any specification, so reprompt them to do it with a phone number
			var textToSay = 'OK. In order to save these match settings, say: save preferences to, and then your phone number.'; 
			textToSay += '<break time=\"0.3s\" />For example, say, save preferences to 425-555-1212';
			var repromptTextToSay = 'say: save preferences to, and then your phone number.';
			askSpeech(textToSay, repromptTextToSay, response);
		};						      
    };	
	
	intentHandlers.LoadPreferencesIntent = function (intent, session, response) {
        console.log('entering loadPreferencesIntent');		
		if (intent.slots.Phone.value) { // if phone number was provided
			if (intent.slots.Phone.value.toString().length < 10) { // check to make sure it is a real phone number
				var textToSay = 'I\'m not sure I got that correctly, it had less than 10 digits.'; 
				textToSay += '<break time=\"0.3s\" />Please say <break time=\"0.2s\" /> load preferences from, and then your phone number.';
				var repromptTextToSay = 'say load preferences from and then say your phone number';
				askSpeech(textToSay, repromptTextToSay, response);
			} else {
				session.attributes.phoneKey = intent.slots.Phone.value;
				fulfillLoadPreferences(session, response);
			}
		} else { // user just said 'load preferences' without any specification, so reprompt them to do it with a phone number
			var textToSay = 'OK. In order to apply your preferences to this match, say: load preferences from, and then your phone number.'; 
			textToSay += '<break time=\"0.3s\" />For example, say, load preferences from 425-555-1212';
			var repromptTextToSay = 'say: load preferences from, and then your phone number.';
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
		createTeamSummary(session, response);
    };	

    intentHandlers.BlueTeamSummaryIntent = function (intent, session, response) {
		console.log('entering BlueTeamSummaryIntent');
		session.attributes.summaryForTeam = 'blue';
		createTeamSummary(session, response);
    };		
	
    intentHandlers.TextMatchSummaryIntent = function (intent, session, response) {
		console.log('entering TextMatchSummaryIntent');
		matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};			
			var problems = false; // flag to be used later to indicate problem somewhere with sending text to all players			
			var matchSummaryContent = createTextSummaryForMatch(currentMatch);		
			var textsToSend =  matchSummaryContent.textToSend;		
			var playersToReceive = buildArrayOfCurrentPlayers(currentMatch);
			
			async.forEachSeries(	textsToSend, // array of items

				function(textToSend, callback){
					console.log('textToSend = ' + textToSend);
			
					async.forEachSeries(	playersToReceive, // array of items 
					
						function(receivingPlayer, callback){
							console.log('receivingPlayer = ' + receivingPlayer);
							
							async.waterfall([
							
								function (callback) {
									session.attributes.phoneKey = receivingPlayer;
									console.log('session.attributes.phoneKey in sendTextToAPlayer function and top of waterfall = ' + session.attributes.phoneKey);
									callback(null);
								},
								
								function (callback) {					
									playerStorage.loadPlayer(session, function (newLoadedPlayer) {
										console.log('newLoadedPlayer = ' + JSON.stringify(newLoadedPlayer) )
										if (newLoadedPlayer == 'playerNotFound' || newLoadedPlayer == 'errorLoadingPlayer') {
											problems = true; // set problems flag for later
											callback(null);
										} else {
											var ARNtoSend = newLoadedPlayer.data.TopicARN;
											console.log('ARNtoSend from within playerStorage section = ' + ARNtoSend );
											callback(null, ARNtoSend);
										};
									})
								},
										
								function (ARNtoSend, callback) {
									console.log('from within bottom of waterfall, ARNtoSend = ' + ARNtoSend );
									console.log('from within bottom of waterfall, textToSend = ' + textToSend );
									playerSMS.publishSMS(ARNtoSend, textToSend, function (success) {
										console.log('returned success = ' + success);
										if (success == false) {problems = true}; // set problems flag for later
										callback(null);
									})														
								}		
																						
							], function (err, result) {
								if (err) console.log(err, "SMS text had a problem sending.");
								if (!err) console.log(null, "SMS text was successfully sent.");
								callback();

							});						
																
						},			

						function(err){
							// given text sent to each player				
							console.log('into inner callback function');							
							callback();
						}
					);									
				},

				function(err){
					// All texts sent to each player			
					console.log('into outer callback function to do response.tell');
					speechText = 'OK, text sent.';
					if (problems == true) {
						speechText += ' But there was a problem sending it to some players.'
					}
					//response.tell(speechText);	
					var cardTitle =  matchSummaryContent.cardTitle;
					var cardContent =  matchSummaryContent.cardContent;
							
					response.tellWithCard(speechText, cardTitle, cardContent);						
				}
			);		
        });
				
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

	intentHandlers.TellSetScoreIntent = function (intent, session, response) {
		console.log('entering TellSetScoreIntent');
		// reply to the user with the set score of the current match
        matchStorage.loadMatch(session, function (currentMatch) {
			if (typeof(currentMatch) == 'string') {
				matchNotFound(currentMatch, response);
				return;
			};			
			var setToSay = currentMatch.data.MatchData.Set;
			var formattedSetScore = formatSetScore(setToSay, true, 'speech', currentMatch);		
			
			var speechText = 'set score ';
			speechText += '<break time=\"0.1s\" />';
			speechText += formattedSetScore;
			tellSpeech(speechText, currentMatch, response);					                           
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
			var currentServer = currentMatch.data.MatchData.WhosServe;
			var speechText = 'It is ';			
			// If this is a singles match
			if (currentMatch.data.MatchType == 'singles') {
				speechText += currentServer;
				speechText += ' team\'s serve.';
			// If this is a doubles match, figure out who is serving next	
			} else if (currentMatch.data.MatchType == 'doubles') { 
				speechText += currentMatch.data.MatchData.DoublesServer;
				speechText += '\'s serve on the ';
				speechText += currentServer;
				speechText += ' team.';			
			};
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
			tellSpeech(revisedScore, currentMatch, response); 			
        });
    };		
	
    intentHandlers.TellShortcutsIntent = function (intent, session, response) {
        console.log('entering TellShortcutsIntent');				
			var speechOutput = {
				speech: '<speak>' + textHelper.shortcutHelp + ' What would you like to do?' + '</speak>',
				type: AlexaSkill.speechOutputType.SSML
			};
			response.ask(speechOutput);			
    };	
	
    intentHandlers.TellMoreHelpIntent = function (intent, session, response) {
        console.log('entering TellCommandsIntent');				
			var speechOutput = {
				speech: '<speak>' + textHelper.moreHelp + ' What would you like to do?' + '</speak>',
				type: AlexaSkill.speechOutputType.SSML
			};
			response.ask(speechOutput);			
    };

    intentHandlers.TellEvenMoreHelpIntent = function (intent, session, response) {
        console.log('entering TellCommandsIntent');				
			var speechOutput = {
				speech: '<speak>' + textHelper.evenMoreHelp + ' What would you like to do?' + '</speak>',
				type: AlexaSkill.speechOutputType.SSML
			};
			response.ask(speechOutput);			
    };		

	/********** example for incorporating pagination idea into help
    intentHandlers.TellNextCommandsIntent = function (intent, session, response) {
        console.log('entering TellNextCommandsIntent');	

        for (i = 0; i < paginationSize; i++) {
            if (sessionAttributes.index>= result.length) {
                break;
            }
            speechText = speechText + "<p>" + result[sessionAttributes.index] + "</p> ";
            cardContent = cardContent + result[sessionAttributes.index] + " ";
            sessionAttributes.index++;
        }
        if (sessionAttributes.index < result.length) {
            speechText = speechText + " Wanna go deeper in history?";
            cardContent = cardContent + " Wanna go deeper in history?";
        }
		
		response.tell(textHelper.completeHelp);				
    };
	*/	
	
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
        if (skillContext.needMoreHelp) {
            response.tell('Okay, standing by.');
        } else {
            response.tell('');
        }
    };

    intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay, standing by.');
        } else {
            response.tell('');
        }
    };
};
console.log('exiting intentHandlers.js');
exports.register = registerIntentHandlers;
