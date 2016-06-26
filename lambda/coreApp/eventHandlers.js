
'use strict';
console.log('entering eventHandlers.js');

var matchStorage = require('./matchStorage'),
	AlexaSkill = require('./AlexaSkill'),
    textHelper = require('./textHelper');

    
var registerEventHandlers = function (eventHandlers, skillContext) {
	
    eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
		session.new = false
		//console.log( 'session from eventhandlers = ' + JSON.stringify(session) );
    };

    eventHandlers.onLaunch = function (launchRequest, session, response) {
        console.log('entering onLaunch');
		//console.log("Match Keeper onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
		
        matchStorage.loadMatch(session, function (currentMatch) {
			
			if (typeof(currentMatch) == 'string') { // there is not an active match right now, so create a new one

				var textToSay = 'You can start a new match or ask, what are my options?';
				var repromptTextToSay = 'Would you like to start a new match or hear other options?';	

				var speechOutput = {
					speech: '<speak>' + textToSay + '</speak>',
					type: AlexaSkill.speechOutputType.SSML
				};
				var repromptOutput = {
					speech: '<speak>' + repromptTextToSay + '</speak>',
					type: AlexaSkill.speechOutputType.SSML
				};
				response.ask(speechOutput, repromptOutput);							
				console.log('exiting onLaunch');
					
										
			} else { // there is an active match	
			
				var textToSay = 'There is a match in progress. You can ask, what are my options?';
				var repromptTextToSay = 'If you\'re stuck, say, what are my options.';	

				var speechOutput = {
					speech: '<speak>' + textToSay + '</speak>',
					type: AlexaSkill.speechOutputType.SSML
				};
				var repromptOutput = {
					speech: '<speak>' + repromptTextToSay + '</speak>',
					type: AlexaSkill.speechOutputType.SSML
				};
				response.ask(speechOutput, repromptOutput);							
				console.log('exiting onLaunch');
					
			}													
        });
    };
};
console.log('exiting eventHandlers.js');
exports.register = registerEventHandlers;


    
    


    
    