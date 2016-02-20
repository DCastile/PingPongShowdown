console.log("Putting item in MatchKeeperMatches");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();

var echoUserID = "MyUserID4";
var player1ID = "027";
var player2ID = "028";

var startTime  = new Date();
var millisecs = startTime.getTime();
var testMe = 0123;

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
    TableName: "MatchKeeperMatches-Dev",
                Item: {                  
                    "EchoUserID": 		{ "S": echoUserID }, //S: this._session.user.userId
                    "MatchStartTime":	{ "N": JSON.stringify(millisecs) }, //either JSON.stringify(millisecs) or JSON.stringify(testMe) dep on get or query test                     
                    "Player1ID": 		{ "S": player1ID }, 
                    "Player2ID": 		{ "S": player2ID },                                                          
                    "MatchData": 		{ "S": JSON.stringify(matchData) }
                }
};


dynamodb.putItem(params, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(JSON.stringify(data, null, 2));
});
