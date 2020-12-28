const errorCode = {
  'forbiddenAccess': 400000,
  'unknownError': 500000,
};

const errorMessage = {
  400000: '禁止访问',
  500000: '发生了未知错误',
};

module.exports = {
  errorCode,
  errorMessage,
};
