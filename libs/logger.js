var winston = require('winston');

var singleLogger = (function () {
  var instance;

  function createInstance() {
    return new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({
          'timestamp': true,
          colorize: true,
          level: 'info'

        })
      ]
    });
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();



module.exports = logger = singleLogger.getInstance();