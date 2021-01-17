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
      id: {
        type: 'number',
        required: false,
      },
      script: {
        type: 'string',
        required: true,
      },
      scriptId: {
        type: 'string',
        required: false,
      },
      name: {
        type: 'string',
        required: false,
      },
    });

    const { id, name, script, scriptId: prevScriptId } = ctx.request.body;
    const decoded = Buffer.from(script, 'base64').toString('utf-8');
    const scriptId = await ctx.service.faas.script.write(ctx, decoded, prevScriptId);

    await ctx.model.faas.script.upsert({
      id,
      uid: ctx.state.user.id,
      scopeId: ctx.state.user.scopeId,
      name: name || scriptId,
      scriptId,
    });

    ctx.body = successResponse({
      id,
      scriptId,
    }, '保存成功');
  }
}

module.exports = UploadController;
