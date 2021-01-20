const { BaseController } = require('@tigo/core');

class ConfigurationController extends BaseController {
  getRoutes() {
    return {
      '/config/{scopeId:string}/{name:string}': {
        type: 'get',
        target: this.handleRequest,
        external: true,
      },
      '/config-storage/list': {
        type: 'get',
        target: this.handleList,
      },
      '/config-storage/getContent': {
        type: 'get',
        target: this.handleGetContent,
      },
    }
  }
  async handleList(ctx) {

  }
  async handleGetContent(ctx) {
    
  }
  async handleRequest(ctx) {
    
  }
}

module.exports = ConfigurationController;
