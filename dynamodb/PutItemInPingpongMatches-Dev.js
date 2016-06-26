console.log("Putting item in MatchKeeperMatches");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();

var echoUserID = "MyUserID2";
var player1ID = "027";
var player2ID = "028";

var millisecs = 124;


var matchData = {
    RedTeamGameScore: 0,
    BlueTeamGameScore: 0,
    RedTeamSetScore: 0,
    BlueTeamSetScore: 0,            
    Set: 1,
	RedTeamSetsWon: 0,
	BlueTeamSetsWon: 0,
	MatchWinner: "TBDWinner",
	RedTeamTotalPointsWon: 0, 
	BlueTeamTotalPointsWon: 0,  
	WhosServe: "TBDServer"                   
};


var params = {
    TableName: "PingpongMatches-Dev",
                Item: {                  
                    "EchoUserID": 		echoUserID, 
                    "MatchStartTime":	millisecs,                     
                    "Player1ID": 		player1ID, 
                    "Player2ID": 		player2ID,                                                          
                    "MatchData": 		matchData
                }
};


docClient.put(params, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(JSON.stringify(data, null, 2));
});
