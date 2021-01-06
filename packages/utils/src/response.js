function successResponse(data, message = 'success', code = 0) {
  return {
    success: true,
    code,
    message,
    data,
  };
}

function errorResponse(message = '未知错误', code = 500000) {
  return {
    success: false,
    code,
    message,
  };
}

module.exports = {
  successResponse,
  errorResponse,
};
