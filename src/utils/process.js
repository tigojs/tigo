const processError = {
  middlewareCollectError: 100,
  pluginCollectError: 101,
  singlePageCollectError: 102,
  pluginMountError: 103,
};

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
