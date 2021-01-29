const { BaseController } = require('@tigo/core');
const { successResponse } = require('@tigo/utils');

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
    ctx.throw(500, error);
    ctx.body = successResponse({
      auth: !!ctx.app.tigo.auth,
    });
  }
}

module.exports = PingController;
