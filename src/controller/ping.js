const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');

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
    ctx.set('Cache-Control', 'no-store');
    ctx.set('Content-Type', 'text/plain');
    ctx.body = 1;
  }
}

module.exports = PingController;
