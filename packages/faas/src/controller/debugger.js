const { BaseController } = require('@tigo/core');

class DebuggerController extends BaseController {
  getRoutes() {
    return {
      '/faas/debug': {
        type: ['get', 'post'],
        auth: true,
        target: this.handleDebug,
      }
    };
  }
  async handleDebug(ctx) {
    
  }
}

module.exports = DebuggerController;
