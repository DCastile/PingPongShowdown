var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "MatchKeeperMatches-Dev",
    KeySchema: [       
        { AttributeName: "EchoUserID", KeyType: "HASH" },  //Partition key
        { AttributeName: "MatchStartTime", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [      
        { AttributeName: "EchoUserID", AttributeType: "S" },  
        { AttributeName: "MatchStartTime", AttributeType: "N" },
        { AttributeName: "Red1PlayerID", AttributeType: "N" },
        { AttributeName: "Red2PlayerID", AttributeType: "N" },
		{ AttributeName: "Blue1PlayerID", AttributeType: "N" },
        { AttributeName: "Blue2PlayerID", AttributeType: "N" },
		{ AttributeName: "MatchType", AttributeType: "S" }
    ],
	
	// There is a limit of 5 GlobalSecondaryIndexes per table. You can also have 5 LocalSecondaryIndexes.
	// The Local indexes must be created up front.
	// Thinking down the road it may be possible to do queries for All EchoUserIDs and then all matches played by a given player,
	// so creating Local indexes now. May be able to remove existing Global indexes and replace with others,
	// such as Doubles Partner indexes for Red and Blue.
    "LocalSecondaryIndexes": [
        {
            "IndexName": "MatchTypeandEchoUserIdIndex",
            "KeySchema": [
                { "AttributeName": "EchoUserID", "KeyType": "HASH" },
                { "AttributeName": "MatchType", "KeyType": "RANGE" }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            }
        },
		{
            "IndexName": "Red1PlayerIDandEchoUserIdIndex",
            "KeySchema": [
                { "AttributeName": "EchoUserID", "KeyType": "HASH" },
                { "AttributeName": "Red1PlayerID", "KeyType": "RANGE" }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            }
        },
        {
            "IndexName": "Red2PlayerIDandEchoUserIdIndex",
            "KeySchema": [
                { "AttributeName": "EchoUserID", "KeyType": "HASH" },
                { "AttributeName": "Red2PlayerID", "KeyType": "RANGE" }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            }
        },
        {
            "IndexName": "Blue1PlayerIDandEchoUserIdIndex",
            "KeySchema": [
                { "AttributeName": "EchoUserID", "KeyType": "HASH" },
                { "AttributeName": "Blue1PlayerID", "KeyType": "RANGE" }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            }
        },
        {
            "IndexName": "Blue2PlayerIDandEchoUserIdIndex",
            "KeySchema": [
                { "AttributeName": "EchoUserID", "KeyType": "HASH" },
                { "AttributeName": "Blue2PlayerID", "KeyType": "RANGE" }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            }
        }		
    ],
    
    "GlobalSecondaryIndexes": [


		
        {
            IndexName: "Red1PlayerIDIndex",
            KeySchema: [
                {AttributeName: "Red1PlayerID", KeyType: "HASH"},  //Partition key

            ],
            Projection: {
                "ProjectionType": "ALL"
            },
            ProvisionedThroughput: {
                "ReadCapacityUnits": 1,"WriteCapacityUnits": 1
            }
        },
        {
            IndexName: "Blue1PlayerIDIndex",
            KeySchema: [
                {AttributeName: "Blue1PlayerID", KeyType: "HASH"},  //Partition key

            ],
            Projection: {
                "ProjectionType": "ALL"
            },
            ProvisionedThroughput: {
                "ReadCapacityUnits": 1,"WriteCapacityUnits": 1
            }
        },
        {
            IndexName: "RedDoublesPartnerIndex",
            KeySchema: [
                {AttributeName: "Red1PlayerID", KeyType: "HASH"},  //Partition key
                {AttributeName: "Red21PlayerID", KeyType: "RANGE"},  //Sort key
            ],
            Projection: {
                "ProjectionType": "ALL"
            },
            ProvisionedThroughput: {
                "ReadCapacityUnits": 1,"WriteCapacityUnits": 1
            }
        },
        {
            IndexName: "BlueDoublesPartnerIndex",
            KeySchema: [
                {AttributeName: "Blue1PlayerID", KeyType: "HASH"},  //Partition key
                {AttributeName: "Blue2PlayerID", KeyType: "RANGE"},  //Sort key
            ],
            Projection: {
                "ProjectionType": "ALL"
            },
            ProvisionedThroughput: {
                "ReadCapacityUnits": 1,"WriteCapacityUnits": 1
            }
        }

	
	
		/***************** change to this once it works without time, then add time
        {
            IndexName: "SinglesOpponentIndex",
            KeySchema: [
                {AttributeName: "Red1PlayerID", KeyType: "HASH"},  //Partition key
                {AttributeName: "Blue1PlayerID", KeyType: "RANGE"},  //Sort key
            ],
            Projection: {
                "ProjectionType": "ALL"
            },
            ProvisionedThroughput: {
                "ReadCapacityUnits": 1,"WriteCapacityUnits": 1
            }
        },		
        {
            IndexName: "Red1andTimeIndex",
            KeySchema: [
                {AttributeName: "Red1PlayerID", KeyType: "HASH"},  //Partition key
                {AttributeName: "MatchStartTime", KeyType: "RANGE"},  //Sort key
            ],
            Projection: {
                "ProjectionType": "ALL"
            },
            ProvisionedThroughput: {
                "ReadCapacityUnits": 1,"WriteCapacityUnits": 1
            }
        },
        {
            IndexName: "Red2andTimeIndex",
            KeySchema: [
                {AttributeName: "Red2PlayerID", KeyType: "HASH"},  //Partition key
                {AttributeName: "MatchStartTime", KeyType: "RANGE"},  //Sort key
            ],
            Projection: {
                "ProjectionType": "ALL"
            },
            ProvisionedThroughput: {
                "ReadCapacityUnits": 1,"WriteCapacityUnits": 1
            }
        },
        {
            IndexName: "RedDoublesPartnerIndex",
            KeySchema: [
                {AttributeName: "Red1PlayerID", KeyType: "HASH"},  //Partition key
                {AttributeName: "Red21PlayerID", KeyType: "RANGE"},  //Sort key
            ],
            Projection: {
                "ProjectionType": "ALL"
            },
            ProvisionedThroughput: {
                "ReadCapacityUnits": 1,"WriteCapacityUnits": 1
            }
        },
        {
            IndexName: "BlueDoublesPartnerIndex",
            KeySchema: [
                {AttributeName: "Blue1PlayerID", KeyType: "HASH"},  //Partition key
                {AttributeName: "Blue2PlayerID", KeyType: "RANGE"},  //Sort key
            ],
            Projection: {
                "ProjectionType": "ALL"
            },
            ProvisionedThroughput: {
                "ReadCapacityUnits": 1,"WriteCapacityUnits": 1
            }
        }
		*/
		
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
