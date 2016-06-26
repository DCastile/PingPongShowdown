console.log("Getting item in MatchKeeperDevices");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();
var millisecs = 126;
var echoUserID = "MyUserID2";



var params = {
    TableName: 'PingpongMatches-Dev',
	Key: {
			"EchoUserID": 		echoUserID,      			
			"MatchStartTime":	millisecs 
	}
};
	
  
docClient.get(params, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(data);
		console.log('i am here');
		console.log( JSON.stringify(data) );
		console.log( JSON.stringify(data.item) );
});
