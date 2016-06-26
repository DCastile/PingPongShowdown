
'use strict';
console.log('entering humor.js');

var matchStorage = require('./matchStorage')

var humor = (function () {
		
	function Joke(moment, pointWinner, pointLoser) {
		console.log('entering Joke function');
		
		var jokeLists = {
					
		
			jokesAtEndOfGame: [
			//"<audio src='https://s3.amazonaws.com/pingpongsongs/toolittletoolate.mp3'/>" + pointLoser + ', I\'m afraid it was.',			
			'Sure, ' + pointWinner + ' you beat ' + pointLoser + ', but you\'ll never be as good as a wall.',
			'Keep practicing ' + pointLoser + ', victory requires payment in advance.<break time=\"0.3s\" /> Deep, huh?',
			'What does ' + pointLoser + ' and a possum have in common? They both play, dead.',
			pointLoser + ', you\'ve been outhitted and outwitted.',
			'Keep practicing ' + pointLoser + ', there\'s no traffic on the extra mile.',
			pointLoser + ', hey don\'t feel so bad. Every day 4 million people play ping pong and 2 million of them lose.',
			pointLoser + ', you\'ll always be a winner to me.',		
			pointLoser + ', you\'d better go find the Wizard. Based on that performance you ain\'t got heart, you ain\'t got courage and you ain\'t got brains.',
			pointLoser + ', next game try and yell out a math problem to ' + pointWinner + ', that should freeze \'em in their tracks.',
			pointLoser + ', well your forehand wasn\'t good today, but you made up for it by serving badly.',
			pointLoser + ', <break time=\"0.3s\" />they say that lessons are learned in defeat. You are really getting a great education.',
			'Someone get some honey-glaze, this ham just got smoked.',
			'That\'s OK ' + pointLoser + ', repeat after me: I am a nobody, nobody is perfect, therefore I am perfect.',
			pointLoser + ', people say, If you can\'t beat them, join them. Here is some advice for the next game: If you can\'t beat them, then go ahead and beat them, because they will be expecting you to join them, so you will have the element of surprise.',
			pointLoser + ', look at it this way, you started out with nothing, and you still have most of it.',
			pointLoser + ', so you lost. Hey life is all about perspective. The sinking of the Titanic was a miracle to the lobsters in the ship\'s kitchen.',
			'Hey ' + pointLoser + ', that\'s the way it goes. One day you\'re the best thing since sliced bread. The next, you\'re toast.'		
			
			],
						
						
			jokesAfterAPoint: [			
			
			'Elvis, a little help here?' + "<audio src='https://s3.amazonaws.com/pingpongsongs/returntosender.mp3'/>", //+ '<phoneme alphabet="ipa" ph="oʊ.jˈæ">oh yeah</phoneme>',
			pointLoser + ', do I hear something? ' + "<audio src='https://s3.amazonaws.com/pingpongsongs/AOBD2.mp3'/>" + 'Could of sworn I heard something.',
			pointLoser + ' I believe you\'ll be OK, and look I\'m not the only one.' + "<audio src='https://s3.amazonaws.com/pingpongsongs/beokay.mp3'/>",
			pointLoser + ', you need to hit your stride. Sing along: ' + "<audio src='https://s3.amazonaws.com/pingpongsongs/breakmystride.mp3'/>" + 'On second thought, sing it quietly in your head.',
			"<audio src='https://s3.amazonaws.com/pingpongsongs/canttouchthis.mp3'/>" + 'my, my, my',
			'Buck up ' + pointLoser + '. I\'ve got just the thing.' + "<audio src='https://s3.amazonaws.com/pingpongsongs/carryon.mp3'/>",
			'What is it they say ' + pointLoser + '?' + "<audio src='https://s3.amazonaws.com/pingpongsongs/cestlavie.mp3'/>",
			pointLoser + ', I found something to express where I think you\'re coming from.' + "<audio src='https://s3.amazonaws.com/pingpongsongs/dontdomelikethat.mp3'/>",
			'OK I\'m pulling out the big guns here ' + pointLoser + ', the anthem for generations: ' + "<audio src='https://s3.amazonaws.com/pingpongsongs/dontstopbelievin.mp3'/>",
			pointLoser + ', a wise man once said: ' + "<audio src='https://s3.amazonaws.com/pingpongsongs/dontworrybehappy.mp3'/>",
			pointLoser + ', can you relate?' + "<audio src='https://s3.amazonaws.com/pingpongsongs/harddaysnight.mp3'/>",
			"<audio src='https://s3.amazonaws.com/pingpongsongs/iceicebaby.mp3'/>" + 'slice slice baby',
			pointWinner + ' is the new sheriff in town.' + "<audio src='https://s3.amazonaws.com/pingpongsongs/ifoughtthelaw.mp3'/>",
			' just keep telling yourself ' + pointLoser + ', ' + "<audio src='https://s3.amazonaws.com/pingpongsongs/iwillsurvive.mp3'/>",
			pointLoser + ' it\'s not the end. Listen to the wisdom of the children.' + "<audio src='https://s3.amazonaws.com/pingpongsongs/obladi.mp3'/>",
			'Take it from old blue eyes ' + pointLoser + "<audio src='https://s3.amazonaws.com/pingpongsongs/thatslife.mp3'/>",
			pointLoser + ' I found something to describe that spectacular performance.' + "<audio src='https://s3.amazonaws.com/pingpongsongs/wipeout.mp3'/>",
			pointLoser + ', sing it right out' + "<audio src='https://s3.amazonaws.com/pingpongsongs/youdroppedabombonme.mp3'/>",
			pointLoser + ', refuse to lose!',
			pointLoser + ', you just got served.',
			'come on ' + pointLoser + ', get fierce!',			
			pointLoser + ', I\'d buy you a book on ping pong but I think all you\'d do is chew on the cover.',
			pointLoser + ', If this sport is too tough for you, put on a pair of shorts and go join the grass fairies on the soccerfield.',			
			'Paddle faster guys, I hear banjos.',
			'Hustle and hit and never quit. Take my advice, I\'m not using it anyway.',
			'Enough dorking around ' + pointLoser + '.<break time=\"0.3s\" /> Put your hard hat on and your lunch pail away. Punch in for some pingpong.',
			'You go guys. I get enough exercise just pushing my luck!',
			'This is an epic battle of ping pong warriors',
			'Lose the jitters ' + pointLoser + '. You seem as nervous as a cat in a room full of rocking chairs.',
			'pingpong doesn\'t build character. It reveals it.',
			'Pick it up ' + pointLoser + '.<break time=\"0.1s\" /> You were meant to be here.<break time=\"0.3s\" /> This moment is yours.<break time=\"0.3s\" />Go play some pingpong.',
			'Ladies and gentlemen, Forest Gump\'s personal instructor, ' + pointWinner + '.',
			pointWinner + ' I name you ping pong Ninja.',
			pointWinner + ' the human backboard.',
			pointWinner + ', your workouts must be insane!',
			pointWinner + ' you have the potential to potentially win this game.',
			'OK ' + pointWinner + ' you\'ve made your point.',
			pointWinner + ', by the power vested in me I name you paddle master.',
			'The spin cycle must be on high.',
			pointWinner + ' is in it to spin it and win it.',
			pointLoser + ' don\'t hurt yourself sweetheart.',
			'Katie, bar the door. <break time=\"0.4s\" /> You probably don\'t get it, right? That one\'s for all those silverback ping pong players out there.',
			pointLoser + ' don\'t stress. Even a blind squirrel\'s going to find a nut every now and then.',		
			'Just remember, ' + pointLoser + ' no matter how bad you are playing, it is always possible to play worse.',
			'Hey ' + pointLoser + ', it isn\'t over until the lady in the little tin  <phoneme alphabet="ipa" ph="kæn">can</phoneme> sings.',
			'That\'s going to leave a mark.',
			'Wow, that kid is deceptively slow.',
			'Come on ' + pointLoser + ', play like someone stole your freakin sandwich.',
			'Aww, ' + pointLoser + ', you OK? You need mommy to kiss it for you?',
			'blow it off ' + pointLoser + ', one point does not a match make.',
			'Wow, ' + pointLoser + ' you\'re smoother than sandpaper.',
			pointLoser + ', you couldn\'t hit water if you fell out of a boat.',
			pointLoser + ', you play dead. Maybe you should find a role in a western.',
			pointLoser + ', you\'r playing worse and worse everyday. And now you\'re playing like the middle of next week.',
			pointLoser + ', well, you may be small, but you\'re slow enough to make up for it.',
			pointLoser + ', you\'re so slow I need a calendar to time you.',
			pointLoser + ', Do you think that you might like this game once you catch on?',
			pointLoser + ', Maybe you\'re left-handed and you don\'t know it.',
			pointLoser + ', The steroids don\'t seem to be working.',
			pointLoser + ', you\'re going to need a bigger paddle.', 
			pointLoser + ', Get a receipt because you just got rung up.',
			pointLoser + ', you couldn\'t hit the ground if you fell off a ladder.',
			pointLoser + ', I\'m not sure you could hit the floor if you fell out of bed.',
			pointLoser + ', you couldn\'t hit sand if you fell off a camel.',
			pointLoser + ', Drop your purse, and pick up a paddle.',
			pointLoser + ', are you known at the gym as the before picture?',
			pointLoser + ', your potential speaks for itself.',
			pointLoser + ', Some of us learn from the mistakes of others, the rest of us have to be the others.',
			'Hey ' + pointLoser + ', I\'d like to help you out. Which way did you come in?',
			pointLoser + ', I\'ll bet you got your hand eye coordination very early. Apparently the warranty has run out.',
			pointLoser + ', When they were handing out hand eye coordination, you were the first in line, but it looks like you held the door open for ' + pointWinner + '.'
					
			]		

		};		
		
		var jokeList = '';
		switch(moment) {
			case 'endOfPoint': 
				jokeList = jokeLists.jokesAfterAPoint;
				break;
			case 'endOfGame':
				jokeList = jokeLists.jokesAtEndOfGame;
				break;
		}

		this.jokeList = jokeList;
		
	};

    return {
		
		storeJokes: function (moment, currentMatch) {
			console.log('entering humor.storeJokes function')
			var momentJokes = new Joke(moment, '', '');
			var jokeIndexes = [];
			
			// populate the array of joke indexes
			for (var i = 0; i < momentJokes.jokeList.length; i++) { 
				jokeIndexes.push(i);
			}	

			// store the array of joke indexes
			switch(moment) {
				case 'endOfPoint': 
					currentMatch.data.MatchData.AfterPointJokes = jokeIndexes;
					break;
				case 'endOfGame':
					currentMatch.data.MatchData.AfterGameJokes = jokeIndexes;
					break;
			}
		
			//save currentMatch
			currentMatch.save(function () {                
			});							
		},
		
		
        pickJoke: function (moment, pointWinner, pointLoser, currentMatch, callback) {
            console.log('entering humor.pickJoke function');
			
			// retrieve the array of remaining joke indexes 
			var jokeIndexes = '';
			switch(moment) {
				case 'endOfPoint': 
					jokeIndexes = currentMatch.data.MatchData.AfterPointJokes;
					break;
				case 'endOfGame':
					jokeIndexes = currentMatch.data.MatchData.AfterGameJokes;
					break;
			}			
			
			var sassMeter = currentMatch.data.MatchData.SassMeter;
			var newJoke = new Joke(moment, pointWinner, pointLoser);
			var randomNum = (Math.floor(Math.random() * 10) );
			
			// always tell a joke at the start of a match and end of a game, unless sassMeter = 0
			if (moment != 'endOfPoint' && sassMeter != 0) {
				sassMeter = 10;
			}

			console.log('randomNum = ' + randomNum)
			console.log('sassMeter = ' + sassMeter)
			
			if (randomNum < sassMeter) {
				// tell a joke
				
				// get a randomly selected slot on the remaining list of jokes
				var indexNumber = Math.floor(Math.random() * jokeIndexes.length)
				
				// get the jokeList index number of the joke in that slot
				var jokeListIndex = jokeIndexes[indexNumber]
				
				// get the joke at that index
				var joke = newJoke.jokeList[jokeListIndex];
				
				jokeIndexes.splice(indexNumber, 1) // remove the joke index number so it won't be picked again
			
			} else {
				var joke = ' ';
				console.log('no joke this time');
			}

			//save currentMatch
			currentMatch.save(function () { 
				callback(joke);			
			});								
		}					
	}
	
})();
module.exports = humor;
