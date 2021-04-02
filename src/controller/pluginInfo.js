const { BaseController } = require('@tigojs/core');
const {
  successResponse,
  getPublicPluginList,
} = require('@tigojs/utils');

class PluginInfoController extends BaseController {
  getRoutes() {
    return {
      '/common/listPlugins': {
        type: 'get',
        auth: !!this.app.tigo.auth,
        target: this.getPluginInfo,
      }
    };
  }
  async getPluginInfo(ctx) {
    const plugins = getPublicPluginList(ctx.app);
    ctx.body = successResponse({
      packages: plugins,
    });
  }
}

module.exports = PluginInfoController;
