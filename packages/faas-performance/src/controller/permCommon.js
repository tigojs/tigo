const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');

class PermCommonController extends BaseController {
  getRoutes() {
    return {
      '/faas/perm/getOptions': {
        type: 'get',
        auth: true,
        target: this.handleGetOptions,
      },
    };
  }
  async getOptions(ctx) {
    ctx.body = successResponse({
      maxKeepDays: ctx.tigo.faas.perm.maxKeepDays || null,
    });
  }
}

module.exports = PermCommonController;
