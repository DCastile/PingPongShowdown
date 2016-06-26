console.log("Querying PingpongTable for matches between players 8484 and 1212");

var AWS = require("aws-sdk"),
	async = require("async");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

	
//var PingpongMatchesTable = 'PingpongMatches'; // FOR PRODUCTION
var PingpongMatchesTable = 'PingpongMatches-Dev'; // FOR DEVELOPMENT		
var docClient = new AWS.DynamoDB.DocumentClient();

var rawStats = [];	

var singlesMatchupResults = (function (callback) {
	
	async.parallel([
	 
		// pull data when player was Red1PlayerID
		function(callback) {			
			console.log('entering pull data when player was Red1PlayerID function');						
						
			var params = {
				TableName: PingpongMatchesTable,
				IndexName: "SinglesOpponentIndex",
				KeyConditionExpression: "Red1PlayerID = :Player1ID and Blue1PlayerID = :Player2ID",
				ExpressionAttributeValues: {
					":Player1ID": 8484,
					":Player2ID": 1212       
				}//,
				//ProjectionExpression: "MatchData"
			};

			docClient.query(params, function(err, data) {
				if (err) {
					console.log('error in getSinglesMatchupResults query')
					console.log(JSON.stringify(err, null, 2));					
				} else {
					//console.log(JSON.stringify(data, null, 2));
					rawStats.Count = data.Count;
					//console.log('rawStats 1st go round = ' + rawStats);
					rawStats[0] = data.Items;
					callback();

				}
			});								
		},
		
		// pull data when player was Blue1PlayerID
		function(callback) {		
			console.log('entering pull data when player was Blue1PlayerID function');													

			var params = {
				TableName: PingpongMatchesTable,
				IndexName: "SinglesOpponentIndex",
				KeyConditionExpression: "Red1PlayerID = :Player2ID and Blue1PlayerID = :Player1ID",
				ExpressionAttributeValues: {
					":Player1ID": 8484,
					":Player2ID": 1212       
				}//,
				//ProjectionExpression: "MatchData"
			};

			docClient.query(params, function(err, data) {
				if (err) {
					console.log('error in getSinglesMatchupResults query')
					console.log(JSON.stringify(err, null, 2));					
				} else {
					//console.log(JSON.stringify(data, null, 2));
					rawStats.Count = data.Count;
					//console.log('rawStats 2nd go round = ' + rawStats);
					rawStats[1] = data.Items;
					callback();
				}
			});								
		}		
					
	], 	function(err) { //This function gets called after the two tasks have called their "task callbacks"
			if (err) callback('historyError') //If an error occured, return that info to callback	

			callback(rawStats);
			
			}

	)	

});
	
singlesMatchupResults(/*currentMatch,*/ function (matchupStats) {
	//console.log('matchupStats = ' + JSON.stringify(matchupStats) );

	var myWins = 0;
	var otherWins = 0;
	
	// matchupStats[0] is an array of all the matches where the player was Red1
	// matchupStats[1] is an array of all the matches where the player was Blue1
	matchupStats.forEach(function(playerSlot) { // go through twice, once for Red1, once for Blue1
		playerSlot.forEach(function(item) { // each item is a match that was found where the player was signed in
			console.log('Match date: ' + item.ReadableStartTime);
			console.log('Match type: ' + item.MatchType);
			console.log('Match winner: ' + item.MatchData.MatchWinner);
			if (item.MatchType == 'singles') { 
				if (item.MatchData.MatchWinner == 8484) {
					myWins++;
				} else if (item.MatchData.MatchWinner == 1212) {
					otherWins++;
				}
			}
		});
	});

	console.log('matches played = ' + (matchupStats[0].length + matchupStats[1].length) );
	console.log('myWins = ' + myWins);
	console.log('otherWins = ' + otherWins);											
						

});

