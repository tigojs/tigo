const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');

class LogCommonController extends BaseController {
  getRoutes() {
    return {
      '/faas/log/getOptions': {
        type: 'get',
        auth: true,
        target: this.handleGetOptions,
      },
    };
  }
  async handleGetOptions(ctx) {
    ctx.body = successResponse({
      maxKeepDays: ctx.tigo.faas.perm.maxKeepDays || null,
    });
  }
}

module.exports = LogCommonController;
