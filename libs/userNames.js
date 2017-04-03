/**
 * Created by llabatut on 4/2/17.
 */

var userNames = (function () {

    var names = {};


    var claim = function (name) {
      if (!name || names[name]) {
        return false;
      } else {
        names[name] = true;
        return true;
      }
    };

    // find the lowest unused "guest" name and claim it
    var getGuestName = function (parameters) {
      return new Promise(function (resolve, reject) {

        var socket = parameters.socket;
        var data = parameters.data;
        var client_redis = parameters.redis;

        var name,
          redisKeyIncrGuestCount = 'guestId';
        if ([null, undefined, 'undefined', 'null'].indexOf(parameters.data.name) !== -1) {
          logger.info('Name not allow %s', parameters.data.name);
          client_redis.incr(redisKeyIncrGuestCount, function (err, value) {
            if (err) {
              logger.error('errafter send redis incr %s ', err);

            } else {
              logger.info('after send redis incr');
              name = 'Guest' + value;
              if (!claim(name)) {
                getGuestName(parameters)
              } else {
                logger.info('generated name %s', name);
                parameters.data.name = name;
                parameters.user.name = name;
                resolve(parameters)
              }
            }
          }

        )
        } else {
          parameters.user.name = parameters.data.name;
          resolve(parameters)
        }
      })
    };


    // serialize claimed names as an array
    var get = function () {
      var res = [];
      for (user in names) {
        res.push(user);
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
  })
  ()
;

module.exports = userNames