/**
 * Module dependencies
 */
var logger = require('./libs/logger');

var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path');


var sharedSession = require("express-socket.io-session");


var app = module.exports = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var redisIo = require('socket.io-redis');
io.adapter(redisIo({host: 'localhost', port: 6379}));
io.set('transports', ['websocket']);


/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));


sessionSecret = 'dieTonton';
var session = require("express-session")({
  secret: sessionSecret,
  cookie: {expires: new Date(2147483647000)},
  resave: true,

  saveUninitialized: true
});
// Attach session
app.use(session);

// Share session with io sockets
io.use(sharedSession(session, {
  secret: sessionSecret,
  autoSave: true,
  cookie: {expires: new Date(2147483647000)},
  saveUninitialized: true,
  resave: true
}));

io.on('connection', function (socket) {
  logger.info('New Client connected socket.id %s', socket.id)

  // log disconnect
  socket.on('disconnect', function() {
      logger.info('Client gone (id=' + socket.id + ').');
  });
});

//Debugging express
app.use(function (req, res, next) {
  logger.info("Express `req.session` data is %j.", req.session);
  next();
});
// Debugging io
io.use(function (socket, next) {
  logger.info("socket.handshake session data is %j.", socket.handshake.session);
  next();
});


app.use(app.router);

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // TODO
}



/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);
//

// Socket.io Communication
io.sockets.on('connection', require('./routes/socket'));

/**
 * Start Server
 */

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
