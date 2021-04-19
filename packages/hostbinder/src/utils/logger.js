const log4js = require('log4js');
const path = require('path');

function createProxyLogger() {
  let { logger: loggerConfig } = this.config;
  if (!loggerConfig) {
    loggerConfig = {};
  }

  let logPath;
  if (loggerConfig && loggerConfig.path) {
    logPath = config.path;
  } else {
    logPath = path.resolve(this.config.runDirPath, './hostbinder/logs');
  }

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
        daysToKeep: loggerConfig.daysToKeep || 0,
        keepFileExt: true,
      },
      errorOnly: {
        type: 'dateFile',
        filename: path.resolve(logPath, 'error.log'),
        compress: true,
        alwaysIncludePattern: true,
        daysToKeep: loggerConfig.daysToKeep || 0,
        keepFileExt: true,
      },
      errorFilter: {
        type: 'logLevelFilter',
        appender: 'errorOnly',
        level: 'error',
      },
    },
    categories: {
      default: { appenders: ['stdout'], level: 'info' },
      proxy: { appenders: ['stdout', 'all', 'errorOnly'], level: 'error' },
      'proxy-dev': { appenders: ['stdout', 'all', 'errorOnly'], level: 'debug' },
    },
    pm2: loggerConfig.pm2 || false,
  });

  return process.env.NODE_ENV === 'dev' ? log4js.getLogger('proxy-dev') : log4js.getLogger('proxy');
}

module.exports = createProxyLogger;
