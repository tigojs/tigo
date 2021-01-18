const { BaseController } = require('@tigo/core');

class ConfigurationController extends BaseController {
  getRoutes() {
    return {
      '/config/{scopeId:string}/{name:string}': {
        type: 'get',
        target: this.handleRequest,
        external: true,
      },
      '/config/save': {
        type: 'get',
      }
    }
  }
  async handleRequest(ctx) {

  }
}

module.exports = RequestController;
