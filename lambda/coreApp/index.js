
'use strict';
var MatchKeeper = require('./matchKeeper');

exports.handler = function (event, context) {
    var matchKeeper = new MatchKeeper();
    matchKeeper.execute(event, context);
};

