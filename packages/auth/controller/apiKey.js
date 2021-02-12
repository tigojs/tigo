const { BaseController } = require('@tigo/core');
const { successResponse } = require('@tigo/utils');

class ApiKeysController extends BaseController {
  getRoutes() {
    return {
      '/user/keys/add': {
        type: 'post',
        auth: true,
        target: this.handleAdd,
      },
      '/user/keys/delete': {
        type: 'post',
        auth: true,
        target: this.handleDelete,
      },
      '/user/keys/list': {
        type: 'get',
        auth: true,
        target: this.handleList,
      },
    };
  }
  async handleAdd(ctx) {
    const apiKey = await ctx.service.auth.apiKey.add(ctx);
    ctx.body = successResponse(apiKey, '添加成功');
  }
  async handleDelete(ctx) {
    ctx.verifyParams({
      id: {
        type: 'number',
        required: true,
        min: 1,
      },
    });
    await ctx.service.auth.apiKey.delete(ctx);
    ctx.body = successResponse(null, '删除成功');
  }
  async handleList(ctx) {
    const list = await ctx.model.auth.apiKey.findAll({
      where: {
        uid: ctx.state.user.id,
      },
    });
    ctx.body = successResponse(list);
  }
}

module.exports = ApiKeysController;
