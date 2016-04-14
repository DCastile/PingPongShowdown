
'use strict';

var textHelper = (function () {

    return {

		shortHelp: 'To give a point to a player, say point red, or point blue.<break time=\"0.2s\" />'
		+ 'Here\'s some more things you can say<break time=\"0.3s\" />'	
        + ' Start a match<break time=\"0.2s\" />'		
        + ' Register a new player<break time=\"0.2s\" />'
		+ ' Undo that score. <break time=\"0.2s\" /> Saying, Undo That. Will cancel the last thing you did.<break time=\"0.2s\" />'
		+ ' You can say, Tell me more.<break time=\"0.2s\" />',		

		
		moreHelp: 'Here are some examples of more things you can say<break time=\"0.3s\" />' 
        + ' What\'s the score?<break time=\"0.3s\" />'
        + ' Give me a summary of the match<break time=\"0.3s\" />'
		+ ' What\'s the set score?<break time=\"0.3s\" />'
		+ ' Who\'s serve is it?<break time=\"0.3s\" />'
		+ ' Tell me some shortcuts<break time=\"0.3s\" />'
		+ ' Tell me about getting text messages<break time=\"0.3s\" />'	
		+ ' Tell me how to set preferences<break time=\"0.3s\" />'		
		+ ' and, tell me ways to change the match<break time=\"0.3s\" />',

		evenMoreHelp: 'Here are some examples of ways that you can control the flow of the match<break time=\"0.3s\" />'
		+ ' Play with no add scoring<break time=\"0.3s\" />'
		+ ' Change to blue team serve<break time=\"0.3s\" />'	
		+ ' Change the set score<break time=\"0.3s\" />'
		+ ' Blue team won the game<break time=\"0.3s\" />'	
		+ ' Start a new game<break time=\"0.3s\" />'
		+ ' Start a new set<break time=\"0.3s\" />'	
		+ ' Play a tiebreaker<break time=\"0.3s\" />'
		+ ' Play a supertiebreaker<break time=\"0.3s\" />'
		+ ' If the score gets posted incorrectly, just say what the score should be. For example, 30 all.<break time=\"0.3s\" />'	
        + ' Finally, you can always say stop, cancel or exit.<break time=\"0.3s\" />',
		
		settingAudioPreferences: 'Here are ways that you can set preferences for what I say during this match<break time=\"0.3s\" />'
		+ ' Use pro-mode. Pro-mode cuts down on things I say.<break time=\"0.4s\" />'
		+ ' Don\'t switch sides<break time=\"0.3s\" />'
		+ ' Don\'t announce the score<break time=\"0.3s\" />'	
		+ ' And, Don\'t announce the serve<break time=\"0.3s\" />'
		+ ' Say, tell me about saving and loading preferences to hear more<break time=\"0.3s\" />',

		saveAndLoadPreferences: 'You can save and load your match preferences. <break time=\"0.3s\" />'
		+ ' Preferences include playing no add scoring, pro-mode on, or off, switching sides after serve, announcing the score, and announcing the next server.'
		+ ' When you say, Save Preferences, the settings of the current match will be stored in your profile. '		
		+ ' To load your preferences, say, Load Preferences after starting a new match.<break time=\"0.3s\" />',			
		
		shortcutHelp: 'Here\'s a few examples of interactions that will save time<break time=\"0.3s\" />'
		+ 'start a doubles match with blue serve<break time=\"0.3s\" />'
		+ 'add 425-555-1212 to the red team<break time=\"0.3s\" />'
		+ 'and, register 425-867-5309<break time=\"0.4s\" />',
		
		textMessageHelp: 'I can send you text messages with your match results and statistics.<break time=\"0.3s\" />'
		+ ' Stats include points and games won, both overall as well as just when you were serving. Also break point conversions,'
		+ ' break points saved, game points won, <break time=\"0.3s\" />'
		+ ' and your longest point streak. These stats are also compared to your historical averages.<break time=\"0.3s\" />'
		+ ' To opt in, say, send a confirmation text to, and then your phone number.<break time=\"0.4s\" />',

		tempMessageHelp: 'Hello <say-as interpret-as="spell-out">EMC</say-as> superstars. I\'m Alexa. I\'ve heard a lot about you. Word is, that you are the best presales team out there.<break time=\"0.4s\" />'
		+ ' I\'ve also heard about this <say-as interpret-as="spell-out">EMC</say-as>: under ground thing.<break time=\"0.4s\" /> You are learning new skillsets, and leaning into the future, with infrastructure as code.<break time=\"0.4s\" />'
		+ ' I\'d like to help.<break time=\"0.2s\" /> Let me tell you a little bit about me. As you can see from this little tin <phoneme alphabet="ipa" ph="ˈkæn">can</phoneme>that I live in, I don\'t have a big head.<break time=\"0.4s\" />'
		+ ' But to brag just a bit, I am a 4.4 out of 5 star product on Amazon dot com with over 34000 reviews. Take that, Siri and Cortana.<break time=\"0.2s\" />'
		+ ' But the thing I\'m most proud of though is my open <say-as interpret-as="spell-out">API</say-as>. I can learn anything. So back to you guys. I was thinking.'
		+ ' If we team up, we could really do some damage. Between your knowledge of <say-as interpret-as="spell-out">EMC</say-as>, and my just plain awesomeness, we can build something great.'
		+ ' As we speak, there are 7 of me (you might say I have a split personality.) Anyway, there are 7 of me headed out to 7 <say-as interpret-as="spell-out">EMC</say-as> Underground chapters.'
		+ ' Between now and August, use my <say-as interpret-as="spell-out">API</say-as> and make me smart about something to do with either <say-as interpret-as="spell-out">EMC</say-as>, your customers, or the presales process.<break time=\"0.4s\" />'
		+ ' In August, we\'ll all get together and share. By popular vote, the top chapter projects will get prizes. So other than super secret prizes, what\'s in it for me, you ask? How about:'
		+ ' One, you can build an app for me in less than an hour. And really, an hour isn\'t enough cause I\'m just plain fun to hang out with!<break time=\"0.4s\" />'
		+ ' Two, you can get a real world understanding of stateless applications, in this new P 3 world. What the heck is ephemeral anyway?<break time=\"0.4s\" />'
		+ ' Three, you can understand how to compete or cooperate with Amazon A W S much better, or choose to deploy your code on Pivotal Cloud Foundry.<break time=\"0.4s\" />'
		+ ' Four, you can make something cool for EMC. <break time=\"0.4s\" />But most of all, this is a chance to have some fun together as a chapter team.'
		+ ' I\'m really looking forward to seeing what you come up with. PS, did I mention I\'m the life of the party in conference rooms?'


    };
})();
module.exports = textHelper;
