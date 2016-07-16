
'use strict';
console.log('entering playerStorage.js');
var AWS = require("aws-sdk");
//var util = require('util');

var playerStorage = (function () {
    // var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
	var docClient = new AWS.DynamoDB.DocumentClient();
	
	//var PingpongPlayersTable = 'PingpongPlayers'; // FOR PRODUCTION
	var PingpongPlayersTable = 'PingpongPlayers-Dev'; // FOR DEVELOPMENT	

    /*
     * The Player class stores all Player info
     */
    function Player(session, loadedPlayer) {
    	console.log('entering Player function');
		//console.log('this.data entering Player function = ' + this.data);
        if (loadedPlayer) {
            this.data = loadedPlayer;
            //console.log('successfully passed loadedPlayer data in: ' + JSON.stringify(this.data));
        } else { // no existing player passed in, must be a call from newPlayer
			console.log('no existing player passed in, must be a call from newPlayer');
			
			var matchPreferences = {
					TwentyOnePointer: false, // set if players call for a 21 point game
					GamesPerMatch: 1, // number of games per match, either 1 or 5 (best 3 out of 5)
					SassMeter: 5, // specifies the likelyhood of telling a joke after a point is played, between 0 (no jokes) and 10 (a joke every time)					
					SwitchSides: true, // flag to indicate whether players want to switch sides during the match. Default = true
					AnnounceServe: true, // flag to indicate whether or not to announce who's serve it is when starting a new game
					ExperiencedUserMode: false // flag to indicate whether minimal words should be spoken. Default = false								
            };			

			var newPlayerData = {
					Phone: 		parseInt(session.attributes.newPlayerPhone), 
					Name:		session.attributes.newPlayerName.toLowerCase(),
					TopicARN: 	"TBD",
					Preferences: matchPreferences					
			};	

			this.data = newPlayerData;			
            console.log('no match data passed in. New Player data being established = ' + JSON.stringify(this.data));
		};
		console.log('exiting Player function');
    };


    Player.prototype = {
        save: function (session, callback) {
            console.log('entering Player.prototype save function');
			
			if (session) {
				//console.log ('session in player save function = ' + JSON.stringify(session)); // see if session is populated
				console.log('session.attributes.newPlayerPhone = ' + session.attributes.newPlayerPhone);
			};
			
			var table = PingpongPlayersTable;

			var params = {
				TableName: table,
				Item:	{
							"Phone": 		this.data.Phone,
							"Name":			this.data.Name,
							"TopicARN": 	this.data.TopicARN,
							"Preferences": 	this.data.Preferences
				}																				
			};

			docClient.put(params, function(err, data) {
				if (err) {
					console.error("Unable to save player profile. Error JSON:", JSON.stringify(err, null, 2));
				} else {
					console.log("Player profile saved:", JSON.stringify(data, null, 2));
				}
				if (callback) {
                    callback();
                }
			});	         
            console.log('exiting Player.prototype save function');
        }
    };

    return {
        loadPlayer: function (session, callback) {
            console.log('entering playerStorage.loadPlayer function');
			console.log('session.attributes.phoneKey = ' + session.attributes.phoneKey)
            if (session.attributes.currentPlayers) {
                console.log('Existing session has the player data, so getting it from session = ' + JSON.stringify(session.attributes.currentPlayers));
                callback(new Player(session, session.attributes.currentPlayers));
                return;
            }             
			console.log('Existing session does not have the player data, so getting it from DynamoDB data store');

			var params = {
				
				TableName: PingpongPlayersTable,
				Key: {
						Phone: 	parseInt(session.attributes.phoneKey) 			
				}
			};
						  
			docClient.get(params, function(err, data) {
                var newLoadedPlayer;  
                if (err) {
                	console.log('there was an error in loadPlayer function, info follows: ');
                    console.log(err, err.stack);
					newLoadedPlayer = 'errorLoadingPlayer';
                    callback(newLoadedPlayer); 
                } else if (data.Item === undefined) {
                	console.log('Data was loaded from DynamoDB without error, but no Item was found matching the criteria');
					newLoadedPlayer = 'playerNotFound';
                    callback(newLoadedPlayer); 
                } else { 				
                    
					//console.log('util.inspect of newLoadedPlayer = ' + util.inspect(newLoadedPlayer) );					
					//console.log('newLoadedPlayer.data = ' + JSON.stringify(newLoadedPlayer.data));
					//console.log('util.inspect of session = ' + util.inspect(session) );

					newLoadedPlayer = new Player( session, data.Item );
					console.log('newLoadedPlayer obj created after loading = ' + JSON.stringify(newLoadedPlayer) );
                    session.attributes.newLoadedPlayer = newLoadedPlayer.data;
                    callback(newLoadedPlayer);
                }
            });
        },
		
        newPlayer: function (session, callback) { // register a new player 
			console.log('entering NewPlayer function' );
			var newRegPlayer = new Player( session );
			console.log('newRegPlayer variable from newPlayer = ' + JSON.stringify(newRegPlayer, null, 2) );
            callback(newRegPlayer);
			console.log('exiting NewPlayer function' );
        }	
    };
})();
console.log('exiting playerStorage.js');
module.exports = playerStorage;
