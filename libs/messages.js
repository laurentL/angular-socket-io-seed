/*
 * messages from websocket
 *
 */
var userNames = require('../libs/userNames');
var logger = require('../libs/logger');
var p4 = require('../libs/p4');

var messages = {
  recvInitSend: recvInitSend,
  sendInit: sendInit,
  sendBroadcastUserJoin: sendBroadcastUserJoin,
  storeSid: storeSid,
  deleteSid: deleteSid,
  gameInvite: gameInvite,
  sendInvite: sendInvite,
  CreateGame: CreateGame,
  addGameToUser: addGameToUser,
  addToConnectedUser: addToConnectedUser,
  loadGame: loadGame,
  addplay: addplay,
  isWinner: isWinner,
  storePlay: storePlay,
  sendPlay: sendPlay,
  log: log
};

module.exports = messages;

function recvInitSend(parameters) {
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;
      resolve(parameters);
    }
  )
}


function sendInit(parameters) {
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;


      // send the new user their name and a list of users
      logger.info('send INIT to %s', parameters.data.name);
      var users = [];
      client_redis.smembers('ListConnectedUser', function (err, value) {
          if (err) {
            logger.error(new Error(err))
          } else {
            users = value;
            var dataGames = [];
            client_redis.smembers('games-' + parameters.data.name, function (err, enemies) {
              if (err) {
                logger.error(new Error(err))
              } else {
                // Load all game for the curent user
                logger.info('games for %s : %s', parameters.data.name, enemies);
                var keys = [];
                enemies.forEach(function (enemy) {
                  keys.push(getRedisKeyGame(enemy, parameters.data.name));
                });
                client_redis.mget(keys, function (err, values) {
                  // unserialize data games
                  dataGames = [];
                  if (values !== undefined) {
                    values.forEach(function (datagame) {
                      dataGames.push(JSON.parse(datagame))
                    });
                  }


                  logger.info('dataGame for user %s ', parameters.data.name, JSON.stringify(dataGames))

                  socket.emit('init', {
                    name: parameters.data.name,
                    users: users,
                    games: dataGames,
                    version: 16 // change this value relaod all client

                  });
                  resolve(parameters);
                })


              }
            });

          }
        }
      );

    }
  )
}

function sendBroadcastUserJoin(parameters) {
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;
      socket.broadcast.emit('user:join', {name: parameters.data.name});
      resolve(parameters);
    }
  )
}

function storeSid(parameters) {
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;
      var key = 'sid-' + parameters.user.name;
      client_redis.sadd(key, socket.id);
      client_redis.expire(key, 3600 * 24);
      resolve(parameters);

      // stuff
      // resolv and reject
    }
  )
}

function deleteSid(parameters) {
  return new Promise(function (resolve, reject) {

    var socket = parameters.socket;
    var data = parameters.data;
    var client_redis = parameters.redis;
    client_redis.srem('sid-' + parameters.user.name, socket.id);
    resolve(parameters);
  });
}

function gameInvite(parameters) {
  return new Promise(function (resolve, reject) {

    var socket = parameters.socket;
    var data = parameters.data;
    var client_redis = parameters.redis;
    var key = 'sid-' + parameters.data.to;

    client_redis.smembers(key, function (err, values) {
      parameters.next = values;
      resolve(parameters);

    })
  })

  // stuff
  // resolv and reject
}

function sendInvite(parameters) {
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;
      var sessions = parameters.next;
      // self invite to the game
      socket.emit('game:newgame', {
        user: parameters.data.to,
        dataGame: parameters.dataGame
      });
      // invite enemy
      sessions.forEach(function (session) {
        socket.broadcast.to(session).emit('game:update', {
            //user: parameters.user.name,
            dataGame: parameters.dataGame
          }
        )
      });
      resolve(parameters);

    }
  )
}


function CreateGame(parameters) {
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;

      // add game
      var key = getRedisKeyGame(parameters.user.name, parameters.data.to);
      logger.info('add a new game %s', key);
      client_redis.get(key, function (error, value) {
        if (error) {
          reject(new Error(err))
        }
        logger.info('get %s game from redis return %s', key, value);
        if (value === null) {
          // create game/key
          dataGame = {};
          dataGame[parameters.user.name] = 0;
          dataGame[parameters.data.to] = 0;
          // random first player
          if (Math.round(Math.random()) === 0) {
            dataGame.nextPlayer = parameters.data.to;
          } else {
            dataGame.nextPlayer = parameters.user.name;
          }
          logger.info('store datagame to redis %s', JSON.stringify(dataGame))
          client_redis.set(key, JSON.stringify(dataGame));
          parameters.dataGame = dataGame;
          parameters.newGame = true;
          resolve(parameters);

        } else {
          parameters.dataGame = value;
          parameters.newGame = false;
          resolve(parameters);
        }

      })

    }
  )
}


function addGameToUser(parameters) {
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;
      client_redis.sadd('games-' + parameters.user.name, parameters.data.to.toString());
      client_redis.sadd('games-' + parameters.data.to, parameters.user.name.toString());
      resolve(parameters);
    }
  )
}
function addToConnectedUser(parameters) {

  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;
      client_redis.sadd('ListConnectedUser', parameters.user.name);
      resolve(parameters);

    }
  )
}


function loadGame(parameters) {

  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;
      /* data format:
       to: $scope.selectedGame,
       column: column
       */
      client_redis.get(getRedisKeyGame(parameters.data.to, parameters.user.name), function (err, value) {
        if (err) {
          reject(err)
        } else {
          parameters.dataGame = JSON.parse(value);
          logger.info('sid=%s: game loaded %s', socket.sid);
          resolve(parameters)
        }
      })
    }
  )
}


function addplay(parameters) {

  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;
      if (parameters.dataGame.nextPlayer !== parameters.user.name) {
        // reject play
        reject('%s play in place of %s', parameters.user.name, parameters.dataGame.nextPlayer)
      }
      // merge 2 grid
      var mergedGrid_int = parseInt(parameters.dataGame[parameters.user.name]) + parseInt(parameters.dataGame[parameters.user.name]);

      /*
       find lower free case in column
       cell :range( 7 x column , 7x column + 5 )inc
       */
      var mergedGrid_bitArray = reverse((mergedGrid_int + Math.pow(2, 49)).toString(2)).substring(0, 48);
      lowerCell = 7 * parseInt(parameters.dataGame.column);
      var cell;
      for (cell = lowerCell; cell < lowerCell + 8; i++) {
        if (mergedGrid_bitArray[cell] === '0') {
          break;
        }
      }
      if (cell > lowerCell + 7) {
        reject('Colomn full')
      } else {
        // set to 1 le cell
        parameters.dataGame[parameters.user.name] = parameters.dataGame[parameters.user.name] + Math.pow(2, cell);
        parameters.dataGame.nextPlayer = parameters.data.to;
        resolve(parameters);
      }
    }
  )
}

function isWinner(parameters) {
  return new Promise(function (resolve, reject) {
      var mergedGrid_int = parseInt(parameters.dataGame[parameters.user.name]) + parseInt(parameters.dataGame[parameters.user.name]);

      if (p4.isWinner(mergedGrid_int)) {
        parameters.dataGame.winner = parameters.user.name;
        parameters.dataGame.nextPlayer = null;

      }
      resolve(parameters);
    }
  )
}

function storePlay(parameters) {
  return new Promise(function (resolve, reject) {
      var client_redis = parameters.redis;
      var key = getRedisKeyGame(parameters.user.name, parameters.data.to);
      client_redis.set(key, JSON.stringify(parameters.dataGame), function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(parameters);
        }
      })
    }
  )
}


function sendPlay(parameters) {
  return new Promise(function (resolve, reject) {
    var socket = parameters.socket;
    var data = parameters.data;
    var client_redis = parameters.redis;

    var keys = [
      'sid-' + parameters.data.to,
      'sid-' + parameters.user.name
    ];
    client_redis.sunion(keys, function (err, session) {
        socket.broadcast.to(session).emit('game:update', {
          dataGame: parameters.dataGame
        });

      }
    )
  })
}
function log(level, Context, message) {
  formatedMessage = 'sid={0}, message={1}'.format(Context.socket.id, message)
  logger.log(level, formatedMessage)
}

function Dummy(parameters) {

  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;
    }
  )
}

function getRedisKeyGame(player1, player2) {
  return 'game-' + [player1, player2].sort().join('-')
}


/*
 Reverse a string
 */
function reverse(s) {
  return s.split("").reverse().join("");
}