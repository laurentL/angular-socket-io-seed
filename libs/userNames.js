/**
 * Created by llabatut on 4/2/17.
 */
const logger = require('../libs/logger');

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
        var client_redis = parameters.redis;

        var name,
          redisKeyIncrGuestCount = 'guestId';
        if ([null, undefined, 'undefined', 'null'].indexOf(parameters.data.name) !== -1) {
          logger.info('Renaming a userName not allow %s', parameters.data.name);
          client_redis.incr(redisKeyIncrGuestCount, function (err, value) {
              if (err) {
                reject(err);
              } else {
                logger.info('after send redis incr');
                name = 'Guest' + value;
                if (!claim(name)) {
                  getGuestName(parameters)
                } else {
                  logger.info('generated name %s', name);
                  parameters.data.name = name;
                  parameters.user.name = name;
                  resolve(parameters);
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
      for (var user in names) {
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

module.exports = userNames;