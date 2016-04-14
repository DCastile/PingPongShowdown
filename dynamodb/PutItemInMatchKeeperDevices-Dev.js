console.log("Putting item in MatchKeeperDevices-Dev");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();

var echoUserID = "MyUserID2";

//var startTime  = new Date();
var millisecs = 126;

var params = {
    TableName: "MatchKeeperDevices-Dev",
                Item: {                  
                    "EchoUserID": 		echoUserID, 
                    "MatchStartTime":	millisecs,                     
                }
};


docClient.put(params, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(data);
});
