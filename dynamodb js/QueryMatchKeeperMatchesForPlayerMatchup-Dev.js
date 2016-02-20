console.log("Querying GameKeeperTable for matches between players 111 and 222");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName: "MatchKeeperMatches-Dev",
    IndexName: "PlayersIndex",
    KeyConditionExpression: "Player1ID = :Player1ID and Player2ID = :Player2ID",
    ExpressionAttributeValues: {
        ":Player1ID": { "N": "7", },
        ":Player2ID": { "N": "8", },       
    }//,
//    ProjectionExpression: "MatchStartTime, Player1ID, Player2ID, MatchWinner",
};

dynamodb.query(params, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(JSON.stringify(data, null, 2));
});

