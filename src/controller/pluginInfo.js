const { BaseController } = require('@tigo/core');
const {
  successResponse,
  getPluginList,
  getPluginConfig,
} = require('@tigo/utils');

class PluginInfoController extends BaseController {
  getRoutes() {
    const { framework: frameworkConfig } = this.app.config;
    return {
      '/common/pluginInfo': {
        type: 'get',
        auth: (frameworkConfig && frameworkConfig.protectPluginInfo) || !!this.app.tigo.auth,
        target: this.getPluginInfo,
      }
    };
  }
  async getPluginInfo(ctx) {
    const plugins = getPluginList(getPluginConfig(ctx.app));
    ctx.body = successResponse({
      packages: plugins,
    });
  }
}

module.exports = PluginInfoController;
