console.log("Getting item in MatchKeeperMatches");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();
var myStart = 0123;
var echoUserID = "MyUserID3";



var params = {
    TableName: 'MatchKeeperMatches-Dev',
	Key: {
			MatchStartTime: { N: JSON.stringify(myStart) },       			
			EchoUserID: 	{ S: echoUserID }
	}
};
	
  
dynamodb.getItem(params, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(JSON.stringify(data, null, 2));
});
