var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "PingpongDevices-Dev",
    KeySchema: [       
        { AttributeName: "EchoUserID", KeyType: "HASH" },  //Partition key
        { AttributeName: "MatchStartTime", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [      
 		{ AttributeName: "EchoUserID", AttributeType: "S" },       
		{ AttributeName: "MatchStartTime", AttributeType: "N" },  

    ],
	   
    ProvisionedThroughput: {       
        ReadCapacityUnits: 3, 
        WriteCapacityUnits: 3
    }
};    
dynamodb.createTable(params, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(JSON.stringify(data, null, 2));
});
