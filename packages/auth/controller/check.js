const { BaseController } = require('@tigo/core');

class CheckController extends BaseController {
  getRoutes() {
    return {
      '/common/checkStatus': {
        type: 'get',
        auth: true,
        target: this.ping,
      },
    };
  }
  async ping(ctx) {
    ctx.body = successResponse({
      uid: ctx.state.user.id,
      username: ctx.state.user.username,
    });
  }
}

module.exports = CheckController;
