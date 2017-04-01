'use strict';

/* Controllers */

angular.module('myApp.controllers', []).controller('AppCtrl', function ($scope, socket) {
  socket.on('init', function (data) {
    $scope.name = data.name;
    $scope.users = data.users;

  });

  socket.on('send:name', function (data) {
    $scope.name = data.name;
  });

  socket.on('send:message', function (message) {
    $scope.messages.push(message);
  });

  socket.on('user:join', function (data) {
    $scope.users.indexOf(data.name) === -1 ? $scope.users.push(data.name): true;
    // todo hightlight it
  });
  socket.on('user:update', function (data) {
    $scope.users.indexOf(data.name) === -1 ? $scope.users.push(data.name): true;

  });

  socket.on('user:leave', function (data) {
    var i, user;
    for (i = 0; i < $scope.users.length; i++) {
      user = $scope.users[i];
      if (user === data.name) {
        $scope.users.splice(i, 1);
        break;
      }
    }
  });

}).controller('MyCtrl1', function ($scope, socket) {
  socket.on('send:time', function (data) {
    $scope.time = data.time;
  });
}).controller('MyCtrl2', function ($scope) {
  // ff
});
