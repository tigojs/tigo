const processError = require('../constants/httpError');

function killProcess(arg) {
  // shutdown logger
  if (this && this.logger) {
    this.logger.shutdown();
  }
  // kill process
  if (typeof arg === 'string') {
    process.exit(processError[arg] || -1);
  } else if (typeof arg === 'number') {
    process.exit(arg);
  } else {
    process.exit(-1);
  }
}

module.exports = {
  killProcess,
};
