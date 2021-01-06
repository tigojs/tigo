const BaseController = require('../base/controller');
const { successResponse } = require('../utils/response');
const { getPluginList } = require('../utils/plugins');

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
    const plugins = getPluginList(ctx.app.tigo.config.plugins);
    ctx.body = successResponse(plugins);
  }
}

module.exports = PluginInfoController;
