'use strict';

/* Controllers */

angular.module('myApp.controllers', []).controller('AppCtrl', function ($scope, socket, localStorage, $location) {
  socket.on('init:request', function () {
    socket.emit('init:send', {
      name: localStorage.getValue('name') || null,
      sid: getCookie('connect.sid')|| generateUUID()

    });

  });


  socket.on('init', function (data) {
    console.log('receive %s', JSON.stringify(data));
    $scope.name = data.name;
    localStorage.setValue('name', data.name);
    $scope.users = data.users;
    $scope.games = [];
    $scope.games.push('Guest1');
    $scope.games.push('Guest2');

    localStorage.checkVersion(data.version);
  });

  socket.on('send:name', function (data) {
    $scope.name = data.name;
  });

  socket.on('send:message', function (message) {
    $scope.messages.push(message);
  });

  // never expected
  socket.on('user:update', function (data) {
    if ($scope.name !== data.name) {
      console.error('local:%s, server:%s', $scope.name, data.name)
      socket.disconnect();
      localStorage.delValue('name');
      socket.connect();
    }
  });

  socket.on('user:join', function (data) {
    console.log('new user is coming: ' + data.name);
    $scope.users.indexOf(data.name) === -1 ? $scope.users.push(data.name) : true;
    // todo hightlight it
  });
  socket.on('user:presence', function (data) {
    $scope.users.indexOf(data.name) === -1 ? $scope.users.push(data.name) : true;
    console.log('update presence user %s', data.name)

  });
  var dummyVar = setInterval(function () {
    ping()
  }, 30000);

  function ping() {
    socket.emit('user:ping', {name: $scope.name});
    console.log('sending user:ping: ' + name);
  }
  socket.on('game:newgame', function (data) {
    console.log('receive new game from: %s', data.user);
  });

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

  // ss
  $scope.selectedGame = '';
  /* first one set active by default */
  $scope.selectGame = function (game) {
    $scope.selectedGame = game;
    console.log("select %s", game)
  };
  // Update app over location
  $scope.$watch(function () {
    return $location.path();
  }, function (newpath) {
    console.log('entering in fucking anonymous function %s', newpath)
    var tabpath = newpath.split("/");
    if (tabpath.length > 2) {
      var gameActive = tabpath[2];
      $scope.selectedGame = gameActive;
      console.log('select %s', gameActive)
    }
  });
  $scope.gameInvite = function (userToInvite) {
    socket.emit('game:invite', {to: userToInvite});
    console.log('invite user %s', userToInvite)
  };
  // magic cell position
  // 5 12 19 26 33 40 47
  // 4 11 18 25 32 39 46
  // 3 10 17 24 31 38 45
  // 2 9 16 23 30 37 44
  // 1 8 15 22 29 36 43
  // 0 7 14 21 28 35 42
  $scope.cellPosition = [
    [5, 12, 19, 26, 33, 40, 47],
    [4, 11, 18, 25, 32, 39, 46],
    [3, 10, 17, 24, 31, 38, 45],
    [2, 9, 16, 23, 30, 37, 44],
    [1, 8, 15, 22, 29, 36, 43],
    [0, 7, 14, 21, 28, 35, 42]
  ]

});


// Helpers
function generateUUID() {
  var d = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}