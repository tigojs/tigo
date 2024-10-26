const log4js = require('log4js');
const path = require('path');

function createLogger() {
  let { logger: loggerConfig } = this.config;
  if (!loggerConfig) {
    loggerConfig = {};
  }

  let logPath;
  if (loggerConfig && loggerConfig.path) {
    logPath = config.path;
  } else {
    logPath = path.resolve(this.config.runDirPath, './logs');
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
        pattern: '.yyyy-MM-dd',
        maxLogSize: loggerConfig.maxLogSize || '30M',
        numBackups: loggerConfig.numBackups || 30, // Keep logs for about a month
        keepFileExt: true,
      },
      errorFile: {
        type: 'dateFile',
        filename: path.resolve(logPath, 'error.log'),
        compress: true,
        alwaysIncludePattern: true,
        pattern: '.yyyy-MM-dd',
        maxLogSize: loggerConfig.maxLogSize || '10M',
        numBackups: loggerConfig.numBackups || 30,
        keepFileExt: true,
      },
      errorOnly: {
        type: 'logLevelFilter',
        appender: 'errorFile',
        level: 'error',
      },
    },
    categories: {
      default: { appenders: ['stdout', 'all', 'errorOnly'], level: 'info' },
      dev: { appenders: ['stdout', 'all', 'errorOnly'], level: 'debug' },
    },
    pm2: loggerConfig.pm2 || false,
  });

  let logger;

  if (process.env.NODE_ENV === 'dev') {
    // inject console
    logger = log4js.getLogger('dev');
  } else {
    logger = log4js.getLogger();
  }

  const methods = ['debug', 'info', 'warn', 'error'];
  methods.forEach((method) => {
    logger[`_original_${method}`] = logger[method];
    logger[method] = function (...args) {
      const prefix = this.prefix;
      if (prefix) {
        args.unshift(`[${prefix}]`)
      }
      this[`_original_${method}`](...args);
    }
  });

  logger.setPrefix = function (prefix) {
    this.prefix = prefix;
  }

  return logger;
}

function shutdownLogger() {
  return new Promise((resolve, reject) => {
    log4js.shutdown((err) => {
      if (err) {
        console.error('Cannot close logger, some logs will lost.');
        console.error(err);
        return reject(err);
      }
      resolve();
    });
  })
}

module.exports = {
  createLogger,
  shutdownLogger,
};
