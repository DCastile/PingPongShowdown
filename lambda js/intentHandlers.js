
'use strict';
console.log('entering intentHandlers.js');

var textHelper = require('./textHelper'),
    matchStorage = require('./matchStorage'),
	playerStorage = require('./playerStorage'),
	AlexaSkill = require('./AlexaSkill'),
	playerSMS = require('./playerSMS');	
	
var speechText = '';

function fulfillNewMatch(session, response) {
	console.log('entering fulfillNewMatch function');
	// this is a a singles match or it is a doubles match in which the serve order has been defined.
	// 1. call matchStorage.newMatch, and pass 'session' into it. 
	// 2. assign the results of that to the variable 'currentMatch'.
	// 3. then pass 'currentMatch' into the code in the braces.
	matchStorage.newMatch(session, function (currentMatch) {
		currentMatch.data.MatchData.WhosServe = session.attributes.firstToServe;			
		currentMatch.data.MatchType.S = session.attributes.singlesOrDoubles;
			
		if (currentMatch.data.MatchType.S == 'doubles') {
			var speechText = 'Welcome doublesplayers.<break time=\"0.4s\" /> ';
		} else {
			var speechText = 'Welcome singlesplayers.<break time=\"0.4s\" /> ';
		};

		// Redirect to either 'Add Player' or 'Skip Sign In' and start a new match.
		speechText += 'To have your match statistics saved, please sign in. To do that, say, add a player.';
		speechText += ' To just start playing, say skipsign-in.';
		var repromptTextToSay = 'Would you like to add a player or skip sign in?';
		askSpeechAndSave(speechText, repromptTextToSay, currentMatch, response);	
	});	
};

function fulfillAddPlayer(session, response) {
	// Both the one-shot and dialog based paths lead to this method to issue the add player request, and
	// respond to the user with confirmation.
	console.log('entering fulfillAddPlayer');
	// 1. call matchStorage.loadGame, and pass 'session' into it. Session now includes new player's phone number and team to assign them to
	// 2. assign the results of that to the variable 'currentMatch'.
	// 3. then pass 'currentMatch' into the code in the braces.
	matchStorage.loadMatch(session, function (currentMatch) { // need to get match data because we will add player data to it and re-save
		// 1. call playerStorage.loadPlayer, and pass 'session' into it. Session now includes new player's phone number and team to assign them to
		// 2. assign the results of that to the variable 'currentPlayers'.
		// 3. then pass 'currentPlayers' into the code in the braces.
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
			
			if (session.attributes.team == 'red') {
				if (currentMatch.data.MatchType.S == 'singles') {
					// use the Red1/Blue1PlayerID
					if (currentMatch.data.Red1PlayerID.N == 0) {
						currentMatch.data.Red1PlayerID.N = newMatchPlayer.data.Phone.N;
					} else {
						var speechText = 'There is already a player assigned to the red team of this singles match.'; 
						speechText += ' You can start a new match or add a player to the blue team if that was your intent.';
						var repromptTextToSay = 'You can start a new match or add a player to the blue team if that was your intent.';
						askSpeech(speechText, repromptTextToSay, response);						
					};
				} else {
					// this is a doubles match. Check to see if the player should be assigned Red/Blue1 or Red/Blue2
					if (currentMatch.data.Red1PlayerID.N == 0) {
						currentMatch.data.Red1PlayerID.N = newMatchPlayer.data.Phone.N;
						currentMatch.data.MatchData.PlayerAlias.Red1 = 'alpha';
						var callSign = currentMatch.data.MatchData.PlayerAlias.Red1;
					} else if (currentMatch.data.Red2PlayerID.N == 0) {
						currentMatch.data.Red2PlayerID.N = newMatchPlayer.data.Phone.N;
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
				if (currentMatch.data.MatchType.S == 'singles') {
					// use the Red1/Blue1PlayerID
					if (currentMatch.data.Blue1PlayerID.N == 0) {
						currentMatch.data.Blue1PlayerID.N = newMatchPlayer.data.Phone.N;
					} else {
						var speechText = 'There is already a player assigned to the blue team of this singles match.'; 
						speechText += ' You can start a new match or add a player to the red team if that was your intent.';
						var repromptTextToSay = 'You can start a new match or add a player to the red team if that was your intent.';						
						askSpeech(speechText, repromptTextToSay, response);						
					};
				} else {
					// this is a doubles match. Check to see if the player should be assigned Red/Blue1 or Red/Blue2
					if (currentMatch.data.Blue1PlayerID.N == 0) {
						currentMatch.data.Blue1PlayerID.N = newMatchPlayer.data.Phone.N;
						currentMatch.data.MatchData.PlayerAlias.Blue1 = 'charlie';
						var callSign = currentMatch.data.MatchData.PlayerAlias.Blue1;						
					} else if (currentMatch.data.Blue2PlayerID.N == 0) {
						currentMatch.data.Blue2PlayerID.N = newMatchPlayer.data.Phone.N;
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
			// add in here .mp3 sound file with player name 'added to the match'
			// example: speechText += "<audio src='https://s3.amazonaws.com/ask-storage/tidePooler/OceanWaves.mp3'/>"	
			var speechText = 'Welcome';
			//var speechText = 'Welcome registered player with phone number, ';
				//speechText += '<say-as interpret-as="telephone">';
				//speechText += newMatchPlayer.data.Phone.N;
				//speechText += '</say-as>';					
				speechText += ', you have been added to the match on the  ';
				speechText += session.attributes.team;	
				speechText += ' team.';	
				console.log('speechText = ' + speechText);
				
			// if this is a doubles match, tell player their call sign	
			if (currentMatch.data.MatchType.S == 'doubles') {
				speechText += ' Your call sign for this match is ';
				speechText += callSign;
				console.log('speechText = ' + speechText);				
				console.log('callSign = ' + callSign);
				if (callSign == 'alpha') {
					var partnerCallSign = 'bravo';
				} else if (callSign == 'bravo') {
					var partnerCallSign = 'alpha';
				} else if (callSign == 'charlie') {
					var partnerCallSign = 'delta';
				} else if (callSign == 'delta') {
					var partnerCallSign = 'charlie';
				};
				console.log('partnerCallSign = ' + partnerCallSign);
				if ( (session.attributes.team == 'red' && currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo') ||
					 (session.attributes.team == 'blue' && currentMatch.data.MatchData.FirstBlueToServe == 'CharlieOrDelta') ) {
					speechText += '.<break time=\"0.2s\" />. Your partner\'s callsign will be ';
					speechText += partnerCallSign;
					speechText += '.<break time=\"0.2s\" /> I\'ll use them when it\'s your turn to serve.';
				};					
				// if the serve order has not yet been fully defined (both red and blue teams selected who serves first), then ask the user.
				if ( (session.attributes.team == 'red' && currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo') ||
					 (session.attributes.team == 'blue' && currentMatch.data.MatchData.FirstBlueToServe == 'CharlieOrDelta') ) {
					// we need to know which doubles player will be serving first, so set up getDoublesPlayerServingIntent
					speechText += ' Which one of you will be serving first, will it be: ';
					if (session.attributes.team == 'red') {
						speechText += ' Alpha, or Bravo?';
						var repromptTextToSay = 'Who will be serving first, Alpha or Bravo?';
					} else {
						speechText += ' Charlie, or Delta?';
						var repromptTextToSay = 'Who will be serving first, Charlie or Delta?';
					};
					delete session.attributes.phoneKey;
					delete session.attributes.team;					
					askSpeechAndSave(speechText, repromptTextToSay, currentMatch, response);
					return;
				};
			};
			console.log('speechText a = ' + speechText);
			delete session.attributes.phoneKey;
			delete session.attributes.team;	
			if (	(currentMatch.data.MatchType.S == 'singles' && 
					 currentMatch.data.Red1PlayerID.N !== '0' && 
					 currentMatch.data.Blue1PlayerID.N !== '0' ) ||
					 
					(currentMatch.data.MatchType.S == 'doubles' && 
					 currentMatch.data.Red1PlayerID.N !== '0' && 
					 currentMatch.data.Blue1PlayerID.N !== '0' &&
					 currentMatch.data.Red2PlayerID.N !== '0' && 
					 currentMatch.data.Blue2PlayerID.N !== '0' )	) {
				if (currentMatch.data.MatchType.S == 'singles')	{
					speechText += '<break time=\"0.3s\" /> Both ';
				} else {
					speechText += '<break time=\"0.3s\" /> All ';
				};
				speechText += 'players have now been added. If you are ready to start, say, begin the match.';
				var repromptTextToSay = 'If you are ready to start, say, begin the match.';				
			} else {
				if (currentMatch.data.MatchType.S == 'singles') {
					if (currentMatch.data.Red1PlayerID.N != 0) { // red singles player was added
						speechText += '<break time=\"0.3s\" />Now, you can add a player to the blue team, or begin the match..';
						var repromptTextToSay = 'Please say add a player or, begin the match.';						
					} else {
						speechText += '<break time=\"0.3s\" />Now, you can add a player to the red team, or begin the match.';
						var repromptTextToSay = 'Please say add a player or, begin the match.';						
					};
				} else { // this is a doubles match	
					console.log('speechText b = ' + speechText);				
					// there is at least 1 player of the 4	that has not yet been added			
						if (currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo' || 
							currentMatch.data.MatchData.FirstBlueToServe == 'CharlieOrDelta' ) { // 1 player has not yet been added to each team
							if (currentMatch.data.MatchData.FirstRedToServe == 'alpha' || currentMatch.data.MatchData.FirstRedToServe == 'bravo') {
								speechText += '<break time=\"0.3s\" /> You\'ve successfully added a player to the red team, now add a player to the blue team.';
								var repromptTextToSay = 'Please say add another player.';						
							} else {
								speechText += '<break time=\"0.3s\" /> You\'ve successfully added a player to the blue team, now add a player to the red team.';
								var repromptTextToSay = 'Please say add another player.';						
							};
						} else { // 2 players are signed in (at least one player to each team), but not all 4 
							console.log('speechText c = ' + speechText);
							if (currentMatch.data.Red1PlayerID.N != 0 && currentMatch.data.Red2PlayerID.N != 0 ) { // both red players are signed in
								speechText += '<break time=\"0.3s\" /> Both red players are now signed in. Would you like to add another player to the blue team, or begin the match?';
								console.log('speechText d = ' + speechText);
								var repromptTextToSay = 'Would you like to add another player or, begin the match?';						
							} else if (currentMatch.data.Blue1PlayerID.N != 0 && currentMatch.data.Blue2PlayerID.N != 0) { // both blue players are signed in
								speechText += '<break time=\"0.3s\" /> Both blue players are now signed in. Would you like to add another player to the red team, or begin the match?';
								console.log('speechText e = ' + speechText);
								var repromptTextToSay = 'Would you like to add another player or, begin the match?';											
							} else {
								speechText += '<break time=\"0.3s\" /> Would you like to add another player, or begin the match?';
								console.log('speechText f = ' + speechText);
								var repromptTextToSay = 'Would you like to add another player or, begin the match?';					
							};
						};
					};																														
				};
			
			askSpeechAndSave(speechText, repromptTextToSay, currentMatch, response);			
        });
    });
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

function formatMatchScore(currentMatch) {
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
	if (matchLeaderScore == 1 ) {
		middlePart = ' set to ';
	} else if (matchLeaderScore > 1) {
		middlePart = ' sets to ';
	};
	
	var formattedMatchScore = matchLeaderScore + middlePart + otherTeamScore + matchLeader;		
	return formattedMatchScore;
};

function formatSetScore(setToSay, sayTeam, currentMatch) {
	console.log('entering formatSetScore function');
	if (setToSay == 1) {
		var rawScores = currentMatch.data.MatchData.Set1Score.split(" ");				
	} else if (setToSay == 2) {
		var rawScores = currentMatch.data.MatchData.Set2Score.split(" ");
	} else if (setToSay == 3) {
		var rawScores = currentMatch.data.MatchData.Set3Score.split(" ");
	};

	var formattedSetScore = rawScores[0] + ' to ' + rawScores[1] + ', ';
	if ( (rawScores[2]) && sayTeam == true ) {
		formattedSetScore += rawScores[2] + ' ' + rawScores[3];
	};
	
	return formattedSetScore;
};

function pointToPlayer(colorWinner, currentMatch, response) {
	console.log('entering pointToPlayer function');
	//console.log('currentMatch in intentHandlers = ' + JSON.stringify(currentMatch) );
	console.log('Red Team game score before = ' + currentMatch.data.MatchData.RedTeamGameScore);
	console.log('Blue Team game score before = ' + currentMatch.data.MatchData.BlueTeamGameScore);
	console.log('Current Server = ' + currentMatch.data.MatchData.WhosServe);
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
		var pointWinner = 'red';
		var pointLoser = 'blue';
		var pointWinnerScore = incrementPlayerGameScore(currentMatch.data.MatchData.RedTeamGameScore);
		var pointLoserScore = currentMatch.data.MatchData.BlueTeamGameScore;
		var pointWinnerSetScore = currentMatch.data.MatchData.RedTeamSetScore;
		var pointLoserSetScore = currentMatch.data.MatchData.BlueTeamSetScore;
		var pointWinnerSetsWon = currentMatch.data.MatchData.RedTeamSetsWon;
		var pointWinnerGamesWon = currentMatch.data.MatchData.RedTeamTotalGamesWon;
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
		var pointWinner = 'blue';
		var pointLoser = 'red';
		var pointWinnerScore = incrementPlayerGameScore(currentMatch.data.MatchData.BlueTeamGameScore);
		var pointLoserScore = currentMatch.data.MatchData.RedTeamGameScore;
		var pointWinnerSetScore = currentMatch.data.MatchData.BlueTeamSetScore;
		var pointLoserSetScore = currentMatch.data.MatchData.RedTeamSetScore;
		var pointWinnerSetsWon = currentMatch.data.MatchData.BlueTeamSetsWon;
		var pointWinnerGamesWon = currentMatch.data.MatchData.BlueTeamTotalGamesWon;
		if (currentMatch.data.MatchData.WhosServe == 'blue') {
			var serverWonPoint = true;
			currentMatch.data.MatchData.BluePointsWonOnServe++;
		} else if (currentMatch.data.MatchData.WhosServe == 'red') {
			var serverWonPoint = false;
			currentMatch.data.MatchData.BluePointsWonOffServe++;
		};
	};			
	if (pointWinnerScore == 50) { // winner had 40 and then won the point, don't know what loser had yet
		if (currentMatch.data.MatchData.PlayGamePoint == true) { // this is being played as a game point match, so pointWinner wins the game
			pointWinnerWinsGame();
			return;
		};
		if (pointLoserScore == 40) { // point was deuce, now advantage pointWinner
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
	if (pointWinnerScore != 50 && pointLoserScore != 0) { // pointWinner had 30 or below and pointLoser had 15 or above, must handle format separately
		if (serverWonPoint) {
			var combinedScore = ("" + pointWinnerScore + pointLoserScore );
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
	function pointWinnerWinsGame() {
		console.log('entering pointWinnerWinsGame');					
		pointWinnerSetScore++;
		pointWinnerGamesWon++;
		speechText = 'Game, ' + pointWinner + ' team.';
		// check to see if pointWinner also wins the set	
		if ( (pointWinnerSetScore == 6 && pointLoserSetScore < 5) || (pointWinnerSetScore == 7 && pointLoserSetScore < 6) ) { // pointWinner wins the set
		
			pointWinnerSetsWon++; // increment the number of sets won for pointWinner
			if (colorWinner == 'point red') { // update red stats
				currentMatch.data.MatchData.RedTeamSetsWon = pointWinnerSetsWon;
				currentMatch.data.MatchData.RedTeamSetScore = pointWinnerSetScore;
				currentMatch.data.MatchData.RedTeamTotalGamesWon = pointWinnerGamesWon;
			} else { // update blue stats
				currentMatch.data.MatchData.BlueTeamSetsWon = pointWinnerSetsWon;
				currentMatch.data.MatchData.BlueTeamSetScore = pointWinnerSetScore;
				currentMatch.data.MatchData.BlueTeamTotalGamesWon = pointWinnerGamesWon;
			};
			updateSetScores(currentMatch); // update Set1Score, Set2Score or Set3Score
		
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
			var formattedSetScore = formatSetScore(currentMatch.data.MatchData.Set, false, currentMatch);
			speechText += formattedSetScore;
			
			// check to see if pointWinner also wins the match
			if (pointWinnerSetsWon == 2) { // pointWinner wins the match
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
				var formatted3rdSetScore = formatSetScore(3, false, currentMatch);
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
					var formattedSetScore = formatSetScore(i, false, currentMatch);
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
		if (colorWinner == 'point red') { // red won the point so update game and set scores
			currentMatch.data.MatchData.RedTeamSetScore = pointWinnerSetScore;
			currentMatch.data.MatchData.RedTeamSetsWon = pointWinnerSetsWon;
			currentMatch.data.MatchData.RedTeamTotalGamesWon = pointWinnerGamesWon;
		} else { // blue won the point so update game and set scores
			currentMatch.data.MatchData.BlueTeamSetScore = pointWinnerSetScore;
			currentMatch.data.MatchData.BlueTeamSetsWon = pointWinnerSetsWon;
			currentMatch.data.MatchData.BlueTeamTotalGamesWon = pointWinnerGamesWon;
		};
		updateSetScores(currentMatch); // update Set1Score, Set2Score or Set3Score
		//tellSpeechAndSave(speechText, currentMatch, response);										
		startNewGame(currentMatch, response); // the match continues with a new game, either in a new set or the old set
		console.log('right before Return');
		return; // *********************************** exit the loadMatch function **********************************						
	};
};

function updateSetScores(currentMatch) {
	console.log('entering updateSetScores function');	
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
		speechText += rawScores[2] + ' ' + rawScores[3]+ ' leads the set, ' + rawScores[0] + ' to ' + rawScores[1];
	} else if ( rawScores[0] != '0' && rawScores[1] != '0' ) { // don't say it is tied if the score is 0-0
		speechText += 'The set is tied, ' + rawScores[0] + ' to ' + rawScores[1];
	};
						                           
	speechText += '<break time=\"0.4s\" />Now starting a new game.';

	// If this is a singles match, serve goes to the next team
	if (currentMatch.data.MatchType.S == 'singles') {	
		speechText += '<break time=\"0.4s\" />It is ';
		speechText += currentServer;
		speechText += ' team\'s serve.';
	// If this is a doubles match, figure out who is serving next	
	} else if (currentMatch.data.MatchType.S == 'doubles') { 
		var priorDoublesServerIndex = currentMatch.data.MatchData.DoublesServeSequence.indexOf(currentMatch.data.MatchData.DoublesServer);
		var nextDoublesServer = priorDoublesServerIndex+1;
		if (priorDoublesServerIndex < 3) {
			currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[nextDoublesServer];
		} else {
			currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[0];
		};
		speechText += '<break time=\"0.4s\" />It is ';
		speechText += currentMatch.data.MatchData.DoublesServer;
		speechText += '\'s serve on the ';
		speechText += currentServer;
		speechText += ' team.';
	}

	// figure out if it is time to switch sides
	var totalGamesPlayedInSet = currentMatch.data.MatchData.RedTeamSetScore + 
								currentMatch.data.MatchData.BlueTeamSetScore;
	function isOdd(num) {
		return num % 2;
	};	
	if ( isOdd(totalGamesPlayedInSet) && currentMatch.data.MatchData.SwitchSides == true) {
		speechText += '<break time=\"0.5s\" />Time to switch sides.';
	};

	// reset the game scores to 0 for the new game
	currentMatch.data.MatchData.RedTeamGameScore = 0;	
	currentMatch.data.MatchData.BlueTeamGameScore = 0;
	currentMatch.data.MatchData.Deuce = false;
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

function useTennisLingo( serverScore, receiverScore, deuceFlag, gamePointFlag ) {
	console.log('entering useTennisLingo function');
	console.log('incoming serverScore = ' + serverScore);
	console.log('incoming receiverScore = ' + receiverScore);
	console.log('incoming deuceFlag = ' + deuceFlag);	
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
	//console.log('current match = ' + JSON.stringify(currentMatch) );
	var currentPlayers = [];
	if (currentMatch.data.Red1PlayerID.N !== '0') {
		currentPlayers.push(currentMatch.data.Red1PlayerID.N);
	}
	if (currentMatch.data.Blue1PlayerID.N !== '0') {
		currentPlayers.push(currentMatch.data.Blue1PlayerID.N);
	}	
	if (currentMatch.data.Red2PlayerID.N !== '0') {
		currentPlayers.push(currentMatch.data.Red2PlayerID.N);
	}	
	if (currentMatch.data.Blue2PlayerID.N !== '0') {
		currentPlayers.push(currentMatch.data.Blue2PlayerID.N);
	}
	console.log('currentPlayers = ' + JSON.stringify(currentPlayers) );	
	return currentPlayers;
};
														
function updateScores(currentMatch, currentGameScore, currentServer) {
	console.log('entering updateScores function');
	console.log('currentMatch within updateScores = ' + JSON.stringify(currentMatch) );	
            
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
	} else if (currentGameScore == 'love 40' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
	};
	if (currentGameScore == '0 40' && currentServer == 'red' ) {
		currentMatch.data.MatchData.RedTeamGameScore = 0;
		currentMatch.data.MatchData.BlueTeamGameScore = 40;
	} else if (currentGameScore == '0 40' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 0;
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
	} else if (currentGameScore == '1,540' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 15;
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
	} else if (currentGameScore == '3,040' && currentServer == 'blue') {
		currentMatch.data.MatchData.RedTeamGameScore = 40;
		currentMatch.data.MatchData.BlueTeamGameScore = 30;
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
		currentMatch.data.MatchData.Deuce = true;		
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

function createMatchSummaryContent (currentMatch) {
	console.log('entering createMatchSummaryContent function');
	
	var matchSummaryContent = {
		speechOutput: "",
		cardTitle: "",
		cardContent: "",
		textToSend:"",
		noMeaningfulStats: false
	};

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
	console.log('hours = ' + timeDiff);

	
	var totalGamesPlayed = currentMatch.data.MatchData.RedTeamTotalGamesWon + currentMatch.data.MatchData.BlueTeamTotalGamesWon;
	var totalPointsPlayed = currentMatch.data.MatchData.RedTeamTotalPointsWon + currentMatch.data.MatchData.BlueTeamTotalPointsWon;
	console.log('totalGamesPlayed = ' + totalGamesPlayed);
	console.log('totalPointsPlayed = ' + totalPointsPlayed);
	
	var redPercentGamesWon = ((currentMatch.data.MatchData.RedTeamTotalGamesWon / totalGamesPlayed) * 100).toFixed(0);
	var bluePercentGamesWon = ((currentMatch.data.MatchData.BlueTeamTotalGamesWon / totalGamesPlayed) * 100).toFixed(0);
	console.log('redPercentGamesWon = ' + redPercentGamesWon);
	console.log('bluePercentGamesWon = ' + bluePercentGamesWon);
	
	var redPercentPointsWon = ((currentMatch.data.MatchData.RedTeamTotalPointsWon / totalPointsPlayed) * 100).toFixed(0);
	var bluePercentPointsWon = ((currentMatch.data.MatchData.BlueTeamTotalPointsWon / totalPointsPlayed) * 100).toFixed(0);	
	console.log('redPercentPointsWon = ' + redPercentPointsWon);
	console.log('bluePercentPointsWon = ' + bluePercentPointsWon);
	
	var redPercentWonWhileServing = ((currentMatch.data.MatchData.RedPointsWonOnServe / currentMatch.data.MatchData.RedTeamTotalPointsWon) * 100).toFixed(0);
	var redPercentWonOnServe = ((currentMatch.data.MatchData.RedPointsWonOnServe / currentMatch.data.MatchData.RedPointsServed) * 100).toFixed(0);
	console.log('redPercentWonWhileServing = ' + redPercentWonWhileServing);
	console.log('redPercentWonOnServe = ' + redPercentWonOnServe);

	var bluePercentWonWhileServing = ((currentMatch.data.MatchData.BluePointsWonOnServe / currentMatch.data.MatchData.BlueTeamTotalPointsWon) * 100).toFixed(0);
	var bluePercentWonOnServe = ((currentMatch.data.MatchData.BluePointsWonOnServe / currentMatch.data.MatchData.BluePointsServed) * 100).toFixed(0);
	console.log('bluePercentWonWhileServing = ' + bluePercentWonWhileServing);
	console.log('bluePercentWonOnServe = ' + bluePercentWonOnServe);

	// call out the total time played, as well as total number of games and points played			
	var formattedMatchScore = formatMatchScore(currentMatch);

	if (currentMatch.data.MatchData.RedTeamSetsWon == 0 && currentMatch.data.MatchData.BlueTeamSetsWon == 0) {
		speechText = 'the match is still tied at love love'; 
	} else if (currentMatch.data.MatchData.RedTeamSetsWon == 1 && currentMatch.data.MatchData.BlueTeamSetsWon == 1) {
		speechText = 'the match is tied at one set each';
	} else {
		speechText = 'The score of the match is: ';
		speechText += '<break time=\"0.1s\" />';
		speechText += formattedMatchScore;				
	};			

	if (currentMatch.data.MatchData.Set >= 1) {
		var setToSay = 1;
		var formattedSetScore = formatSetScore(setToSay, true, currentMatch);	
		speechText += '<break time=\"0.3s\" />First set: ' + formattedSetScore;				
	};
	if (currentMatch.data.MatchData.Set >= 2) {
		var setToSay = 2;
		var formattedSetScore = formatSetScore(setToSay, true, currentMatch);	
		speechText += '<break time=\"0.3s\" />Second set: ' + formattedSetScore;
	};
	if (currentMatch.data.MatchData.Set >= 3) {
		var setToSay = 3;
		var formattedSetScore = formatSetScore(setToSay, true, currentMatch);	
		speechText += '<break time=\"0.3s\" />Second set: ' + formattedSetScore;
	};			
						
	speechText += '<break time=\"0.4s\" />You have played for ';
	if (hours > 0) {
		speechText += hours;
		speechText += ' hour'
		if (hours > 1) {
			speechText += 's';
		}
		speechText += ' and '
	}
	speechText += minutes;
		speechText += ' minute'
		if (minutes > 1 || minutes < 1) {
			speechText += 's';
		}
	// stop here if there is nothing further to report yet	
	if (hours < 1 && minutes < 1) {
		speechText += ', there are no meaningful statistics to report yet.';
		var speechOutput = {
			speech: '<speak>' + speechText + '</speak>',
			type: AlexaSkill.speechOutputType.SSML
		};
		matchSummaryContent.speechOutput = speechOutput;
		matchSummaryContent.noMeaningfulStats = true;
		return matchSummaryContent;
	};
	
	speechText += '<break time=\"0.3s\" />. In that time, you played a total of ';
	speechText += totalGamesPlayed;			
	speechText += ' game';
	if (totalGamesPlayed > 1 || totalGamesPlayed < 1) {
		speechText += 's';
	};
	speechText += ', and ' + totalPointsPlayed;
	speechText += ' individual point';
	if (totalPointsPlayed > 1 || totalPointsPlayed < 1) {
		speechText += 's';
	};				
	
	// call out total number of games and points won by red
	speechText += '<break time=\"0.3s\" />Red team';
	if (currentMatch.data.MatchType.S == 'singles') {
		speechText += ' player, ';
	};

	if ( !(isNaN(redPercentGamesWon)) ) {
		speechText += ' you won ';
		speechText += redPercentGamesWon;				
		speechText += ' percent of the games. <break time=\"0.2s\" />';
		var redCardText = 'won ' + redPercentGamesWon + '% of games' + "\n";
	};					
	speechText += 'You won a total of ';
	speechText += redPercentPointsWon;
	speechText += ' percent of the points overall.';	
	redCardText += 'won ' + redPercentPointsWon + '% of points' + "\n";

	if (currentMatch.data.MatchData.RedPointsServed != 0) {
		speechText += '<break time=\"0.3s\" />. You won ';
		speechText += redPercentWonOnServe;
		speechText += ' percent of the points, when you were serving.';
		redCardText += 'won ' + redPercentWonOnServe + '% of points that you served' + "\n";				
	} else {
		speechText += '<break time=\"0.3s\" /> You haven\'t yet served in this match.';
	};
	/******		Excluding this for now as the statistic is confusing		
	if (currentMatch.data.MatchData.RedTeamTotalPointsWon != 0) {
		// call out percentages for points won on serve and off serve for red
		speechText += '<break time=\"0.4s\" />';
		speechText += redPercentWonWhileServing;	
		speechText += ' percent of your total winning points occurred when you were serving.';
		redCardText += 'won ' + redPercentWonWhileServing + '% of total points while serving' + "\n";				
	};	
	*/			

	// call out total number of games and points won by blue
	speechText += '<break time=\"0.3s\" /> Blue team';
	if (currentMatch.data.MatchType.S == 'singles') {
		speechText += ' player';
	};

	if ( !(isNaN(bluePercentGamesWon)) ) {
		speechText += ' you won ';
		speechText += bluePercentGamesWon;				
		speechText += ' percent of the games. <break time=\"0.2s\" />';
		var blueCardText = 'won ' + bluePercentGamesWon + '% of games' + "\n";				
	};				
	speechText += 'You won a total of ';
	speechText += bluePercentPointsWon;
	speechText += ' percent of the points overall.';
	blueCardText += 'won ' + bluePercentPointsWon + '% of points' + "\n";


	if (currentMatch.data.MatchData.BluePointsServed != 0) {
		speechText += '<break time=\"0.3s\" />. You won ';
		speechText += bluePercentWonOnServe;
		speechText += ' percent of the points when you were serving.';
		blueCardText += 'won ' + bluePercentWonOnServe + '% of points that you served' + "\n";				
	} else {
		speechText += '<break time=\"0.3s\" /> You haven\'t yet served in this match.';
	};

	/******		Excluding this for now as the statistic is confusing
	if (currentMatch.data.MatchData.BlueTeamTotalPointsWon != 0) {
		// call out percentages for points won on serve and off serve for red
		speechText += '<break time=\"0.4s\" />';
		speechText += bluePercentWonWhileServing;	
		speechText += ' percent of your total winning points occurred when you were serving.';
		blueCardText += 'won ' + bluePercentWonWhileServing + '% of total points while serving' + "\n";				
	};
	*/

	// idea: add a stat for longest point streak for each team
	// idea: add 'would you like me to text these results to the players that signed in to this match?'			

	var today = new Date(),
		dateString = (today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear().toString().substr(2,2);			
	
	var cardTitle = dateString + ' Match Stats';
	
	var elapsedTimeString = '';
	if (hours > 0) {
		elapsedTimeString = hours + ' hr';
		if (hours > 1) {
			elapsedTimeString += 's ';
		};				
	};
	elapsedTimeString += ' ' + minutes + ' min'
	if (minutes > 1) {
		elapsedTimeString += 's ';
	};
	
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
	var formattedMatchScore = matchLeaderScore + '-' + otherTeamScore + matchLeader;			
							
	var rawScores1 = currentMatch.data.MatchData.Set1Score.split(" ");
	var rawScores2 = currentMatch.data.MatchData.Set2Score.split(" ");
	var rawScores3 = currentMatch.data.MatchData.Set3Score.split(" ");
											
	var cardContent = 'Time played: ' + elapsedTimeString + "\n";
	cardContent += 'Match type: ' + currentMatch.data.MatchType.S + "\n";
	cardContent += 'Match score: ' + formattedMatchScore + "\n";
	cardContent += 'Set 1 score: ' + rawScores1[0] + '-' + rawScores1[1]
	if (rawScores1[2]) {
		cardContent += ", " + rawScores1[2] + " " + rawScores1[3] + "\n";
	} else {
		cardContent += "\n";
	};
	cardContent += 'Set 2 score: ' + rawScores2[0] + '-' + rawScores2[1]
	if (rawScores2[2]) {
		cardContent += ", " + rawScores2[2] + " " + rawScores2[3] + "\n";
	} else {
		cardContent += "\n";
	};
	cardContent += 'Set 3 score: ' + rawScores3[0] + '-' + rawScores3[1]
	if (rawScores3[2]) {
		cardContent += ", " + rawScores3[2] + " " + rawScores3[3] + "\n";
	} else {
		cardContent += "\n";
	};
	cardContent += 'Games played: ' + totalGamesPlayed + "\n";
	cardContent += 'Points played: ' + totalPointsPlayed + "\n" + "\n";
	cardContent += 'Red Team: ' + "\n";
	cardContent += redCardText + "\n";
	cardContent += 'Blue Team: ' + "\n";
	cardContent += blueCardText + "\n";
	
	speechText += '<break time=\"0.5s\" /> To text these results to players in this match that have opted in to texts, say, text the summary.';
	
	var speechOutput = {
		speech: '<speak>' + speechText + '</speak>',
		type: AlexaSkill.speechOutputType.SSML
	};
	
	var textToSend = cardTitle + "\n" + "\n" + cardContent;
	console.log('textToSend = ' + textToSend);	
	
	// speechOutput is the voice summary of the match
	// cardTitle is the title of the card
	// cardContent is the content of the card
	// textToSend is the text message to send
	
	matchSummaryContent = {
		speechOutput: speechOutput,
		cardTitle: cardTitle,
		cardContent: cardContent,
		textToSend:textToSend,
		noMeaningfulStats: false
	};
	
	//console.log('matchSummaryContent before return = ' + JSON.stringify(matchSummaryContent) );
	
	return matchSummaryContent;

};

function initializeSNSforPlayer(session, response) {
	// sets up the SNS Topic that will be used to subscribe a player to for ongoing notification from this skill
	console.log('entering initializeSNSforPlayer');
	console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey)
	// this function is only invoked if session.attributes.phoneKey has been set, which is needed to load the right player.
	// 1. call playerStorage.loadPlayer, and pass 'session' into it. 
	// 2. assign the results of that to the variable 'newLoadedPlayer'.
	// 3. then pass 'newLoadedPlayer' into the code in the braces.
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
		playerSMS.sendTopicSubscribeRequest(newLoadedPlayer.data.Phone.N, function (topicArn) {
			if (!topicArn) {
				speechText = 'Hmm, there was a problem getting that set up. Please try again later.';				
			} else { // successfully created Topic ARN and sent the subscription request
				console.log('newLoadedPlayer.data.TopicARN.S = ' + newLoadedPlayer.data.TopicARN.S);
				newLoadedPlayer.data.TopicARN.S = topicArn;
				speechText = 'Text sent. Once you reply, you\'ll be set up to receive match summaries via text when you ask for them.';
			};	
			newLoadedPlayer.save(session, function () {
				response.tell(speechText);	
			});									
        });			
    });
};

function sendAText(sendToPlayer, messageToSend, session) {
	console.log('entering SendAText function');
	session.attributes.phoneKey = sendToPlayer;
	playerStorage.loadPlayer(session, function (newLoadedPlayer) {
		console.log('newLoadedPlayer = ' + JSON.stringify(newLoadedPlayer) )
		if (newLoadedPlayer == 'playerNotFound') {
			var result = 'problems';
			return result;
		} else {
			var ARNtoSend = newLoadedPlayer.data.TopicARN.S;
			console.log('ARNtoSend = ' + ARNtoSend );
		};
		
		// pass in the Player ID (phone number) who should get the text
		playerSMS.publishSMS(ARNtoSend, messageToSend, function (success) {
			console.log('back within the braces after callback');
			if (success == false) {
				var result = 'problems';				
			} else { 
				var result = 'success';
			};	
			//return result;								
		});	
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
				console.log('Didnt get the match type. Move to dialog approach');				
				var textToSay = 'OK. Are you playing singles or doubles?';
				var repromptTextToSay = 'Will this be a singles match or a doubles match?';
				askSpeech(textToSay, repromptTextToSay, response);
				return;
			};						
			
			// Ask who has the first serve if unknown
			if (teamServing.error) {
				// Didn't get who is serving first. Move to dialog approach
				console.log('Didnt get who is serving. Move to the dialog');
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
			console.log('firstToServeSlot.value = ' + firstToServeSlot.value);
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
		console.log('intent = ' + JSON.stringify(intent));
		console.log('session.attributes.singlesOrDoubles = ' + session.attributes.singlesOrDoubles);
		console.log('session.attributes.firstToServe = ' + session.attributes.firstToServe);
		console.log('session = ' + JSON.stringify(session));
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
				console.log('session should now contain match type');
				console.log('session = ' + JSON.stringify(session));
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
			console.log('session.attributes.team = ' + session.attributes.firstToServe);

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

    intentHandlers.getDoublesPlayerServingIntent = function (intent, session, response) {
        console.log('entering getDoublesPlayerServingIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			console.log('intent.slots.TeamMemberServing.value = ' + intent.slots.TeamMemberServing.value);
			// if First To Serve has not yet been defined for each team, define it for one of the teams based on the incoming intent. 
			if ( ( (intent.slots.TeamMemberServing.value == 'alpha' || intent.slots.TeamMemberServing.value == 'bravo')  && currentMatch.data.MatchData.FirstRedToServe == 'AlphaOrBravo') ||
				 ( (intent.slots.TeamMemberServing.value == 'Charlie' || intent.slots.TeamMemberServing.value == 'delta') && currentMatch.data.MatchData.FirstBlueToServe == 'CharlieOrDelta') ) {
				console.log('now establishing First To Serve');
				if (intent.slots.TeamMemberServing.value == 'alpha' || intent.slots.TeamMemberServing.value == 'bravo') {
					currentMatch.data.MatchData.FirstRedToServe = intent.slots.TeamMemberServing.value;
					var speechOutput = currentMatch.data.MatchData.FirstRedToServe;
					console.log('currentMatch.data.MatchData.FirstRedToServe = ' + currentMatch.data.MatchData.FirstRedToServe);
					speechOutput += ' will serve first on the red team. ';
				} else if (intent.slots.TeamMemberServing.value == 'Charlie' || intent.slots.TeamMemberServing.value == 'delta') {
					currentMatch.data.MatchData.FirstBlueToServe = intent.slots.TeamMemberServing.value;
					console.log('currentMatch.data.MatchData.FirstBlueToServe = ' + currentMatch.data.MatchData.FirstBlueToServe);
					if (currentMatch.data.MatchData.FirstBlueToServe == 'Charlie') {currentMatch.data.MatchData.FirstBlueToServe = 'charlie' };
					var speechOutput = currentMatch.data.MatchData.FirstBlueToServe;
					speechOutput += ' will serve first on the blue team. ';
				};
			};
			// if we know First To Serve for both teams, establish the DoublesServeSequence.
			if ( (currentMatch.data.MatchData.FirstRedToServe == 'alpha' || currentMatch.data.MatchData.FirstRedToServe == 'bravo' ) &&
				 (currentMatch.data.MatchData.FirstBlueToServe == 'charlie' || currentMatch.data.MatchData.FirstBlueToServe == 'delta' ) ) {
				console.log('now in section to establish the DoublesServeSequence')
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
			console.log('currentMatch.data.MatchData.DoublesServeSequence after defining DoublesServeSequence = ' + JSON.stringify(currentMatch.data.MatchData.DoublesServeSequence));			
			if (currentMatch.data.MatchType.S == 'doubles' && 
					 currentMatch.data.Red1PlayerID.N !== '0' && 
					 currentMatch.data.Blue1PlayerID.N !== '0' &&
					 currentMatch.data.Red2PlayerID.N !== '0' && 
					 currentMatch.data.Blue2PlayerID.N !== '0' ) { // all players have been added

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
					if (currentMatch.data.Red1PlayerID.N != 0 && currentMatch.data.Red2PlayerID.N != 0 ) { // both red players are signed in
						speechText = '<break time=\"0.3s\" /> Both red players are now signed in. Would you like to add another player to the blue team, or begin the match?';
						var repromptTextToSay = 'Would you like to add another player or, begin the match?';						
					} else if (currentMatch.data.Blue1PlayerID.N != 0 && currentMatch.data.Blue2PlayerID.N != 0) { // both blue players are signed in
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
			if (currentMatch.data.MatchType.S == 'doubles') {
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
					var speechText = 'When a team wins a point, say either: Point red, or point blue.<break time=\"0.2s\" /> New ';
					speechText += currentMatch.data.MatchType.S ;
					speechText += ' match starting now. ';
					speechText += currentMatch.data.MatchData.WhosServe;
					speechText += ' team\'s serve.';
					speechText += ' First to serve is call sign ';
					if (currentMatch.data.MatchData.WhosServe == 'red') {
						speechText += currentMatch.data.MatchData.FirstRedToServe;
					} else {
						speechText += currentMatch.data.MatchData.FirstBlueToServe;
					}
					speechText += '<break time=\"0.4s\" />Good luck players!';			
					tellSpeech(speechText, currentMatch, response);
				};
			} else {
				// this is a singles match and can be started immediately	
				var speechText = 'When a team wins a point, say either: Point red, or point blue.<break time=\"0.2s\" /> New ';
				speechText += currentMatch.data.MatchType.S;
				speechText += ' match starting now. ';
				speechText += currentMatch.data.MatchData.WhosServe;
				speechText += ' team\'s serve.';	
				speechText += '<break time=\"0.4s\" />Good luck players!';
				tellSpeech(speechText, currentMatch, response);
			};
        });
    };

    intentHandlers.SkipSignInIntent = function (intent, session, response) {
        console.log('entering SkipSignInIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			
			if (currentMatch.data.MatchType.S == 'doubles') {
				// assign doubles partner call signs according to who will serve first on each team
				if (currentMatch.data.MatchData.WhosServe == 'red') {
					currentMatch.data.MatchData.FirstRedToServe = 'alpha';
					currentMatch.data.MatchData.DoublesServeSequence.push('alpha', 'charlie', 'bravo', 'delta');
				} else {
					currentMatch.data.MatchData.FirstBlueToServe = 'charlie';
					currentMatch.data.MatchData.DoublesServeSequence.push('charlie', 'alpha', 'delta', 'bravo');
				};
				currentMatch.data.MatchData.DoublesServer = currentMatch.data.MatchData.DoublesServeSequence[0];
				var speechText = 'In';
				speechText += ' order to keep track of who is serving, I will assign you callsigns.';
				speechText += ' The player serving first on the ';
				speechText += 'red team will be: callsign, alpha.<break time=\"0.2s\" /> Alpha\'s partner will be: callsign bravo.'
				speechText += '<break time=\"0.4s\" />The player serving first on the blue team will be callsign charlie.';
				speechText += '<break time=\"0.2s\" />Charlie\'s partner will be callsign delta.'
				speechText += '<break time=\"0.4s\" />When a team wins a point, say either: Point red, or point blue.<break time=\"0.2s\" /> New ';
				speechText += currentMatch.data.MatchType.S ;
				speechText += ' match starting now. ';
				speechText += currentMatch.data.MatchData.WhosServe;
				speechText += ' team\'s serve.<break time=\"0.4s\" />';
				speechText += currentMatch.data.MatchData.DoublesServer;
				speechText += ' will serve first.';
				speechText += '<break time=\"0.4s\" />Good luck players!';			
				tellSpeechAndSave(speechText, currentMatch, response);
			} else {
				// this is a singles match and can be started immediately	
				var speechText = 'When a team wins a point, say either: Point red, or point blue.<break time=\"0.2s\" /> New ';
				speechText += currentMatch.data.MatchType.S;
				speechText += ' match starting now. ';
				speechText += currentMatch.data.MatchData.WhosServe;
				speechText += ' team\'s serve.';	
				speechText += '<break time=\"0.4s\" />Good luck players!';
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
			console.log('intent.slots.TeamServing.value = ' + intent.slots.TeamServing.value);			
			
			if (!intent.slots.TeamServing.value) { 			
				var textToSay = 'OK. Who would you like to have serve now? Please say <break time=\"0.2s\" /> change to red serve or '; 
				textToSay += '<break time=\"0.2s\" /> change to blue serve.';
				var repromptTextToSay = 'Say <break time=\"0.2s\" /> change to red serve or<break time=\"0.2s\" /> change to blue serve.';
				askSpeech(textToSay, repromptTextToSay, response);					
                return;
			}
			
			var colorIn = intent.slots.TeamServing.value;	
			var currentServer = setColor(colorIn);
	
			currentMatch.data.MatchData.WhosServe = currentServer;			
			
            var speechText = 'It is now ';
            speechText += currentServer ;
            speechText += ' team\'s serve.'; 
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };
	
	intentHandlers.PointToPlayerIntent = function (intent, session, response) {
        console.log('entering PointToPlayerIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			var colorWinner = intent.slots.PointToPlayer.value;
			pointToPlayer(colorWinner, currentMatch, response);
		});
	};
            
    intentHandlers.ChangeGameScoreIntent = function (intent, session, response) {
        console.log('entering ChangeGameScoreIntent ');
        matchStorage.loadMatch(session, function (currentMatch) {
			
			var redScoreBefore = currentMatch.data.MatchData.RedTeamGameScore; 
            var blueScoreBefore = currentMatch.data.MatchData.BlueTeamGameScore;						
			var currentServer = currentMatch.data.MatchData.WhosServe;
            //console.log('Current Game Score = ' + intent.slots.GameScore.value; );
            		
			// update the scores based on the exact score specified by the user
			var updatedMatch = updateScores(currentMatch, intent.slots.GameScore.value, currentServer);
           
            //console.log('Red Team game score after = ' + updatedMatch.data.MatchData.RedTeamGameScore);
            //console.log('Blue Team game score after = ' + updatedMatch.data.MatchData.BlueTeamGameScore);
			
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
			// 1. call playerStorage.newPlayer, and pass 'session' into it. Session now includes session.attributes.newPlayerPhone.
			// 2. assign the results of that to the variable 'newRegisteredPlayer'.
			// 3. then pass 'newRegisteredPlayer' into the code in the braces.
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
		console.log('entering AddPlayerDialogIntent');
		console.log('intent.slots.Phone.value = ' + intent.slots.Phone.value);
		console.log('intent.slots.Team.value = ' + intent.slots.Team.value);
		console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey);
		console.log('session.attributes.team = ' + session.attributes.team);
		console.log('session = ' + JSON.stringify(session));
		handleOneshotAddPlayerRequest(intent, session, response);
		
		/**
		 * This handles the one-shot interaction, where the user utters a phrase like:
		 * 'Alexa, use Keeper and add 425-890-8485 to blue team'.
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
			console.log('intent.slots.Team.value = ' + intent.slots.Team.value);
			console.log('session.attributes.team = ' + session.attributes.team);			
			
			// Determine phone
			var playerPhone = getPhoneFromIntent(intent);
			if (playerPhone.error) {
				// Didn't get the phone number. Move to dialog approach
				console.log('Didnt get the phone number. move to the dialog');
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
		console.log('intent.slots.Phone.value = ' + intent.slots.Phone.value);
		console.log('intent.slots.Team.value = ' + intent.slots.Team.value);
		console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey);
		console.log('session.attributes.team = ' + session.attributes.team);
		console.log('session = ' + JSON.stringify(session));
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
			console.log('intent.slots.Phone.value = ' + intent.slots.Phone.value);
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
			console.log('session.attributes.team = ' + session.attributes.team);

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
            console.log('Blue Team set score before = ' + currentMatch.data.MatchData.BlueTeamSetScore); 
			console.log('Red Team set score before = ' + currentMatch.data.MatchData.RedTeamSetScore);
			currentMatch.data.MatchData.RedTeamSetScore = intent.slots.RedSetScore.value;
			currentMatch.data.MatchData.BlueTeamSetScore = intent.slots.BlueSetScore.value;
			console.log('newRedSetScore = ' + currentMatch.data.MatchData.RedTeamSetScore);
			console.log('newBlueSetScore = ' + currentMatch.data.MatchData.BlueTeamSetScore);

			updateSetScores(currentMatch);
								
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
            console.log('Blue Team match score before = ' + currentMatch.data.MatchData.BlueTeamSetsWon); 
			console.log('Red Team match score before = ' + currentMatch.data.MatchData.RedTeamSetsWon);
			currentMatch.data.MatchData.RedTeamSetsWon = intent.slots.RedMatchScore.value;
			currentMatch.data.MatchData.BlueTeamSetsWon = intent.slots.BlueMatchScore.value;
			console.log('new RedTeamSetsWon = ' + currentMatch.data.MatchData.RedTeamSetsWon);
			console.log('new BlueTeamSetsWon = ' + currentMatch.data.MatchData.BlueTeamSetsWon);
						
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
			
			console.log('intent.slots.Team.value = ' + intent.slots.Team.value);			

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
            var speechText = 'New game started, ';
            speechText += currentServer ;
            speechText += ' team\'s serve';			
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };		
	
    intentHandlers.NewSetIntent = function (intent, session, response) {
        console.log('entering NewSetIntent');
        matchStorage.loadMatch(session, function (currentMatch) {
			
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
            var speechText = 'New set started, ';
            speechText += currentServer ;
            speechText += ' team\'s serve';			
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };
	
	intentHandlers.DontSwitchSidesIntent = function (intent, session, response) {
        console.log('entering DontSwitchSidesIntent');
        matchStorage.loadMatch(session, function (currentMatch) {				
			currentMatch.data.MatchData.SwitchSides = false;						
            var speechText = 'OK, I won\'t prompt you to switch sides for this match';		
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
			currentMatch.data.MatchData.SwitchSides = false;						
            var speechText = 'OK, if you change your mind just tell me. Ask for help and you\'ll be reminded of how to do that.';		
			response.tell(speechText);
        });
    };	

////////////////////// for testing purposes only	
	intentHandlers.CreateSNSTopicIntent = function (intent, session, response) {
		// sets up the SNS Topic that will be used to subscribe a player to for ongoing notification from this skill
        console.log('entering CreateSNSTopicIntent');
		createSNSTopic(session, response);
    };	

////////////////////// for testing purposes only
	intentHandlers.SendATextIntent = function (intent, session, response) {
		console.log('entering SendATextIntent');
		// 1. call matchStorage.loadGame, and pass 'session' into it. Session now includes new player's phone number and team to assign them to
		// 2. the callback returns the match data in the variable 'currentMatch'.
		// 3. then 'currentMatch' is passed into the code in the braces.
		matchStorage.loadMatch(session, function (currentMatch) { // 
			// 1. call playerStorage.loadPlayer, and pass 'currentMatch' into it. 
			// 2. the callback returns the Topic ARN in the variable 'topicArn'.
			// 3. then pass 'topicArn' into the code in the braces.
			playerSMS.publishSMS(currentMatch.data.MatchData.TopicARN, function (success) {
				console.log('back within the braces after callback');
				if (success == false) {
					speechText = 'There was a problem sending the text';				
				} else { 
					speechText = 'The text was successfully sent.';
				};	
				tellSpeech(speechText, currentMatch, response);									
			});
		});
    };	
	
	intentHandlers.PlayGamePointIntent = function (intent, session, response) {
        console.log('entering PlayGamePointIntent');
        matchStorage.loadMatch(session, function (currentMatch) {				
			currentMatch.data.MatchData.PlayGamePoint = true;						
            var speechText = 'OK, games will be played with no add scoring. Instead of deuce, it will be game point.';		
			tellSpeechAndSave(speechText, currentMatch, response);
        });
    };	

    intentHandlers.TellMatchSummaryIntent = function (intent, session, response) {
		console.log('entering TellMatchSummaryIntent');
		matchStorage.loadMatch(session, function (currentMatch) {
			// reply to the user with the stats on the match
				
			var matchSummaryContent = createMatchSummaryContent (currentMatch);
			console.log('matchSummaryContent back inside TellMatchSummaryIntent = ' + JSON.stringify(matchSummaryContent) );

			if (matchSummaryContent.noMeaningfulStats == true) {			
				response.tell(matchSummaryContent.speechOutput);
			} else {
				var speechOutput =  matchSummaryContent.speechOutput;
				var cardTitle =  matchSummaryContent.cardTitle;
				var cardContent =  matchSummaryContent.cardContent;
				var repromptSpeech = 'say, text the summary if you would like players to have it.'
						
				response.askWithCard(speechOutput, repromptSpeech, cardTitle, cardContent);				
			};
        });			
    };	
	
    intentHandlers.TextMatchSummaryIntent = function (intent, session, response) {
		console.log('entering TextMatchSummaryIntent');
		matchStorage.loadMatch(session, function (currentMatch) {
			var playersToReceive = buildArrayOfCurrentPlayers(currentMatch);
			for (var i = 0; i < playersToReceive.length; i++) {
				console.log('sending text to player ' + (i+1) );
				session.attributes.phoneKey = playersToReceive[i];
				console.log('sending text to player with session.attributes.phoneKey = ' + session.attributes.phoneKey);
				playerStorage.loadPlayer(session, function (newLoadedPlayer) {
					console.log('newLoadedPlayer = ' + JSON.stringify(newLoadedPlayer) )
					if (newLoadedPlayer == 'playerNotFound') {
						var result = 'problems';
						return result;
					} else {
						var ARNtoSend = newLoadedPlayer.data.TopicARN.S;
						console.log('ARNtoSend = ' + ARNtoSend );
						
						var matchSummaryContent = createMatchSummaryContent (currentMatch);
						var textToSend =  matchSummaryContent.textToSend;
						console.log('textToSend = ' + textToSend );					
							
						// pass in the Player ID (phone number) who should get the text
						playerSMS.publishSMS(ARNtoSend, textToSend, function (success) {
							console.log('back from layerSMS.publishSMS, now within the braces after callback');
							if (success == false) {
								var result = 'problems';				
							} else { 
								var result = 'success';
							};		
						});	
					
						speechText = 'OK, text sent.';				
						response.tell(speechText);
					};
				});													 
			};
        });			
    };	
	
    intentHandlers.TellGameScoreIntent = function (intent, session, response) {
		console.log('entering TellGameScoreIntent');
		// reply to the user with the score of the current game
        matchStorage.loadMatch(session, function (currentMatch) {
			var currentServer = currentMatch.data.MatchData.WhosServe
			var speechOutput = constructScoreOutput(currentMatch, currentServer);                              
            response.tell(speechOutput);                            
        });
    };

	intentHandlers.TellSetScoreIntent = function (intent, session, response) {
		console.log('entering TellSetScoreIntent');
		// reply to the user with the set score of the current match
        matchStorage.loadMatch(session, function (currentMatch) {	
			var setToSay = currentMatch.data.MatchData.Set;
			var formattedSetScore = formatSetScore(setToSay, true, currentMatch);		
			
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
			var currentServer = currentMatch.data.MatchData.WhosServe;
			var speechText = 'It is ';			
			// If this is a singles match
			if (currentMatch.data.MatchType.S == 'singles') {
				speechText += currentServer;
				speechText += ' team\'s serve.';
			// If this is a doubles match, figure out who is serving next	
			} else if (currentMatch.data.MatchType.S == 'doubles') { 
				speechText += currentMatch.data.MatchData.DoublesServer;
				speechText += '\'s serve on the ';
				speechText += currentServer;
				speechText += ' team.';			
			};
			tellSpeech(speechText, currentMatch, response); 			
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
