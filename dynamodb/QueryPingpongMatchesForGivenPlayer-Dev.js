console.log("Querying PingpongTable-Dev");
var AWS = require("aws-sdk"),
	async = require("async");

	
AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var phone = 8484;


//var matchKeeperMatchesTable = 'MatchKeeperMatches'; // FOR PRODUCTION
var PingpongMatchesTable = 'PingpongMatches-Dev'; // FOR DEVELOPMENT		
var docClient = new AWS.DynamoDB.DocumentClient();
var rawStats = [];

async.parallel([
 
	// pull data when player was Red1PlayerID
	function(callback) {

		var params = {				
			TableName: PingpongMatchesTable,
			IndexName: "Red1PlayerIDIndex",
			KeyConditionExpression: "Red1PlayerID = :PlayerID1",    
			ExpressionAttributeValues: {
				":PlayerID1": phone     
			},
			ProjectionExpression: "MatchData"
		};

		docClient.query(params, function(err, data) {
			if (err)
				console.log(JSON.stringify(err, null, 2));
			else
				rawStats[0] = data.Items;
				callback();
		});			
	},
		
	// pull data when player was Blue1PlayerID
	function(callback) {

		var params = {				
			TableName: PingpongMatchesTable,
			IndexName: "Blue1PlayerIDIndex",
			KeyConditionExpression: "Blue1PlayerID = :PlayerID1",    
			ExpressionAttributeValues: {
				":PlayerID1": phone     
			},
			ProjectionExpression: "MatchData"
		};

		docClient.query(params, function(err, data) {
			if (err)
				console.log(JSON.stringify(err, null, 2));
			else
				rawStats[1] = data.Items;
				callback();
		});		
	}
	
	
], function(err) { //This function gets called after the two tasks have called their "task callbacks"
	if (err) return next(err); //If an error occured, we let express/connect handle it by calling the "next" function
	
	var stats = {};
	
	stats.RedTeamTotalPointsWon = 0;
	stats.BlueTeamTotalPointsWon = 0;
	stats.RedPointsServed = 0;
	stats.BluePointsServed = 0;
	stats.RedGamesServed = 0;
	stats.BlueGamesServed = 0;
	stats.RedPointsWonOnServe = 0;
	stats.RedPointsWonOffServe = 0;
	stats.BluePointsWonOnServe = 0;
	stats.BluePointsWonOffServe = 0;
	stats.RedGamesWonOnServe = 0;
	stats.BlueGamesWonOnServe = 0;
	stats.RedTeamTotalGamesWon = 0;
	stats.RedTiebreaksWon = 0;
	stats.BlueTiebreaksWon = 0;
	stats.BreakPointsAgainstRed = 0;
	stats.BreakPointsAgainstBlue = 0;
	stats.RedBreakPointConversions = 0;
	stats.BlueBreakPointConversions = 0;
	stats.RedBreakPointsSaved = 0;
	stats.BlueBreakPointsSaved = 0;

	rawStats.forEach(function(playerSlot) {
		playerSlot.forEach(function(item) {
			stats.RedTeamTotalPointsWon += item.MatchData.RedTeamTotalPointsWon;
			stats.BlueTeamTotalPointsWon += item.MatchData.BlueTeamTotalPointsWon;
			stats.RedPointsServed += item.MatchData.RedPointsServed;
			stats.BluePointsServed+= item.MatchData.BluePointsServed;
			stats.RedGamesServed += item.MatchData.RedGamesServed;
			stats.BlueGamesServed += item.MatchData.BlueGamesServed;
			stats.RedPointsWonOnServe += item.MatchData.RedPointsWonOnServe;
			stats.RedPointsWonOffServe += item.MatchData.RedPointsWonOffServe;
			stats.BluePointsWonOnServe += item.MatchData.BluePointsWonOnServe;
			stats.BluePointsWonOffServe += item.MatchData.BluePointsWonOffServe;
			stats.RedGamesWonOnServe += item.MatchData.RedGamesWonOnServe;
			stats.BlueGamesWonOnServe += item.MatchData.BlueGamesWonOnServe;
			stats.RedTeamTotalGamesWon += item.MatchData.RedTeamTotalGamesWon;
			stats.RedTiebreaksWon += item.MatchData.RedTiebreaksWon;
			stats.BlueTiebreaksWon += item.MatchData.BlueTiebreaksWon;
			stats.BreakPointsAgainstRed += item.MatchData.BreakPointsAgainstRed;
			stats.BreakPointsAgainstBlue += item.MatchData.BreakPointsAgainstBlue;
			stats.RedBreakPointConversions += item.MatchData.RedBreakPointConversions;
			stats.BlueBreakPointConversions += item.MatchData.BlueBreakPointConversions;
			stats.RedBreakPointsSaved += item.MatchData.RedBreakPointsSaved;
			stats.BlueBreakPointsSaved += item.MatchData.BlueBreakPointsSaved;					
		});
	});
	
	console.log('stats = ' + JSON.stringify(stats) );
});




