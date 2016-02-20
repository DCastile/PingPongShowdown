
'use strict';
console.log('entering playerSMS.js');
var AWS = require("aws-sdk");

var playerSMS = (function () {
    // var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
	var sns = new AWS.SNS();

    /*
     * The SMS class manages all text message interaction with the user
     */
    function SMS(session, data) {
    	console.log('entering SMS function');	
		if (data) {     	
            this.data = data;
            console.log('successfully passed match data in: ' + JSON.stringify(this.data));
        } else { // no data passed in
			console.log('no data passed in');
		};
		
	};
	
    SMS.prototype = {
        save: function (callback) {
            console.log('entering SMS.prototype save function');
			
	        
            console.log('exiting SMS.prototype save function');
        }
    };

    return {
        sendTopicSubscribeRequest: function (phoneKey, callback) {
			console.log('entering playerSMS.createTopic function');			
			var topicName = {
			  Name: phoneKey.toString()
			};
			
			// 1. call sns.createTopic, and pass 'topicName' into it. 
			// 2. assign the results of that to the variables 'err' and 'data'.
			// 3. then pass 'err' and 'data' into the code in the braces.
			sns.createTopic(topicName, function(err, data) {
				console.log('sequence 1');
				if (err) {
					console.log('sequence error 1');
					console.log(err, err.stack); // an error occurred
					callback('errorCreatingTopicARN'); 
				} else {
					console.log('sequence 2');
					console.log(JSON.stringify(data)); // successful response
					console.log('data.TopicArn = ' + data.TopicArn);
					var topicArn = data.TopicArn;
					console.log('topicArn = ' + topicArn);
					console.log('sequence 3');
																
					// now create the display name, which is a required attribute				
					var params = {
					  AttributeName: 'DisplayName',
					  TopicArn: topicArn, 
					  AttributeValue: 'Alexa text'
					};					
					sns.setTopicAttributes(params, function(err, data) {
						if (err) {
							console.log(err, err.stack); // an error occurred
						} else {
							console.log('data = ' + data);           // successful response
							console.log('sequence 4');
							
							// now send the subscription request							
							console.log('entering sendSubscribeRequest portion');							
							var subscribeInputParams = {
							  Protocol: 'sms', 
							  TopicArn: topicArn, 
							  Endpoint: '1-' + phoneKey.toString() //'1-425-890-8484'
							};
							console.log('sequence 5');
											
							sns.subscribe(subscribeInputParams, function(err, data) {
								if (err) {
									console.log('sequence error 2');
									console.log(err, err.stack); // an error occurred
								} else {
									console.log('sequence 6');
									console.log(JSON.stringify(data)); // successful response
									console.log('sequence 7');
								};
								console.log('stringified data = ' + JSON.stringify(data)); // successful response
								callback(topicArn); 
								console.log('sequence 8');				
							});											
						};
					});																			
				};
			});			
        },
						
		
        publishSMS: function (incomingARN, incomingMessage, callback) {
			console.log('entering playerSMS.publishSMS function');							
	
			sns.publish({
				Message: incomingMessage,
				TopicArn: incomingARN
			}, function(err, data) {
				if (err) {
					console.log(err.stack);
					console.log(err, 'publishSMS function did not successfully complete.');
					var success = false;
				}
				console.log(JSON.stringify(data));

				if (data) {
					console.log('publishSMS function successfully sent a text to ' + incomingARN);
					var success = true;					
				};
				callback(success); 
			});
        },
		
	
        newSMS: function (session, callback) {
			console.log('entering NewSMS function' );
			var currentSMS = new SMS( session );
			//console.log('currentSMS variable from newSMS = ' + JSON.stringify(currentSMS, null, 2) );
            callback(currentSMS);
			console.log('exiting NewMatch function' );
        }
    };	
	


			





})();
console.log('exiting playerSMS.js');
module.exports = playerSMS;
