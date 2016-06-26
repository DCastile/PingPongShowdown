console.log("Getting item in MatchKeeperDevices");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();

var echoUserID = "MyUserID2";


var rightNow = 200;
var fourHoursAgo = 1;

var queryDevicesParams = {

	TableName : "PingpongDevices-Dev", 
	ConsistentRead: true,
	KeyConditionExpression: "EchoUserID = :EchoUserID AND MatchStartTime BETWEEN :fourHoursAgo AND :rightNow",
	ExpressionAttributeValues: {
		":EchoUserID": echoUserID,
		":rightNow": rightNow, 
		":fourHoursAgo": fourHoursAgo       
	}
};

docClient.query(queryDevicesParams, function (err, data) {	

    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(data);
	
	
		var startTimeKey = data.Items[data.Count - 1].MatchStartTime;

		var params = {
			TableName: 'PingpongMatches-Dev',
			Key: {
					"MatchStartTime": 	startTimeKey,
					"EchoUserID": 		echoUserID		
			}
		};
			
		  
		docClient.get(params, function(err, data) {
			if (err)
				console.log(err);
			else
				console.log(data);
		});
			


});
