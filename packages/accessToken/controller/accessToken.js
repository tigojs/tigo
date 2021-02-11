const { BaseController } = require("@tigo/core");
const { successResponse } = require('@tigo/utils');
const { BaseController } = require('@tigo/core');

class AccessToken extends BaseController {
  getRoutes() {
    return {
      '/auth/accessToken/add': {
        type: 'post',
        auth: true,
        target: this.handleAdd,
      },
      '/auth/accessToken/delete': {
        type: 'post',
        auth: true,
        target: this.handleDelete,
      },
      '/auth/accessToken/list': {
        type: 'get',
        auth: true,
        target: this.handleList,
      },
    };
  }
  async handleAdd(ctx) {
    await ctx.service.auth.accessToken.add(ctx);
    ctx.body = successResponse(null, '添加成功');
  }
  async handleDelete(ctx) {
    ctx.verifyParams({
      id: {
        type: 'number',
        required: true,
        min: 1,
      },
    });
    await ctx.service.auth.accessToken.delete(ctx);
    ctx.body = successResponse(null, '删除成功');
  }
  async handleList(ctx) {
    const list = await ctx.model.auth.accessToken.findAll({
      where: {
        uid: ctx.state.user.id,
      },
    });
    ctx.body = successResponse(list);
  }
}

module.exports = AccessToken;