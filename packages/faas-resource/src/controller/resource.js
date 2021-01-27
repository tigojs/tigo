const { BaseController } = require('@tigo/core');

class ResourceController extends BaseController {
  getRoutes() {
    return {
      '/lambda/uploadResourcePack': {
        type: 'post',
        target: this.handleUpload,
        external: true,
      },
    };
  }
  async handleUpload(ctx) {

  }
}

module.exports = ResourceController;
