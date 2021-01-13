const errorCode = {
  'badRequest': 400000,
  'authorizationFailed': 400001,
  'paramValidationFailed': 400002,
  'forbiddenAccess': 400003,
  'notFound': 400004,
  'unknownError': 500000,
};

const errorMessage = {
  400000: '请求参数错误',
  400001: '无权访问',
  400002: '参数校验错误',
  400003: '禁止访问',
  400004: '找不到相关内容',
  500000: '发生了未知错误',
};

module.exports = {
  errorCode,
  errorMessage,
};
