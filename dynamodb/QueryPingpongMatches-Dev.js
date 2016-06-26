console.log("Querying MatchKeeperPlayers");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();

var phone = 1111111111;
var dob = "8-9-68";

var params = {
    TableName : "PingpongPlayers-Dev",
    KeyConditionExpression: "Phone = :Phone AND DOB BETWEEN : AND :rightNow",
    ExpressionAttributeValues: {
        ":Phone": { "S": JSON.stringify(phone) },
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




