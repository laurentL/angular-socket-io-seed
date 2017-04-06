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

String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
  function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
      var t = typeof arguments[0];
      var key;
      var args = ("string" === t || "number" === t) ?
        Array.prototype.slice.call(arguments)
        : arguments[0];

      for (key in args) {
        str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
      }
    }

    return str;
  };


module.exports = logger = singleLogger.getInstance();