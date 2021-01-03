const BaseController = require('../base/baseController');

class PingController extends BaseController {
  getRoutes() {
    return {
      '/common/ping': {
        type: 'get',
        target: this.ping,
      }
    };
  }
  async ping(ctx) {
    ctx.body = this.successResponse();
  }
}

module.exports = PingController;
