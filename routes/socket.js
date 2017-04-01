/*
 * Serve content over a socket
 */
var logger = require('../libs/logger');

var redis = require('redis');
var client = redis.createClient();

// Keep track of which names are used so that there are no duplicates
var userNames = (function (socket) {
  var names = {};
  this.socket = socket;

  var claim = function (name) {
    if (!name || names[name]) {
      return false;
    } else {
      names[name] = true;
      return true;
    }
  };

  // find the lowest unused "guest" name and claim it
  var getGuestName = function () {

    var name,
      nextUserId = 1;

    do {
      name = 'Guest ' + nextUserId;
      nextUserId += 1;
    } while (!claim(name));
    return name;
  };

  // serialize claimed names as an array
  var get = function () {
    var res = [];
    for (user in names) {
      if (client.ttl('presence-' + user > 0)) {
        //todo check if it ongame
        res.push(user);
      } else {
        logger.error('user disepear ', user);
      }
    }

    return res;
  };

  var free = function (name) {
    if (names[name]) {
      delete names[name];
    }
  };

  return {
    claim: claim,
    free: free,
    get: get,
    getGuestName: getGuestName
  };
}());

module.exports = function (socket) {

  if (socket.handshake.session.username) {
    var name = socket.handshake.session.username;
  } else {
    var name = userNames.getGuestName(socket);
    socket.handshake.session.username = name;
    socket.handshake.session.save();
  }
  logger.info('user Connected', name);

  // send the new user their name and a list of users
  socket.emit('init', {
    name: name,
    users: userNames.get(),
    version: 7 // change this value relaod all client

  });

  socket.emit('send:name', {
    name: name
  });

  socket.broadcast.emit('user:join', {name: name});

  // shit hack due the   user:leave arrive after user:join during a page refresh
  setTimeout(function () {
    socket.broadcast.emit('user:update', {name: name});
    socket.emit('user:update', {name: name});
  }, 5000);

  socket.on('user:ping', function (data) {
    logger.info('user:ping %s', name);
    client.setex('presence-' + name, 30, 'CREPEOSUC');
    socket.broadcast.emit('user:update', {name: name});
    //refresh myself
    socket.emit('user:update', {name: name});
  });
  socket.on('disconnect', function () {
    logger.info('user disconnected', name);

    socket.broadcast.emit('user:leave', {
      name: name
    });
    client.del('presence-' + name, 30, 'CREPEOSUC');
    userNames.free(name);
  });

};
