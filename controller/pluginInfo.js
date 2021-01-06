const BaseController = require('../base/controller');
const { successResponse } = require('../utils/response');
const { getPluginList, getPluginConfig } = require('../utils/plugins');

class PluginInfoController extends BaseController {
  getRoutes() {
    return {
      '/common/pluginInfo': {
        type: 'get',
        auth: !!this.app.tigo.auth,
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
