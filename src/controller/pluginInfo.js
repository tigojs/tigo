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
    ctx.set('Cache-Control', 'max-age=3600');
    const plugins = getPublicPluginList(ctx.app);
    ctx.body = successResponse({
      packages: plugins,
    });
  }
}

module.exports = PluginInfoController;
