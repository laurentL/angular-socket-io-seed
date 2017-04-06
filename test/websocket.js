/**
 * Created by llabatut on 4/5/17.
 */

process.env.NODE_ENV = 'test';
process.env.REDIS_DB = 6;
process.env.logLevel = 'debug';
process.env.PORT = 9001;

var should = require('should');
var io = require('socket.io-client');
var helpers = require('./helpers');


var socketURL = 'http://127.0.0.1:9001';

var options = {
  transports: ['websocket'],
  'force new connection': true
};


before(function (done) {
  // Wipe DB
  var redis = require('redis');
  var client_redis = redis.createClient({db: process.env.REDIS_DB || 0});
  client_redis.flushdb();
  var server = require('../app');
  done();
});


describe('Presence Server', function () {


  describe("connection", function () {
    var receive = 0;
    it('Connect and disconnect', function (done) {


      var client1 = io.connect(socketURL, options);

      client1.on('init:request', function () {
        receive++;
        client1.emit('init:send', {
          name: null,
          sid: helpers.generateUUID()
        });
      });

      client1.on('init', function () {
        receive++;
        client1.disconnect();
        receive.should.equal(2);
        done()

      })
    });
    describe("presence", function () {
      var receive1 = 0;
      var receive2 = 0;
      it('Connect 2 players and player can see the other', function (done) {


        var client1 = io.connect(socketURL, options);
        var client2;


        client1.on('init:request', function () {
          receive1++;
          client1.emit('init:send', {
            name: null,
            sid: helpers.generateUUID()
          });
        });

        client1.on('init', function (data) {
          receive1++;

          receive.should.equal(2);
          // expected: { name: 'Guest3', users: [], games: [], version: 16 }
          data.name.should.be.eql('Guest2');
          data.users.should.be.eql([]);
          data.games.should.be.eql([]);

        });
        client1.on('user:join', function (data) {
          receive1++;
          console.log('new user is coming: ' + JSON.stringify(data));
          data.name.should.be.eql('Guest3');
          receive1.should.be.eql(3);
          receive2.should.be.eql(2);
          client1.disconnect();
          client2.disconnect()
          done();
        });
        // start client2 with delay
        setTimeout(function () {
          client2 = io.connect(socketURL, options);
          /*
           Client 2
           */
          client2.on('init:request', function () {
            console.log('receive init:request to client2');
            receive2++;
            client2.emit('init:send', {
              name: null,
              sid: helpers.generateUUID()
            });
          });

          client2.on('init', function (data) {
            console.log('receive init data to client2');
            receive2++;
            data.name.should.equal('Guest3');
            data.users.should.be.eql(['Guest2']);
            data.games.should.be.eql([]);

            receive.should.equal(2);

          })
        }, 200);

      });
    });
  });

});


describe('Game Server', function () {

  describe("invite", function () {
    this.timeout(5000);
    var receive1 = 0;
    var receive2 = 0;
    var player1Name = 'Guest10';
    var player2Name = 'Guest11';
    it('Connect 2 players and player can see the other', function (done) {


      var client1 = io.connect(socketURL, options);
      var client2 = null;
      var player1Move = [6, 6, 6, 6, 6];
      var player2Move = [2, 3, 4, 5, 6];
      var player1GameUpdateCount = 0;
      var player2GameUpdateCount = 0;

      client1.on('init:request', function () {
        receive1++;
        client1.emit('init:send', {
          name: player1Name,
          sid: helpers.generateUUID()
        });
      });

      client1.on('init', function (data) {
        receive1++;

        receive1.should.equal(2);
        // expected: { name: 'Guest3', users: [], games: [], version: 16 }
        data.name.should.be.eql(player1Name);
        data.users.should.be.eql([]);
        data.games.should.be.eql([]);

      });
      client1.on('user:join', function (data) {
        receive1++;
        console.log('new user is coming: ' + JSON.stringify(data));
        data.name.should.be.eql('Guest11');
        receive1.should.be.eql(3);
        receive2.should.be.eql(2);
        console.log('send invite to player2');
        setTimeout(function () {
          client1.emit('game:invite', {to: player2Name});
        }, 100);


      });

      client1.on('game:update', function (data) {
        receive1++;

        console.log('%s receive game:data %s', player1Name, JSON.stringify(data))
        // expected {"dataGame":{"Guest10":0,"Guest11":0,"nextPlayer":"Guest10","winner":false}}
        if (player2GameUpdateCount === 0) {
          [2, 3, 4].should.containEql(receive2);
          data.dataGame[player2Name].should.be.eql(0);
          data.dataGame.winner.should.be.false();
        }
        if (data.dataGame.winner === player1Name) {
          console.log('%s Win', player1Name);
          console.log('gameData: ' + JSON.stringify(data.dataGame));
          done();
        }

        if (data.dataGame.nextPlayer === player1Name) {
          var cell = player1Move.pop();
          console.log('%s play cell %s', player1Name, cell);

          setTimeout(function () {
            player1GameUpdateCount++;
            client1.emit('game:play', {
              to: player2Name,
              column: cell
            });
          }, 100);

        }
      });

      // start client2 with delay
      setTimeout(function () {
        client2 = io.connect(socketURL, options);

        /*
         Client 2
         */
        client2.on('init:request', function () {
          console.log('receive init:request to client2');
          receive2++;
          client2.emit('init:send', {
            name: player2Name,
            sid: helpers.generateUUID()
          });
        });

        client2.on('init', function (data) {
          console.log('receive init data to client2');
          receive2++;
          data.name.should.equal(player2Name);
          data.users.should.be.eql([player1Name]);
          data.games.should.be.eql([]);

          receive2.should.equal(2);

        });

        client2.on('game:update', function (data) {
          receive2++;

          console.log('%s receive game:data %s', player2Name, JSON.stringify(data));
          // expected {"dataGame":{"Guest10":0,"Guest11":0,"nextPlayer":"Guest10","winner":false}}
          if (player2GameUpdateCount === 0 && player1GameUpdateCount === 0) {
            [3, 4].should.containEql(receive2);
            data.dataGame[player2Name].should.be.eql(0);
            data.dataGame.winner.should.be.false();
          }

          if (data.dataGame.winner === player2Name) {
            console.log('%s Win', player2Name);
            console.log('gameData: ' + JSON.stringify(data.dataGame));
            done();
          }
          if (data.dataGame.nextPlayer === player2Name) {

            var cell = player2Move.pop();
            console.log('%s play cell %s', player2Name, cell);
            setTimeout(function () {
              player2GameUpdateCount++;
              client2.emit('game:play', {
                to: player1Name,
                column: cell
              });
            }, 100)

          }


        });
      }, 1000);

    });
  });

});