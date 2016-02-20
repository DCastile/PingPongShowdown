
'use strict';

var textHelper = (function () {

    return {

		shortHelp: 'To give a point to a player, say point red, or point blue.<break time=\"0.2s\" />'
		+ 'Here\'s some more things you can say<break time=\"0.3s\" />'	
        + ' Start a match<break time=\"0.2s\" />'		
        + ' Register a new player<break time=\"0.2s\" />'
		+ ' and, Tell me more things I can say<break time=\"0.2s\" />',		

		
		moreHelp: 'Here are some examples of more things you can say<break time=\"0.3s\" />' 
        + ' What\'s the score?<break time=\"0.3s\" />'
        + ' Give me a summary of the match<break time=\"0.3s\" />'
		+ ' What\'s the set score?<break time=\"0.3s\" />'
		+ ' Who\'s serve is it?<break time=\"0.3s\" />'
		+ ' Tell me some shortcuts<break time=\"0.3s\" />'
		+ ' and, tell me ways to change the match<break time=\"0.3s\" />',

		evenMoreHelp: 'Here are some examples of ways that you can control the flow of the match<break time=\"0.3s\" />'
		+ ' Play with no add scoring<break time=\"0.3s\" />'
		+ ' Don\'t switch sides<break time=\"0.3s\" />'
		+ ' Change to blue team serve<break time=\"0.3s\" />'	
		+ ' Change the set score<break time=\"0.3s\" />'
		+ ' Blue team won the game<break time=\"0.3s\" />'	
		+ ' Start a new game<break time=\"0.3s\" />'
		+ ' Start a new set<break time=\"0.3s\" />'		
		+ ' If the score gets posted incorrectly, just say what the score should be. For example, 30 all.<break time=\"0.3s\" />'
		//+ ' tell me about getting a text with match results<break time=\"0.3s\" />'		
        + 'Finally, you can always say stop, cancel or exit.<break time=\"0.3s\" />',
		
		shortcutHelp: 'Here\'s a few examples of interactions that will save time<break time=\"0.3s\" />'
		+ 'start a doubles match with blue serve<break time=\"0.3s\" />'
		+ 'add 425-555-1212 to the red team<break time=\"0.3s\" />'
		+ 'and, register 425-867-5309<break time=\"0.4s\" />'
		//+ 'and, use expert mode. Expert mode cuts down on prompts and things I say.<break time=\"0.4s\" />'

    };
})();
module.exports = textHelper;
