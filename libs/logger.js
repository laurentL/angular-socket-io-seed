let winston = require('winston');

const singleLogger = (function () {
  let instance;

  function createInstance() {
    return new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({
          'timestamp': true,
          colorize: true,
          level: 'info',
          json: false,


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
    let str = this.toString();
    if (arguments.length) {
      const t = typeof arguments[0];
      let key;
      const args = ("string" === t || "number" === t) ?
        Array.prototype.slice.call(arguments) : arguments[0];

      for (key in args) {
        str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
      }
    }

    return str;
  };

module.exports = logger = singleLogger.getInstance();