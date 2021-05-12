const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');

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
    ctx.body = successResponse(ctx.tigo.faas.enabledFeats || {});
  }
}

module.exports = FaaSCommonController;
