var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "PingpongMatches-Dev",
    KeySchema: [       
        { AttributeName: "MatchStartTime", KeyType: "HASH" },  //Partition key
        { AttributeName: "EchoUserID", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [      
        { AttributeName: "MatchStartTime", AttributeType: "N" },
		{ AttributeName: "EchoUserID", AttributeType: "S" },  
        { AttributeName: "Red1PlayerID", AttributeType: "N" },
        { AttributeName: "Red2PlayerID", AttributeType: "N" },
		{ AttributeName: "Blue1PlayerID", AttributeType: "N" },
        { AttributeName: "Blue2PlayerID", AttributeType: "N" },
		//{ AttributeName: "MatchType", AttributeType: "S" } // not defined here because not used in original table or index schema
    ],
	
	// There is a limit of 5 GlobalSecondaryIndexes per table. You can also have 5 LocalSecondaryIndexes.
	// The Local indexes must be created up front. 
	// I can't find a good use for Local Secondary Indexes right now so commenting them out so they don't use provisioned IOPS.
/*
    "LocalSecondaryIndexes": [
        {
            "IndexName": "MatchStartTimeAndRed1PlayerID",
            "KeySchema": [
                { "AttributeName": "MatchStartTime", "KeyType": "HASH" },
                { "AttributeName": "Red1PlayerID", "KeyType": "RANGE" }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            }
        },
		{
            "IndexName": "MatchStartTimeAndRed2PlayerID",
            "KeySchema": [
                { "AttributeName": "MatchStartTime", "KeyType": "HASH" },
                { "AttributeName": "Red2PlayerID", "KeyType": "RANGE" }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            }
        },
        {
            "IndexName": "MatchStartTimeAndBlue1PlayerID",
            "KeySchema": [
                { "AttributeName": "MatchStartTime", "KeyType": "HASH" },
                { "AttributeName": "Blue1PlayerID", "KeyType": "RANGE" }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            }
        },
        {
            "IndexName": "MatchStartTimeAndBlue2PlayerID",
            "KeySchema": [
                { "AttributeName": "MatchStartTime", "KeyType": "HASH" },
                { "AttributeName": "Blue2PlayerID", "KeyType": "RANGE" }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            }
        },
        {
            "IndexName": "MatchStartTimeAndMatchType",
            "KeySchema": [
                { "AttributeName": "MatchStartTime", "KeyType": "HASH" },
                { "AttributeName": "MatchType", "KeyType": "RANGE" }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            }
        }		
    ],
*/
    
    "GlobalSecondaryIndexes": [

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
            IndexName: "Red1PlayerIDIndex",
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
            IndexName: "Blue1PlayerIDIndex",
            KeySchema: [
                {AttributeName: "Blue1PlayerID", KeyType: "HASH"},  //Partition key
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
                {AttributeName: "Red2PlayerID", KeyType: "RANGE"},  //Sort key
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
