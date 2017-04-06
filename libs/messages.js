/*
 * messages from websocket
 *
 */

const logger = require('../libs/logger');
var p4 = require('../libs/p4');

var messages = {
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

};

module.exports = messages;

function sendInit(parameters) {
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var client_redis = parameters.redis;


      // send the new user their name and a list of users
      logger.info('send INIT to %s', parameters.data.name);
      var users = [];
      client_redis.smembers('ListConnectedUser', function (err, value) {
          if (err) {
            logger.error(new Error(err));
            reject(err)
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
                  logger.info('dataGame for user %s ', parameters.data.name, JSON.stringify(dataGames));

                  socket.emit('init', {
                    name: parameters.data.name,
                    users: users,
                    games: dataGames,
                    version: 17 // change this value relaod all client
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
  //noinspection JSUnusedLocalSymbols
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;

      socket.broadcast.emit('user:join', {name: parameters.data.name});
      resolve(parameters);
    }
  )
}

function storeSid(parameters) {
  //noinspection JSUnusedLocalSymbols
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var client_redis = parameters.redis;
      var key = 'sid-' + parameters.user.name;
      client_redis.sadd(key, socket.id);
      client_redis.expire(key, 3600 * 24);
      resolve(parameters);
    }
  )
}

function deleteSid(parameters) {
  //noinspection JSUnusedLocalSymbols
  return new Promise(function (resolve, reject) {

    var socket = parameters.socket;
    var client_redis = parameters.redis;
    client_redis.srem('sid-' + parameters.user.name, socket.id);
    resolve(parameters);
  });
}

function gameInvite(parameters) {
  return new Promise(function (resolve, reject) {
    var client_redis = parameters.redis;
    var key = 'sid-' + parameters.data.to;

    client_redis.smembers(key, function (err, values) {
      if (err) reject(err);
      parameters.next = values;
      resolve(parameters);

    })
  })
}

function sendInvite(parameters) {
  //noinspection JSUnusedLocalSymbols
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var sessions = parameters.next;
      logger.info('Entering in sendInvite');

      // self invite to the game
      socket.emit('game:update', {
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

      var client_redis = parameters.redis;

      // add game
      var key = getRedisKeyGame(parameters.user.name, parameters.data.to);

      client_redis.get(key, function (error, value) {
        if (error) {
          reject(new Error(err))
        }
        logger.info('get %s game from redis return %s', key, value);
        if (value === null) {
          // create game/key
          let dataGame = {};
          dataGame[parameters.user.name] = 0;
          dataGame[parameters.data.to] = 0;
          // random first player
          if (Math.round(Math.random()) === 0) {
            dataGame.nextPlayer = parameters.data.to;
          } else {
            dataGame.nextPlayer = parameters.user.name;
          }
          dataGame.winner = false;
          logger.info('store datagame to redis %s', JSON.stringify(dataGame));
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
  //noinspection JSUnusedLocalSymbols
  return new Promise(function (resolve, reject) {

      var client_redis = parameters.redis;
      logger.info('Entering in AddGameToUser');
      client_redis.sadd('games-' + parameters.user.name, parameters.data.to.toString());
      client_redis.sadd('games-' + parameters.data.to, parameters.user.name.toString());
      resolve(parameters);
    }
  )
}
function addToConnectedUser(parameters) {

  //noinspection JSUnusedLocalSymbols
  return new Promise(function (resolve, reject) {

      var client_redis = parameters.redis;
      client_redis.sadd('ListConnectedUser', parameters.user.name);
      resolve(parameters);

    }
  )
}


function loadGame(parameters) {

  return new Promise(function (resolve, reject) {

      var client_redis = parameters.redis;
      /* data format:
       to: $scope.selectedGame,
       column: column
       */
      var key = getRedisKeyGame(parameters.data.to, parameters.user.name);
      client_redis.get(key, function (err, value) {
        if (err) {
          reject(err)
        } else {
          parameters.dataGame = JSON.parse(value);
          logger.info('game loaded %s', key);
          resolve(parameters)
        }
      })
    }
  )
}


function addplay(parameters) {
  return new Promise(function (resolve, reject) {

      if (parameters.dataGame.nextPlayer !== parameters.user.name) {
        // reject play
        reject(parameters.user.name + ' play in place of ' + parameters.dataGame.nextPlayer)
      }
      // merge 2 grid
      var mergedGrid_int = parseInt(parameters.dataGame[parameters.user.name]) + parseInt(parameters.dataGame[parameters.data.to]);

      /*
       find lower free case in column
       cell :range( 7 x column , 7x column + 5 )inc
       */

      var lowerCell = 7 * parseInt(parameters.data.column);
      var freecell = null;
      for (var cell = lowerCell; cell < lowerCell + 8; cell++) {
        var bit = Math.floor((mergedGrid_int / Math.pow(2, cell) % 2 ));
        if (bit === 0) {
          freecell = cell;
          logger.debug('free bit at position %s', freecell);
          break;
        }
      }
      if (freecell > lowerCell + 5) {
        reject('Colomn full')
      } else {

        // set the cell to 1
        parameters.dataGame[parameters.user.name] = parameters.dataGame[parameters.user.name] + Math.pow(2, freecell);
        parameters.dataGame.nextPlayer = parameters.data.to;
        logger.info('Play added cell=' + freecell + ' mergedGrid=' + mergedGrid_int);
        resolve(parameters);
      }
    }
  )
}

function isWinner(parameters) {
  //noinspection JSUnusedLocalSymbols
  return new Promise(function (resolve, reject) {
      var myGrid_int = parseInt(parameters.dataGame[parameters.user.name]);

      if (p4.isWinner(myGrid_int)) {
        logger.info('Winner: %s : %s', parameters.user.name, parameters.dataGame[parameters.user.name]);
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

      if (parameters.dataGame.winner !== false) {
        logger.info('delete game %s', key);
        client_redis.del(key, function (err) {
          if (err) reject(err);
          client_redis.srem('games-' + parameters.data.to, parameters.user.name, function (err) {
            if (err) reject(err);
            client_redis.srem('games-' + parameters.user.name, parameters.data.to, function (err) {
              if (err) {
                reject(err);
              } else {
                resolve(parameters);
              }
            })
          })
        })
      }
      else {

        client_redis.set(key, JSON.stringify(parameters.dataGame), function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(parameters);
          }
        })
      }
    }
  )
}


function sendPlay(parameters) {

  return new Promise(function (resolve, reject) {

    var socket = parameters.socket;
    var data = parameters.data;
    var client_redis = parameters.redis;

    logger.info('send game:update to %s', parameters.user.name);
    socket.emit('game:update', {
      dataGame: parameters.dataGame
    });
    var keys = [
      'sid-' + parameters.data.to,
      'sid-' + parameters.user.name
    ];
    logger.info('call redis sunion %s', keys);
    client_redis.sunion(keys, function (err, sessions) {
        if (err) reject(err);
        sessions.forEach(function (session) {
          logger.info('game:update sessions=%s, data=%s ', session, JSON.stringify(parameters.dataGame));
          socket.broadcast.to(session).emit('game:update', {
            dataGame: parameters.dataGame
          });
        });
      }
    );
    resolve(parameters);
  })
}


//noinspection JSUnusedLocalSymbols
function Dummy(parameters) {

  //noinspection JSUnusedLocalSymbols
  return new Promise(function (resolve, reject) {

      //noinspection JSUnusedLocalSymbols
    var socket = parameters.socket;
      //noinspection JSUnusedLocalSymbols
    var data = parameters.data;
      //noinspection JSUnusedLocalSymbols
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
//noinspection JSUnusedLocalSymbols
function reverse(s) {
  return s.split("").reverse().join("");
}