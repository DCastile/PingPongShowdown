'use strict';
console.log('entering queryForSinglesMatchups.js');

var AWS = require("aws-sdk"),
	async = require("async");
	
//var PingpongMatchesTable = 'PingpongMatches'; // FOR PRODUCTION
var PingpongMatchesTable = 'PingpongMatches-Dev'; // FOR DEVELOPMENT		
var docClient = new AWS.DynamoDB.DocumentClient();	
var rawStats = [];

var singlesMatchupResults = (function () {

    return {
        getSinglesMatchupResults: function (currentMatch, callback) {
			console.log('entering singlesMatchupResults.getSinglesMatchupResults function');
	
			async.parallel([
			 
				// pull data when player was Red1PlayerID
				function(callback) {			
					console.log('entering pull data when player was Red1PlayerID function');						
								
					var params = {
						TableName: PingpongMatchesTable,
						IndexName: "SinglesOpponentIndex",
						KeyConditionExpression: "Red1PlayerID = :Player1ID and Blue1PlayerID = :Player2ID",
						ExpressionAttributeValues: {
							":Player1ID": currentMatch.data.Red1PlayerID,
							":Player2ID": currentMatch.data.Blue1PlayerID       
						}
					};

					docClient.query(params, function(err, data) {
						if (err) {
							console.log('error in getSinglesMatchupResults query')
							console.log(JSON.stringify(err, null, 2));					
						} else {
							//console.log(JSON.stringify(data, null, 2));
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
							":Player1ID": currentMatch.data.Red1PlayerID,
							":Player2ID": currentMatch.data.Blue1PlayerID       
						}				
					};

					docClient.query(params, function(err, data) {
						if (err) {
							console.log('error in getSinglesMatchupResults query')
							console.log(JSON.stringify(err, null, 2));					
						} else {
							//console.log(JSON.stringify(data, null, 2));
							rawStats[1] = data.Items;
							callback();
						}
					});								
				}		
							
			], function(err) { //This function gets called after the two tasks have called their "task callbacks"
				if (err) callback('historyError') //If an error occured, return that info to callback		
					callback(rawStats);		
				}
			)
		}
	}		

})();
console.log('exiting queryForSinglesMatchups.js');
module.exports = singlesMatchupResults;
		



