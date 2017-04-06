/*
 * Serve content over a socket
 */
var logger = require('../libs/logger');



var redis = require('redis');
var client_redis = redis.createClient({db: process.env.REDIS_DB || 0});
var messages = require('../libs/messages');
var userNames = require('../libs/userNames');

// Keep track of which names are used so that there are no duplicates

module.exports = function (socket) {
  socket.emit('init:request', {});
  var name = null;
  var ContextUser = {};
  var Contextwebsocket = {
    redis: client_redis,
    socket: socket
  };

  socket.on('game:invite', function (data) {
    logger.info('receive game:invite from %s to %s', ContextUser.name, data.to);
    var parameters = Contextwebsocket;
    parameters.data = data;
    parameters.user = ContextUser;
    messages.gameInvite(parameters)
      .then(messages.CreateGame)
      .then(messages.addGameToUser)
      .then(messages.sendInvite)
      .catch(function (err) {
        logger.error(err)
      })

  });

  socket.on('game:play', function (data) {
    logger.info('receive game:play from %s to %s colomn %s', ContextUser.name, data.to, data.column);
    var to = data.to,
      column = data.column;
    if (data.column !== parseInt(data.column)) {
      log('error', {socket: socket}, 'Column must be a int');
      socket.emit('error', {
        message: 'Bad Move',
        error: 'column must be an int, not ' + data.column
      });
      return
    }

    var parameters = Contextwebsocket;
    parameters.data = data;
    parameters.user = ContextUser;
    messages.loadGame(parameters) // revolve : parameter.dataGame
      .then(messages.addplay)
      .then(messages.isWinner)
      .then(messages.storePlay)
      .then(messages.sendPlay)
      .catch(function (err) {
        logger.error(err)
      })
  });

  socket.on('init:send', function (data) {
    var parameters = Contextwebsocket;
    parameters.data = data;
    parameters.user = ContextUser;

    messages.recvInitSend(parameters)
      .then(userNames.getGuestName)
      .then(messages.sendInit)
      .then(messages.addToConnectedUser)
      .then(messages.storeSid)
      .then(messages.sendBroadcastUserJoin)
      .then(function (parameters) {
        logger.info('User connected %s', parameters.data.name);
      })
      .catch(function (err) {
        logger.error(err);
      });
  });

  // shit hack due the   user:leave arrive after user:join during a page refresh
  setTimeout(function () {
    if (ContextUser.name !== null) {
      socket.broadcast.emit('user:presence', {name: ContextUser.name});
      socket.emit('user:update', {name: ContextUser.name});
    }
  }, 5000);

  // Ping for update presence
  socket.on('user:ping', function (data) {
    if (ContextUser.name != data.name) {
      logger.error('name mismatch in user:ping %s != %s', ContextUser.name, data.name);
      return
    }
    userNames.claim(ContextUser.name);
    logger.info('user:ping %s', ContextUser.name);
    client_redis.setex('presence-' + ContextUser.name, 30, 'CREPEOSUC');
    socket.broadcast.emit('user:presence', {name: ContextUser.name});
    //refresh myself
    socket.emit('user:update', {name: ContextUser.name});
  });

  // disconnect => clean and remove session
  socket.on('disconnect', function () {
    // possible case during reloas server
    // todo search sid in all user ( reverse hashmap)
    if (ContextUser.name === undefined) {
      return
    }
    logger.info('user disconnected', ContextUser.name);
    var parameters = Contextwebsocket;
    parameters.user = ContextUser;

    messages.deleteSid(parameters).catch(function (err) {
      logger.error(err)
    });
    client_redis.scard('sid-' + ContextUser.name, function (err, value) {
      if (err) {
        logger.error(new Error(err))
      } else {
        if (value == 0) {
          socket.broadcast.emit('user:leave', {
            name: ContextUser.name
          });
          client_redis.del('presence-' + ContextUser.name, 30, 'CREPEOSUC');
          client_redis.srem('ListConnectedUser', ContextUser.name, function (err) {
            logger.debug(err);
          });
          userNames.free(ContextUser.name);
        }
      }
    });
  });

};

