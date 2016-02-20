
'use strict';
console.log('entering eventHandlers.js');

var matchStorage = require('./matchStorage'),
	playerStorage = require('./playerStorage'),
	AlexaSkill = require('./AlexaSkill'),	
    textHelper = require('./textHelper');
	//playerSMS = require('./playerSMS');
    
var registerEventHandlers = function (eventHandlers, skillContext) {
	
    eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
        //if user said a one shot command that triggered an intent event,
        //it will start a new session, and then we should avoid speaking too many words.
        //skillContext.needMoreHelp = false; 
		session.new = false
		//console.log( 'session from eventhandlers = ' + JSON.stringify(session) );
		//console.log( 'skillContext from eventhandlers = ' + JSON.stringify(skillContext) );
    };

    eventHandlers.onLaunch = function (launchRequest, session, response) {
        //Speak welcome message and ask user question if they didn't specify a command
        //based on whether there are players or not.
        console.log('entering onLaunch');
        matchStorage.loadMatch(session, function (currentMatch) {
			console.log("Match Keeper onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
            var textToSay = '',
                repromptTextToSay;    
			
			textToSay += 'You can start a match, or ' 
			textToSay += 'hear more things you can say. What would you like?';
			repromptTextToSay = 'Would you like to start a match, or hear more things?'

//			repromptTextToSay = 'Welcome players. You can start a match, or ' 
//			repromptTextToSay += 'hear more things you can say. What would you like to do?';

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
        });
    };
};
console.log('exiting eventHandlers.js');
exports.register = registerEventHandlers;


    
    


    
    