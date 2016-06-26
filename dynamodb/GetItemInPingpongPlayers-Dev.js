console.log("Getting item in MatchKeeperPlayers");
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();

var phone = 1111111111;
var dob = "8-9-68";

var params = {
    TableName: 'PingpongPlayers-Dev',
	Key: {
			Phone: 	{ N: JSON.stringify(phone) }    			
			//DOB: 	{ S: dob }
	}
};
	
  
dynamodb.getItem(params, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(JSON.stringify(data, null, 2));
		if (data.Item === undefined) { 
			console.log('no items found');
		} 
		else { 
			console.log('data.Item = ' + JSON.stringify(data.Item));
			console.log('data.Item.Phone = ' + JSON.stringify(data.Item.Phone));
			console.log('data.Item.Phone.N = ' + data.Item.Phone.N);
		};
		
});

