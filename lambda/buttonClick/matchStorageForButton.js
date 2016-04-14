
'use strict';
console.log('entering matchStorageForButton.js');

var	AWS = require("aws-sdk"),
	async = require("async"),
	moment = require("moment");
	moment().format();

var matchStorageForButton = (function () {
 
	var docClient = new AWS.DynamoDB.DocumentClient();
	
	//var matchKeeperMatchesTable = 'MatchKeeperMatches'; // FOR PRODUCTION
	var matchKeeperMatchesTable = 'MatchKeeperMatches-Dev'; // FOR DEVELOPMENT	
	
	//var matchKeeperDevicesTable = 'MatchKeeperDevices'; // FOR PRODUCTION
	var matchKeeperDevicesTable = 'MatchKeeperDevices-Dev'; // FOR DEVELOPMENT	

    /*
     * The Match class stores all match states
     */
    function Match(data) {
    	console.log('entering Match function');
        if (data) {     	
            this.data = data;
            //console.log('successfully passed match data in: ' + JSON.stringify(this.data));
        } else { // no existing Match found for this Echo UserID within timeframe specified in query.
				
            console.log('no match data passed in.');
        }
        console.log('exiting Match function');
    }

    Match.prototype = {
        save: function (callback) {
            console.log('entering Match.prototype save function');
			var currentMatchData = this.data;
			
			async.parallel([
				// save to matchKeeperDevicesTable
				function(callback) {
					var params = {
						TableName: matchKeeperDevicesTable,
						Item: 		{                  
										"EchoUserID": 		currentMatchData.EchoUserID, 
										"MatchStartTime":	currentMatchData.MatchStartTime                    
						}
					};

					docClient.put(params, function(err, data) {
						if (err) {
							console.log("Unable to save to matchKeeperDevicesTable. Error:", JSON.stringify(err, null, 2));
						} else {
							console.log("Saved to matchKeeperDevicesTable:", JSON.stringify(data, null, 2));
							callback();
						};
					});
				},
				
				// save to matchKeeperMatchesTable
				function(callback) {					
					var params = {
						TableName: matchKeeperMatchesTable,
						Item:	{
									"MatchStartTime": 		currentMatchData.MatchStartTime,
									"ReadableStartTime": 	currentMatchData.ReadableStartTime,
									"EchoUserID": 			currentMatchData.EchoUserID,
									"Red1PlayerID": 		currentMatchData.Red1PlayerID,
									"Red2PlayerID": 		currentMatchData.Red2PlayerID,
									"Blue1PlayerID": 		currentMatchData.Blue1PlayerID,
									"Blue2PlayerID": 		currentMatchData.Blue2PlayerID,
									"MatchType": 			currentMatchData.MatchType,
									"MatchData": 			currentMatchData.MatchData,
									"nMinusOne": 			currentMatchData.nMinusOne
						}																				
					};			

					docClient.put(params, function(err, data) {
						if (err) {
							console.log("Unable to save to matchKeeperMatchesTable. Error:", JSON.stringify(err, null, 2));
						} else {
							console.log("Saved to matchKeeperMatchesTable:", JSON.stringify(data, null, 2));
							callback();
						};
					});								
				}
				
			], function(err) { //This function gets called after the two tasks have called their "task callbacks"
					if (err) {
						console.log("Unable to save to matchKeeperMatchesTable. Error:", JSON.stringify(err, null, 2));
					} else {
						console.log("Successfully saved to both matchKeeperMatchesTable and matchKeeperDevicesTable:");
					};
					
					if (callback) {
						callback();
					};
				
					console.log('exiting Match.prototype save function');				
			});				                   
        }
    };

    return {
        loadMatch: function (callback) {

			console.log('entering matchStorage.loadMatch function');
           
			console.log('Getting match data from DynamoDB data store');
			var rightNow = new Date().getTime();
			var fourHoursAgo = (new Date().getTime() - (100*60*60*1000) ); 	// will find a match if the match start time was within the last 4 hours
																			// set to 100 hours for testing *********************************

			var queryDevicesParams = {

				TableName : matchKeeperDevicesTable, 
				ConsistentRead: true,
				KeyConditionExpression: "EchoUserID = :EchoUserID AND MatchStartTime BETWEEN :fourHoursAgo AND :rightNow",
				ExpressionAttributeValues: {
					":EchoUserID": "amzn1.echo-sdk-account.AHTTLGPHF75IRPI5FAKH7TSOG6HWQ2VVSZOVKLNVGQDIMNUMEPK3E",
					":rightNow": rightNow, 
					":fourHoursAgo": fourHoursAgo       
				}
			};

            docClient.query(queryDevicesParams, function (err, data) {
				
				var currentMatch;
                if (err) {
                	console.log('there was an error in query to matchKeeperDevicesTable, info follows: ');
                    console.log(err, err.stack);
					currentMatch = 'errorLoadingMatch';
                    callback(currentMatch);
                } else if (data.Items[data.Count - 1] === undefined) {
                	console.log('Data was loaded from matchKeeperDevicesTable without error, but data.Items[data.Count - 1] was undefined');
					currentMatch = 'matchNotFound';
					console.log('type of currentMatch = ' + typeof(currentMatch));
                    callback(currentMatch);
                } else {
                    console.log('Matches in the last 4 hrs pulled from dynamodb = ' + JSON.stringify(data) );					
					var startTimeKey = data.Items[data.Count - 1].MatchStartTime;
					console.log('startTimeKey = ' + startTimeKey);
										
					var getMatchParams = {
						
						TableName: matchKeeperMatchesTable,
						Key: {
								"MatchStartTime": 	startTimeKey,
								"EchoUserID": 		"amzn1.echo-sdk-account.AHTTLGPHF75IRPI5FAKH7TSOG6HWQ2VVSZOVKLNVGQDIMNUMEPK3E"	
						}
					};

					docClient.get(getMatchParams, function (err, data) {
												
						if (err) {
							console.log('there was an error in Get to matchKeeperMatchesTable, info follows: ');
							console.log(err, err.stack);
							currentMatch = 'errorLoadingMatch';
							callback(currentMatch);
						} else if (data.Item === undefined) {
							console.log('Data was loaded from matchKeeperMatchesTable without error, but data.Item was undefined');
							currentMatch = 'matchNotFound';
							callback(currentMatch);
						} else {
							console.log('data.Item = ' + data.Item);
							currentMatch = new Match( data.Item );
							console.log('currentMatch obj created after loading = ' + JSON.stringify(currentMatch) );		
							callback(currentMatch);
						};
					});
                };
            });
        }		
    };
})();
console.log('exiting matchStorageForButton.js');
module.exports = matchStorageForButton;
