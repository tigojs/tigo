const { BaseController } = require('@tigo/core');

class RequestController extends BaseController {
  getRoutes() {
    return {
      '/faas/script/{scriptId:string}': {
        type: 'get',
        target: this.handleRequest,
      },
      '/faas/scope/{scopeId:string}/{name:string}': {
        type: 'get',
        target: this.handleScopeRequest,
      },
    };
  }
  async handleRequest(ctx) {
    const { scriptId } = ctx.params;
    await ctx.service.faas.exec(ctx, scriptId);
  }
  async handleScopeRequest(ctx) {
    const { scopeId, name } = ctx.params;
    const stored = ctx.model.script.findOne({
      where: {
        scopeId,
        name,
      },
    });
    if (!stored) {
      ctx.throw(400, '无法找到对应的脚本');
    }
    await ctx.service.faas.exec(ctx, stored.scriptId);
  }
}

module.exports = RequestController;
