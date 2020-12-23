const processError = {
  middlewareCollectError: 100,
  pluginCollectError: 101,
  singlePageCollectError: 102,
};

function killProcess(arg) {
  if (typeof arg === 'string') {
    process.exit(processError[arg]);
  } else if (typeof arg === 'number') {
    process.exit(arg);
  } else {
    process.exit(-1);
  }
}

module.exports = {
  killProcess,
};
