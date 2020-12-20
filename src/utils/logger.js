const log4js = require('log4js');
const path = require('path');
const fs = require('fs');

let logPath = path.resolve(__dirname, '/logs');

if (fs.existsSync('/var/logs') && fs.statSync('/var/logs').isDirectory()) {
  const path = '/var/logs/tigo';
  fs.mkdirSync(path);
  logPath = path;
}

function createLogger(config) {
  log4js.configure({
    appenders: {
      stdout: {
        type: 'stdout',
      },
      console: {
        type: 'console',
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
      dev: { appenders: ['stdout', 'console', 'all', 'errorOnly'], level: 'debug' },
    },
    pm2: config.pm2 || false,
  });

  if (process.env.NODE_ENV === 'dev') {
    // inject console
    return log4js.getLogger('dev');
  }
  return log4js.getLogger();
}

module.exports = createLogger;
