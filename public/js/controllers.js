'use strict';

/* Controllers */

angular.module('myApp.controllers', []).controller('AppCtrl', function ($scope, socket, localStorage, $location) {
  socket.on('init:request', function () {
    socket.emit('init:send', {
      name: localStorage.getValue('name') || null,
      sid: getCookie('connect.sid') || generateUUID()
    });

  });


  socket.on('init', function (data) {
    console.log('receive %s', JSON.stringify(data));
    $scope.name = data.name;
    localStorage.setValue('name', data.name);
    $scope.users = data.users;

    // parse all games
    $scope.actionRequired = false;
    var gameList = {};
    data.games.forEach(function (game) {
      var mygrid = game[$scope.name];
      var waitAction = false;
      if (game.nextPlayer === $scope.name) {
        waitAction = true;
      }
      var enemy = getEnemy(game);

      gameList[enemy] = {
        enemy: enemy,
        waitAction: waitAction,
        // myGrid: new BitArray(49, mygrid ).toString(),
        myGrid: reverse(pad(new BitArray(null, mygrid).toString(), 48)),
        //enemyGrid: new BitArray(49, game[enemy] +8).toString()
        enemyGrid: reverse(pad(new BitArray(null, game[enemy]).toString(), 48))
      };
      console.log('myGrid %s', mygrid);
      console.log('enemyGrid %s', game[enemy]);
    });

    $scope.games = gameList;
    localStorage.checkVersion(data.version);
  });

  socket.on('send:name', function (data) {
    $scope.name = data.name;
  });

  // never expected
  socket.on('user:update', function (data) {
    if ($scope.name !== data.name) {
      console.error('local:%s, server:%s', $scope.name, data.name);
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
  setInterval(function () {
    ping()
  }, 30000);

  function ping() {
    socket.emit('user:ping', {name: $scope.name});
    console.log('sending user:ping: ' + name);
  }

  socket.on('game:update', function (data) {
    console.log('receive new game %s', data);
    var enemy = getEnemy(data.dataGame);
    //var enemyGrid = reverse(pad(new BitArray(null, getEnemy(data.dataGame)).toString(), 48));
    var enemyGrid = reverse(pad(new BitArray(null, data.dataGame[enemy]).toString(), 48));
    var MyGrid = reverse(pad(new BitArray(null, data.dataGame[$scope.name]).toString(), 48));
    //var MyGrid = reverse(pad(new BitArray(null, data.dataGame[$scope.name]), 48).toString());

    console.log('dataGame self:', MyGrid);
    console.log('dataGame :', JSON.stringify(data));


    var waitAction = (data.dataGame.nextPlayer === $scope.name);
    var winner = data.dataGame.winner;

    $scope.games[enemy] = {
      enemy: enemy,
      waitAction: waitAction,
      myGrid: MyGrid,
      enemyGrid: enemyGrid,
      winner: winner
    };
  });


  socket.on('user:leave', function (data) {
    console.log('user is leaving: ' + data.name);
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
    console.debug('entering in fucking anonymous function %s', newpath);
    var tabpath = newpath.split("/");
    if (tabpath.length > 2) {
      var gameActive = tabpath[2];
      $scope.selectedGame = gameActive;
      console.log('select %s', gameActive)
    }
  });


  $scope.$watch(function (scope) {
    return scope.games;
  }, function () {
    var actionRequired = false;
    if ('games' in $scope) {
      Object.keys($scope.games).forEach(function (game) {
        if ($scope.games[game].waitAction) {
          actionRequired = true;
        }
      });
    }
    $scope.actionRequired = actionRequired;

  }, true);

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
  ];


  function getEnemy(game) {
    var enemy = null;
    Object.keys(game).forEach(function (key) {
      if ([$scope.name, 'nextPlayer', 'winner'].indexOf(key) === -1) {
        enemy = key;
      }
    });
    return enemy;
  }

  $scope.playColumn = function (column) {
    if (!$scope.games[$scope.selectedGame].waitAction) {
      // todo pop message style wait .. try to cheat ?
      return;
    }
    console.log("play column %s", column);
    socket.emit('game:play', {
      to: $scope.selectedGame,
      column: column
    })
  }
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
  if (parts.length === 2) return parts.pop().split(";").shift();
}

