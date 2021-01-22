const { BaseController } = require('@tigo/core');
const { successResponse } = require('@tigo/utils');
const { allowedType } = require('../constants/type');
const mime = require('mime');

class ConfigurationController extends BaseController {
  getRoutes() {
    return {
      '/config/{scopeId:string}/{name:string}.{type:string}': {
        type: 'get',
        target: this.handleRequest,
        external: true,
      },
      '/config-storage/list': {
        type: 'get',
        auth: true,
        target: this.handleList,
      },
      '/config-storage/getContent': {
        type: 'get',
        auth: true,
        target: this.handleGetContent,
      },
    }
  }
  async handleList(ctx) {
    const list = await ctx.model.configStorage.findAll({
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
    const { id } = ctx.query;
    const content = await ctx.service.configStorage.getContent(ctx, id);
    ctx.body = successResponse(content);
  }
  async handleRequest(ctx) {
    const { scopeId, name, type } = ctx.params;
    const formattedType = type.toLowerCase();
    if (!formattedType || !allowedType.includes(formattedType)) {
      ctx.throw(400, '类型错误');
    }
    const content = await ctx.service.configStorage.getContentViaPublic(scopeId, formattedType, name);
    if (!content) {
      ctx.throw(404, '找不到对应的脚本');
    }
    ctx.set('Content-Type', mime.getType(formattedType));
    ctx.body = content;
  }
}

module.exports = ConfigurationController;
