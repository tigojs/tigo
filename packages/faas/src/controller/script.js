const { BaseController } = require('@tigo/core');
const { successResponse } = require('@tigo/utils');

class ScriptController extends BaseController {
  getRoutes() {
    return {
      '/lambda/{scopeId:string}/{name:string}': {
        type: 'get',
        target: this.handleExec,
        external: true,
      },
      '/faas/save': {
        type: 'post',
        auth: true,
        target: this.handleSave,
      },
      '/faas/delete': {
        type: 'post',
        auth: true,
        target: this.handleDelete,
      }
    };
  }
  async handleExec(ctx) {
    const { scopeId, name } = ctx.params;
    await ctx.service.faas.script.exec(ctx, scopeId, name);
  }
  async handleSave(ctx) {
    ctx.verifyParams({
      action: {
        type: 'enum',
        values: ['add', 'edit'],
        required: false,
      },
      id: {
        type: 'number',
        required: false,
        min: 1,
      },
      name: {
        type: 'string',
        required: true,
      },
      content: {
        type: 'string',
        required: true,
      },
    });

    if (action === 'add') {
      // add a new script
      const id = await ctx.service.script.add(ctx.request.body);
      ctx.body = successResponse({
        id,
      }, '保存成功');
    } else if (action === 'edit') {
      // edit existed script
      await ctx.service.script.edit(ctx.request.body);
      ctx.body = successResponse(null, '保存成功');
    }
  }
  async handleDelete(ctx) {
    ctx.verifyParams({
      id: {
        type: 'number',
        required: true,
        min: 1,
      }
    })
    const { id } = ctx.request.body;
    await ctx.service.faas.script.delete(ctx, id);
    ctx.body = successResponse(null, '删除成功');
  }
}

module.exports = ScriptController;
