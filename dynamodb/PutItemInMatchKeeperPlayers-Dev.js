console.log("Putting item in MatchKeeperPlayers");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();

var phone = 2222222222;
var dob = "8-9-68";

var params = {
    TableName: "MatchKeeperPlayers-Dev",
                Item: {                  
                    "Phone": 	{ "N": JSON.stringify(phone) }
                    //"DOB":		{ "S": dob }
                }
};


dynamodb.putItem(params, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(JSON.stringify(data, null, 2));
});
