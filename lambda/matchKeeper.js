
'use strict';
console.log('entering MatchKeeper.js');
var AlexaSkill = require('./AlexaSkill'),
    eventHandlers = require('./eventHandlers'),
    intentHandlers = require('./intentHandlers');

var APP_ID = "amzn1.echo-sdk-ams.app.0a9ab001-6952-44c7-bd63-61242470825a";// put your APP ID here
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

