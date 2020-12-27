const errorCode = {
  'forbiddenAccess': 400000,
};

const errorMessage = {
  400000: '禁止访问',
};

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

module.exports = createHttpError;
