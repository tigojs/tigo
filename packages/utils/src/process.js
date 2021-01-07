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

async function killProcess(arg) {
  // shutdown db
  if (this && this.db) {
    try {
      await this.db.close();
    } catch (err) {
      this.logger.error('Cannot close database.');
    }
  }
  // shutdown logger
  if (this && this.logger) {
    await shutdownLogger();
  }
  exit(arg);
}

module.exports = {
  killProcess,
};
