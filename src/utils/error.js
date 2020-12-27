const { errorMessage, errorCode } = require('../constants/httpError');

function createHttpError(arg) {
  if (typeof arg === 'number') {
    return {
      code: arg,
      message: errorMessage[arg],
    };
  }
  const code = errorCode[arg];
  return {
    code,
    message: errorMessage[code],
  };
}

module.exports = {
  createHttpError
};
