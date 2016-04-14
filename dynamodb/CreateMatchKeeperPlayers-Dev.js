var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "MatchKeeperPlayers-Dev",
    KeySchema: [       
        { AttributeName: "Phone", KeyType: "HASH" }  //Partition key
        //{ AttributeName: "DOB", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [      
        { AttributeName: "Phone", AttributeType: "N" } 
        //{ AttributeName: "DOB", AttributeType: "S" }
    ],
 
    ProvisionedThroughput: {       
        ReadCapacityUnits: 1, 
        WriteCapacityUnits: 1
    }
};    
dynamodb.createTable(params, function(err, data) {
    if (err)
        console.log(JSON.stringify(err, null, 2));
    else
        console.log(JSON.stringify(data, null, 2));
});
