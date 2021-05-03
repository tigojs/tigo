const { BaseController } = require('@tigojs/core');

class FaaSCommonController extends BaseController {
  getRoutes() {
    return {
      '/faas/enabledFeats': {
        type: 'get',
        auth: true,
        target: this.enabledFeats,
      },
    };
  }
  async enabledFeats(ctx) {
    const { logServiceEnabled } = ctx.tigo.faas;
    ctx.body = {
      logService: !!logServiceEnabled,
    };
  }
}

module.exports = FaaSCommonController;
