const { BaseController } = require('@tigo/core');
const { successResponse } = require('@tigo/utils');

class PingController extends BaseController {
  getRoutes() {
    return {
      '/common/checkAvailable': {
        type: 'get',
        target: this.checkAvailable,
      },
      '/common/heartbeat': {
        type: 'get',
        target: this.heartbeat,
      }
    };
  }
  async checkAvailable(ctx) {
    ctx.body = successResponse({
      auth: !!ctx.app.tigo.auth,
    });
  }
  async heartbeat(ctx) {
    ctx.set('Content-Type', 'text/plain');
    ctx.body = 1;
  }
}

module.exports = PingController;
