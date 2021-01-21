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
      // internal apis
      '/faas/getConfig': {
        type: 'get',
        auth: true,
        target: this.handleGetConfig,
      },
      '/faas/list': {
        type: 'get',
        auth: true,
        target: this.handleList,
      },
      '/faas/getContent': {
        type: 'get',
        auth: true,
        target: this.handleGetContent,
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
  async handleGetConfig(ctx) {
    ctx.body = successResponse({
      resourcePack: !!ctx.faas.resourcePackEnabled,
      hostBinder: !!ctx.faas.hostBinderEnabled,
    });
  }
  async handleList(ctx) {
    const list = ctx.model.script.findAll({
      where: {
        uid: ctx.state.user.id,
      },
    });
    ctx.body = successResponse(list);
  }
  async handleGetContent(ctx) {
    ctx.verifyParams({
      id: {
        type: 'number',
        min: 1,
      },
    });
    ctx.body = successResponse({
      content: Buffer.from(await ctx.service.faas.script.getContent(ctx), 'utf-8').toString('base64'),
    });
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
      remark: {
        type: 'string',
        required: false,
      }
    });

    if (action === 'add') {
      // add a new script
      const id = await ctx.service.script.add(ctx);
      ctx.body = successResponse({
        id,
      }, '保存成功');
    } else if (action === 'edit') {
      // edit existed script
      await ctx.service.script.edit(ctx);
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
