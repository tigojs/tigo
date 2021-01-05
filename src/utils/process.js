const processError = require('../constants/httpError');
const { shutdownLogger } = require('./logger');

function exit() {
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
    exit();
  }
}

module.exports = {
  killProcess,
};
