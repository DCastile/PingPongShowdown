'use strict';
console.log('entering buttonClick.js');

var	matchStorageForButton = require('./matchStorageForButton')


exports.handler = function(event, context) {

	var response = '';
	var speechText = '';
	matchStorageForButton.loadMatch(function (currentMatch) {
		console.log('entering PointToPlayerViaButton');
		console.log('Received event:', JSON.stringify(event, null, 2));
		if (typeof(currentMatch) == 'string') {
			matchNotFound(currentMatch, response);
			return;
		};		
		
		var point = event.point;

		switch (point) {
			case 'red':		
				var colorWinner = 'point red';
				pointToPlayer(colorWinner, currentMatch, response);
				var gameScore = formatGameScore(currentMatch);
				var setScore = formatSetScore(currentMatch.data.MatchData.Set, true, 'text', currentMatch);
				var dataToPass = ',' + gameScore + ',' + setScore + ',' + currentMatch.data.MatchData.WhosServe + ',';
				currentMatch.save(function () {	
					console.log('save successfully completed');
					context.succeed(dataToPass);					
				});					
				break;
			case 'blue':		
				var colorWinner = 'point blue';
				pointToPlayer(colorWinner, currentMatch, response);
				var gameScore = formatGameScore(currentMatch);
				var setScore = formatSetScore(currentMatch.data.MatchData.Set, true, 'text', currentMatch)
				var dataToPass = ',' + gameScore + ',' + setScore + ',' + currentMatch.data.MatchData.WhosServe + ',';
				currentMatch.save(function () {	
					console.log('save successfully completed');
					context.succeed(dataToPass);					
				});	
				break;				
			default:
				context.fail(new Error('Unrecognized operation "' + operation + '"'));
		}			

	});

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

	function formatGameScore(currentMatch) {
		console.log('entering formatGameScore function');
		var currentServer = currentMatch.data.MatchData.WhosServe;	
		if (currentServer == 'red') {
			var gameScore = currentMatch.data.MatchData.RedTeamGameScore + ' - ' + currentMatch.data.MatchData.BlueTeamGameScore;				
		} else {
			var gameScore = currentMatch.data.MatchData.BlueTeamGameScore + ' - ' + currentMatch.data.MatchData.RedTeamGameScore;
		}
		
		return gameScore;
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
				formattedSetScore += ' ' + rawScores[2] 
				if (sayTeam == true) {
					formattedSetScore += ' ' + rawScores[3];
				};
			};		
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
					currentMatch.data.MatchData.BreakPoint = false;
				};			
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
				// save went here
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
		// save went here

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
				console.log('not a tiebreaker, now into game won');
				console.log('pointWinner = ' + pointWinner);
				if (currentMatch.data.MatchData.WhosServe == 'red') {
					currentMatch.data.MatchData.RedGamesServed++
				} else {
					currentMatch.data.MatchData.BlueGamesServed++
				};

				if (pointWinner == 'red') { // red won the point and the game so update stats
					currentMatch.data.MatchData.RedTeamTotalGamesWon++;
					console.log('currentMatch.data.MatchData.BreakPoint = ' + currentMatch.data.MatchData.BreakPoint);
					if (currentMatch.data.MatchData.BreakPoint) { // it was a break point
						console.log('now inside before at currentMatch.data.MatchData.BreakPoint = ' + currentMatch.data.MatchData.BreakPoint);
						currentMatch.data.MatchData.RedBreakPointConversions++; 
						console.log('now inside after at currentMatch.data.MatchData.BreakPoint = ' + currentMatch.data.MatchData.BreakPoint);
						
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
					// save went here						
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

			// save went here

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
		
		// announce the score if match settings specify it
		if (currentMatch.data.MatchData.AnnounceScore == true) {
			speechText += '<break time=\"0.3s\" />'
			var setScoreToSay = rawScores[0] + ' to ' + rawScores[1] + ', ';
			if (rawScores[2]) { // if it isn't a tie (the word blue or red exists in the SetXScore) 
				if (currentMatch.data.MatchData.ExperiencedUserMode == false) { // e.g. 'blue team leads the set, 5 to 4'
					speechText += rawScores[2] + ' ' + rawScores[3]+ ' <phoneme alphabet="ipa" ph="l.i%.ds">leads</phoneme> the set, ' + rawScores[0] + ' to ' + rawScores[1];
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

		// announce new game depending on match settings
		if (currentMatch.data.MatchData.ExperiencedUserMode == false) {
			speechText += '<break time=\"0.4s\" />Now starting a new game.';
		} else {
			speechText += '<break time=\"0.4s\" />New game, ';
		}
			
		// announce the serve if match settings specify it
		if (currentMatch.data.MatchData.AnnounceServe == true) {
			if (currentMatch.data.MatchType == 'singles') { // If this is a singles match, serve goes to the next team
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
		// save went here
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

	console.log('exiting buttonClick.js');

  
};

















