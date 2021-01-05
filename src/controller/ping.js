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
    ctx.body = successResponse({
      auth: !!ctx.app.tigo.auth,
    });
  }
}

module.exports = PingController;
