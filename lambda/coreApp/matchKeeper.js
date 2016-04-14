
'use strict';
console.log('entering MatchKeeper.js');
var AlexaSkill = require('./AlexaSkill'),
    eventHandlers = require('./eventHandlers'),
    intentHandlers = require('./intentHandlers');

// var APP_ID = "amzn1.echo-sdk-ams.app.4cd0a8f9-ba04-409f-8fd1-27b329e4e9e1";// Tennis MatchManager PRODUCTION app ID
var APP_ID = "amzn1.echo-sdk-ams.app.365030f7-72a5-4ed6-ad04-8aaf30201be3";// Tennis MatchManager DEVELOPMENT app ID
var skillContext = {};

var MatchKeeper = function () {
    AlexaSkill.call(this, APP_ID);
    skillContext.needMoreHelp = true;
};

// Extend AlexaSkill parent to MatchKeeper child
MatchKeeper.prototype = Object.create(AlexaSkill.prototype);
MatchKeeper.prototype.constructor = MatchKeeper;

eventHandlers.register(MatchKeeper.prototype.eventHandlers, skillContext);

intentHandlers.register(MatchKeeper.prototype.intentHandlers, skillContext);

console.log('exiting MatchKeeper.js');
module.exports = MatchKeeper;

