const buildLog = (type, ...contents) => {
  if (!contents.length) {
    // no content, regard as invalid log
    return null;
  }
  return {
    time: new Date().valueOf(),
    type,
    message: contents[0],
    customVars: contents.slice(1),
  };
};

module.exports = {
  buildLog
};
