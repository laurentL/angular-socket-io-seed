'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  factory('socket', function (socketFactory) {
    var options = {};
    options.ioSocket = io.connect('', {transports: ['websocket']});
    return socketFactory(options);
  }).
  value('version', '0.1');
