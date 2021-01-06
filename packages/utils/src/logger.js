const log4js = require('log4js');
const path = require('path');

function createLogger(config) {
  if (!config) {
    config = {};
  };

  const { path: logPath } = config;

  log4js.configure({
    appenders: {
      stdout: {
        type: 'stdout',
      },
      all: {
        type: 'dateFile',
        filename: path.resolve(logPath, 'all.log'),
        compress: true,
        alwaysIncludePattern: true,
        daysToKeep: config.daysToKeep || 0,
        keepFileExt: true,
      },
      errorOnly: {
        type: 'dateFile',
        filename: path.resolve(logPath, 'error.log'),
        compress: true,
        alwaysIncludePattern: true,
        daysToKeep: config.daysToKeep || 0,
        keepFileExt: true,
      },
      errorFilter: {
        type: 'logLevelFilter',
        appender: 'errorOnly',
        level: 'error',
      },
    },
    categories: {
      default: { appenders: ['all', 'errorOnly'], level: 'info' },
      dev: { appenders: ['stdout', 'all', 'errorOnly'], level: 'debug' },
    },
    pm2: config.pm2 || false,
  });

  if (process.env.NODE_ENV === 'dev') {
    // inject console
    return log4js.getLogger('dev');
  }
  return log4js.getLogger();
}

function shutdownLogger(cb) {
  log4js.shutdown((err) => {
    if (err) {
      console.error('Cannot close logger, some logs will lost.');
      console.error(err);
    }
    if (typeof cb === 'function') {
      cb();
    }
  });
}

module.exports = {
  createLogger,
  shutdownLogger,
};
