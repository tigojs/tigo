const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');
const { allowedType } = require('../constants/type');
const mime = require('mime');

class ConfigurationController extends BaseController {
  getRoutes() {
    return {
      '/config/:scopeId/:filename': {
        type: 'get',
        target: this.handleRequest,
        external: true,
      },
      '/cfs/list': {
        type: 'get',
        auth: true,
        target: this.handleList,
      },
      '/cfs/getContent': {
        type: 'get',
        auth: true,
        target: this.handleGetContent,
      },
      '/cfs/save': {
        type: 'post',
        auth: true,
        target: this.handleSave,
      },
      '/cfs/rename': {
        type: 'post',
        auth: true,
        target: this.handleRename,
      },
      '/cfs/delete': {
        type: 'post',
        auth: true,
        target: this.handleDelete,
      },
    }
  }
  async handleList(ctx) {
    const list = await ctx.model.cfs.conf.findAll({
      where: {
        uid: ctx.state.user.id,
      },
    });
    ctx.set('Cache-Control', 'no-store');
    ctx.body = successResponse(list);
  }
  async handleGetContent(ctx) {
    if (ctx.query.id) {
      ctx.query.id = parseInt(ctx.query.id, 10);
    }
    ctx.verifyParams({
      id: {
        type: 'number',
        required: true,
        min: 1,
      },
    });
    const { id } = ctx.query;
    const content = await ctx.service.cfs.conf.getContent(ctx, id);
    ctx.set('Cache-Control', 'no-store');
    ctx.body = successResponse({
      content,
    });
  }
  async handleRequest(ctx) {
    const { scopeId, filename } = ctx.params;
    if (!/.+\..+/.test(filename)) {
      ctx.throw(400, '文件名不正确');
    }
    const type = path.extname(filename);
    const name = path.basename(filename, ext);
    const formattedType = type.toLowerCase();
    if (!formattedType || !allowedType.includes(formattedType)) {
      ctx.throw(400, '类型错误');
    }
    const content = await ctx.service.cfs.conf.getContentViaPublic(ctx, scopeId, formattedType, name);
    if (!content) {
      ctx.throw(404, '找不到对应的脚本');
    }
    const cacheAge = ctx.query?.cacheAge;
    if (
      typeof cacheAge !== 'undefined'
      && cacheAge !== null
      && !/\d+/.test(cacheAge)
    ) {
      ctx.throw(400, '缓存参数不合法');
    }
    ctx.set('Cache-Control', `max-age=${cacheAge || 3600}`);
    ctx.set('Content-Type', mime.getType(formattedType));
    ctx.body = content;
  }
  async handleSave(ctx) {
    ctx.verifyParams({
      action: {
        type: 'enum',
        values: ['add', 'edit'],
        required: true,
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
      type: {
        type: 'enum',
        values: ['json', 'xml', 'yaml'],
        required: true,
      },
      content: {
        type: 'string',
        required: true,
      },
    });
    const { action } = ctx.request.body;
    if (action === 'add') {
      const id = await ctx.service.cfs.conf.add(ctx);
      ctx.body = successResponse({
        id,
      }, '保存成功');
    } else if (action === 'edit') {
      await ctx.service.cfs.conf.edit(ctx);
      ctx.body = successResponse(null, '保存成功');
    }
    ctx.set('Cache-Control', 'no-store');
  }
  async handleRename(ctx) {
    ctx.verifyParams({
      id: {
        type: 'number',
        required: true,
        min: 1,
      },
      newName: {
        type: 'string',
        required: true,
      },
    });
    await ctx.service.cfs.conf.rename(ctx);
    ctx.set('Cache-Control', 'no-store');
    ctx.body = successResponse(null, '修改成功');
  }
  async handleDelete(ctx) {
    ctx.verifyParams({
      id: {
        type: 'number',
        required: true,
        min: 1,
      }
    });
    const { id } = ctx.request.body;
    await ctx.service.cfs.conf.delete(ctx, id);
    ctx.set('Cache-Control', 'no-store');
    ctx.body = successResponse(null, '删除成功');
  }
}

module.exports = ConfigurationController;
