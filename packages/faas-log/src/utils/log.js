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

/**
 * @param {string} scopeId
 * @param {string} lambdaName
 * @returns An identification for lambda log collection
 */
const getLambdaId = (scopeId, lambdaName) => {
  return `${scopeId}_${lambdaName}`;
};

module.exports = {
  buildLog,
  getLambdaId
};
