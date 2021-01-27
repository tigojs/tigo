const { BaseController } = require('@tigo/core');

class CommonController extends BaseController {
  getRoutes() {
    return {
      '/faas/getConfig': {
        type: 'get',
        auth: true,
        target: this.handleGetConfig,
      },
    };
  }
  async handleGetConfig(ctx) {
    ctx.body = successResponse({
      resourcePack: !!ctx.faas.resourcePackEnabled,
      hostBinder: !!ctx.faas.hostBinderEnabled,
    });
  }
}

module.exports = CommonController;
