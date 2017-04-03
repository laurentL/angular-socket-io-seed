/*
 * messages from websocket
 *
 */
var userNames = require('../libs/userNames');
var logger = require('../libs/logger');

var messages = {
  recvInitSend: recvInitSend,
  sendInit: sendInit,
  sendBroadcastUserJoin: sendBroadcastUserJoin,
  storeSid: storeSid,
  deleteSid: deleteSid,
  gameInvite: gameInvite,
  sendInvite: sendInvite
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
      socket.emit('init', {
        name: parameters.data.name,
        users: userNames.get(),
        version: 16 // change this value relaod all client

      });
      resolve(parameters)
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
      resolve(parameters)

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
    client_redis.srem('sid-' + parameters.user.name, socket.id)
    resolve(parameters)
  });
}

function gameInvite(parameters) {
  return new Promise(function (resolve, reject) {

    var socket = parameters.socket;
    var data = parameters.data;
    var client_redis = parameters.redis;
    var key = 'sid-' + parameters.data.to;

    client_redis.smembers(key, function (err, values) {
      parameters.next = values
      resolve(parameters)

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
      var sessions = parameters.next
      sessions.forEach(function (session) {
        socket.broadcast.to(session).emit('game:newgame', {user: parameters.user.name})
      })

      // stuff
      // resolv and reject
    }
  )
}

function Dummy(parameters) {
  return new Promise(function (resolve, reject) {

      var socket = parameters.socket;
      var data = parameters.data;
      var client_redis = parameters.redis;

      // stuff
      // resolv and reject
    }
  )
}
