/**
 * Created by llabatut on 4/6/17.
 */


var winston = require('winston');

function myPrettyPrint(obj) {
  return JSON.stringify(obj)
    .replace(/\{/g, '< wow ')
    .replace(/\:/g, ' such ')
    .replace(/\}/g, ' >');
}

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ prettyPrint: myPrettyPrint, humanReadableUnhandledException:true }),

  ]
});

throw new Error('Hello, winston!');

logger.info('Hello, this is a logging event with a custom pretty print',  { 'foo': 'bar' });
logger.info('Hello, this is a logging event with a custom pretty print2', { 'foo': 'bar' });
