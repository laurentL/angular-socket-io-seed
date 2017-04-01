'use strict';

/* Controllers */

angular.module('myApp.controllers', []).controller('AppCtrl', function ($scope, socket, localStrorage) {

  socket.on('init', function (data) {
    console.log('receive %s', JSON.stringify(data))
    $scope.name = data.name;
    $scope.users = data.users;
    localStrorage.checkVersion(data.version);
    });

  socket.on('send:name', function (data) {
    $scope.name = data.name;
  });

  socket.on('send:message', function (message) {
    $scope.messages.push(message);
  });

  socket.on('user:join', function (data) {
    console.log('new user is coming: ' + data.name)
    $scope.users.indexOf(data.name) === -1 ? $scope.users.push(data.name): true;
    // todo hightlight it
  });
  socket.on('user:update', function (data) {
    $scope.users.indexOf(data.name) === -1 ? $scope.users.push(data.name): true;
    console.log('update user %s', data.name)

  });
  setInterval(function () {
    socket.emit('user:ping', {name :$scope.name});
    console.log('sending user:ping: ' + name);
  }, 30000);

  socket.on('user:leave', function (data) {
    console.log('user is leaving: ' + data.name)
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
