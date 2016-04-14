console.log("Getting item in MatchKeeperMatches");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();

var millisecs = 124;
var echoUserID = "MyUserID2";

var params = {
    TableName: 'MatchKeeperMatches-Dev',
	Key: {
			"MatchStartTime": 	millisecs,
			"EchoUserID": 		echoUserID		
	}
};
	
  
docClient.get(params, function(err, data) {
    if (err)
        console.log(err);
    else
        console.log(data);
});
