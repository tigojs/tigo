const processError = require('../constants/processError');
const { shutdownLogger } = require('./logger');

function exit(arg) {
  // kill process
  if (typeof arg === 'string') {
    process.exit(processError[arg] || -1);
  } else if (typeof arg === 'number') {
    process.exit(arg);
  } else {
    process.exit(-1);
  }
}

function killProcess(arg) {
  // shutdown logger
  if (this && this.logger) {
    shutdownLogger(exit);
  } else {
    exit(arg);
  }
}

module.exports = {
  killProcess,
};
