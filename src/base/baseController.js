const path = require('path');

class BaseController {
  constructor() {
    this.name = path.basename(__filename, path.extname(__filename));
  }
  successResponse(data, message = 'success', code = 0) {
    return {
      code,
      message,
      data,
    };
  }
  errorResponse(message = '未知错误', code = 500000) {
    return {
      code,
      message,
    };
  }
}

module.exports = BaseController;
