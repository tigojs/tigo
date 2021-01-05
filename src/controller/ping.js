const { successResponse } = require('../utils/response');

class PingController {
  getRoutes() {
    return {
      '/common/ping': {
        type: 'get',
        target: this.ping,
      }
    };
  }
  async ping(ctx) {
    ctx.body = successResponse();
  }
}

module.exports = PingController;
