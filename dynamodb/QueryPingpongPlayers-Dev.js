console.log("Querying PingpongMatches for matches captured in a given Echo UserID session");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();

var echoUserID = "MyUserID4";

var rightNow = new Date().getTime();
var fourHoursAgo = (new Date().getTime() - (9*60*60*1000) ); 

console.log('time right now: ' + new Date(rightNow) );
console.log('four hours ago: ' + new Date(fourHoursAgo) );


var params = {
    TableName : "PingpongMatches-Dev",
    KeyConditionExpression: "EchoUserID = :EchoUserID AND MatchStartTime BETWEEN :fourHoursAgo AND :rightNow",
    ExpressionAttributeValues: {
        ":EchoUserID": { "S": echoUserID , },
        ":rightNow": { "N": JSON.stringify( rightNow ) }, 
        ":fourHoursAgo": { "N": JSON.stringify( fourHoursAgo) }       
    }
};

dynamodb.query(params, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(JSON.stringify(data.Items[data.Count - 1], null, 2));
        console.log(JSON.stringify(data.Items[data.Count - 1].MatchData.S, null, 2));
});




