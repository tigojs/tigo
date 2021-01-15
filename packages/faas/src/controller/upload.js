const { BaseController } = require('@tigo/core');
const { successResponse } = require('@tigo/utils');

class UploadController extends BaseController {
  getRoutes() {
    return {
      '/faas/upload': {
        type: 'post',
        auth: !!this.app.tigo.auth,
        target: this.handleUpload,
      },
    };
  }
  async handleUpload(ctx) {
    ctx.verifyParams({
      script: {
        type: 'string',
        required: true,
      },
    });
    const id = await ctx.service.faas.script.write(ctx.request.body.script);
    ctx.body = successResponse(id, '保存成功');
  }
}

module.exports = UploadController;
