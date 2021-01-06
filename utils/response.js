function successResponse(data, message = 'success', code = 0) {
  return {
    code,
    message,
    data,
  };
}

function errorResponse(message = '未知错误', code = 500000) {
  return {
    code,
    message,
  };
}

module.exports = {
  successResponse,
  errorResponse,
};
