const log4js = require('log4js');

log4js.configure({
  appenders: {
    stdout: {
      type: 'stdout',
    },
  },
  categories: {
    default: { appenders: ['stdout'], level: 'debug' },
  },
});

const logger = log4js.getLogger();

module.exports = logger;