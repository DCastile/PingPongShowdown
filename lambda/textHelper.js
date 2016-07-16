
'use strict';

var textHelper = (function () {

    return {

		shortHelp: 'To give a point to a player, say point red, or point blue.<break time=\"0.3s\" />'
		+ 'Here are somemore things you can say<break time=\"0.3s\" />'	
        + ' Starta match<break time=\"0.3s\" />'
		+ ' Starta doubles match<break time=\"0.3s\" />'
        + ' Set the sass-meter to zero. I\'ll stop making wisecracks if the sass meter is at zero. The meter goes up to 10, where I will comment on every occasion.<break time=\"0.3s\" />'		
        + ' You can also say: Tell me the rules of ping pong<break time=\"0.3s\" />'		
        + ' Register a new player<break time=\"0.3s\" />'
		+ ' Undo that score. <break time=\"0.3s\" /> Saying, Undo That. Will cancel the last thing you did.<break time=\"0.3s\" />'
		+ ' You can say, Tell me more.<break time=\"0.3s\" />',		

		
		moreHelp: 'Here are some examples of more things you can say<break time=\"0.3s\" />' 
        + ' What\'s the score?<break time=\"0.3s\" />'
        + ' Give me a summary of the match<break time=\"0.3s\" />'
		+ ' What\'s the match score?<break time=\"0.3s\" />'
		+ ' Who\'s serve is it?<break time=\"0.3s\" />'
		+ ' Tell me how to set preferences<break time=\"0.3s\" />'		
		+ ' and, tell me ways to change the match<break time=\"0.3s\" />'
		+ ' Saying, Let\'s play will immediately start a singles match, without players signing in.<break time=\"0.3s\" />',

		evenMoreHelp: 'Here are some examples of ways that you can control the flow of the match<break time=\"0.3s\" />'
		+ ' Play games to twenty one<break time=\"0.3s\" />'
		+ ' Play best three out of five<break time=\"0.3s\" />'
		+ ' Play a single game match<break time=\"0.3s\" />'		
		+ ' Change the number of serves per turn<break time=\"0.3s\" />'		
		+ ' Start a new game<break time=\"0.3s\" />'
		+ ' Change the score<break time=\"0.3s\" />'	
        + ' Finally, you can always say stop, cancel or exit.<break time=\"0.3s\" />',
		
		settingAudioPreferences: 'Here are ways that you can set preferences for what I say during this match<break time=\"0.3s\" />'
		+ ' Keep it short. This will cut down on things I say.<break time=\"0.4s\" />'
		+ ' You can also say, Don\'t switch sides<break time=\"0.3s\" />'
		+ ' Say, tell me about saving and loading preferences to hear more<break time=\"0.3s\" />',

		saveAndLoadPreferences: 'You can save and load your match preferences. <break time=\"0.3s\" />'
		+ ' When you say, Save Preferences, the settings of the current match will be stored in your profile.<break time=\"0.3s\" />'		
		+ ' To load your preferences, say, Load Preferences after starting a new match.<break time=\"0.3s\" />'
		+ ' There are a total of five preferences that can be saved and loaded.<break time=\"0.4s\" /> They include: <break time=\"0.3s\" /> '
		+ ' one, playing to either 11 or 21 points,<break time=\"0.3s\" />two, playing matches with either one game, or best three out of five games,<break time=\"0.3s\" />'
		+ ' three, setting of my sass-meter between zero and ten,<break time=\"0.3s\" />, four, whether or not to switch sides after serve,<break time=\"0.3s\" />,'
		+ ' and finally number five, telling me that you are an experienced user, in which case I will keep my comments short.',		

		rulesOfPingPong: 'A match is played best 3 out of 5 games, or unofficially you can play a single game match. For each game, the first player to reach either 11 or 21 points wins that game, however a game must be won by at least a two point margin.<break time=\"0.4s\" />'
		+ ' A point is scored after each ball is put into play (not just when the server wins the point, as in volleyball).<break time=\"0.3s\" />'
		+ ' The flow of a match goes like this: Each player serves two points in a row, and then switch. You can also choose to each serve 5 points before switching.<break time=\"0.2s\" />'
		+ ' The only other thing you need to know about serving is that if a score of 10 to 10 is reached in any game to 11, then each player serves only one point, and then the server is switched. <break time=\"0.2s\" />The same thing goes when it is 20 to 20 and you are playing to 21.<break time=\"0.4s\" />'
		+ ' If you want to be official, after each game, the players switch sides of the table. In the 5th and final game of the match, the players switch sides again after either player reaches 5 points. <break time=\"0.3s\" />'
		+ ' Most people don\'t do this, but if you want to really serve by the rules, here\'s what you do: The ball must rest on the open palm of your hand.<break time=\"0.2s\" /> Then it must be tossed up at least 6 inches, and struck so the ball first bounces on the server\'s side, and then the opponent\'s side.<break time=\"0.3s\" />'
		+ ' If the serve touches the net, it is called a let serve. Let serves are not scored, it\s a do over.<break time=\"0.4s\" />'
		+ ' As far as the table goes, the edges of the table are part of the legal table surface.<break time=\"0.4s\" />'		
		+ ' In singles, the center lines serve no purpose, so ignore them. That\'s it!'

    };
})();
module.exports = textHelper;
