/*
 * Serve content over a socket
 */
var logger = require('../libs/logger');

var redis = require('redis');
var client_redis = redis.createClient();
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
    logger.info('receive game:invite from %s to %s', ContextUser.name, data.to)
    var parameters = Contextwebsocket;
    parameters.data = data;
    parameters.user = ContextUser;
    messages.gameInvite(parameters)
      .then(messages.sendInvite)
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


  socket.on('user:ping', function (data) {
    userNames.claim(ContextUser.name);
    logger.info('user:ping %s', ContextUser.name);
    client_redis.setex('presence-' + name, 30, 'CREPEOSUC');
    socket.broadcast.emit('user:presence', {name: ContextUser.name});
    //refresh myself
    socket.emit('user:update', {name: ContextUser.name});
  });

  socket.on('disconnect', function () {
    logger.info('user disconnected', ContextUser.name);
    var parameters = Contextwebsocket;
    parameters.user = ContextUser;

    messages.deleteSid(parameters).catch(function (err) {
      logger.error(err)
    });

    socket.broadcast.emit('user:leave', {
      name: ContextUser.name
    });
    client_redis.del('presence-' + ContextUser.name, 30, 'CREPEOSUC');
    userNames.free(ContextUser.name);
  });

};

