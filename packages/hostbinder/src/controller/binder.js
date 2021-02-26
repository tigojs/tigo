const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');

const domainValidator = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
let targetCheck;

class BinderController extends BaseController {
  constructor(app) {
    super(app);
    targetCheck = app.tigo.hostbinder.unlocked ? /^\/.*/ : new RegExp(`^\/(lambda)|(config)|(oss)\/${ctx.state.user.scopeId}.*$`);
  }
  getRoutes() {
    return {
      '/hostbinder/checkUnlocked': {
        type: 'get',
        auth: true,
        target: this.handleCheckUnlocked,
      },
      '/hostbinder/list': {
        type: 'get',
        auth: true,
        target: this.handleList,
      },
      '/hostbinder/add': {
        type: 'post',
        auth: true,
        target: this.handleAdd,
      },
      '/hostbinder/delete': {
        type: 'post',
        auth: true,
        target: this.handleDelete,
      },
    };
  }
  async handleCheckUnlocked(ctx) {
    ctx.body = successResponse({
      unlocked: ctx.tigo.hostbinder.unlocked,
    });
  }
  async handleList(ctx) {
    const list = await ctx.model.hostbinder.binding.findAll(({
      where: {
        uid: ctx.state.user.id,
      },
    }));
    ctx.body = successResponse(list);
  }
  async handleAdd(ctx) {
    ctx.verifyParams({
      domain: {
        type: 'string',
        required: true,
        format: domainValidator,
      },
      target: {
        type: 'string',
        required: true,
        format: targetCheck,
      },
    });
    const { domain, target } = ctx.request.body;
    if (await ctx.model.hostbinder.binding.domainExists(domain)) {
      ctx.throw(400, '域名已存在');
    }
    const targetPath = `http://127.0.0.1:${ctx.tigo.config.server.port}${target}`;
    ctx.tigo.hostbinder.proxy.register(domain, targetPath);
    await ctx.model.hostbinder.binding.create({
      uid: ctx.state.user.id,
      domain,
      target,
    });
    ctx.body = successResponse(null, '添加成功');
  }
  async handleDelete(ctx) {
    ctx.verifyParams({
      id: {
        type: 'number',
        required: true,
        min: 1
      },
    });
    const { id } = ctx.request.body;
    const item = await ctx.model.hostbinder.binding.findByPk(id);
    if (!item) {
      ctx.throw(400, '找不到对应的ID');
    }
    if (item.uid !== ctx.state.user.id) {
      ctx.throw(401, '无权访问');
    }
    const targetPath = `http://127.0.0.1:${ctx.tigo.config.server.port}${item.target}`;
    ctx.tigo.hostbinder.proxy.unregister(item.domain, targetPath);
    await ctx.model.hostbinder.binding.destroy({
      where: {
        id,
      },
    });
    ctx.body = successResponse(null, '删除成功');
  }
};

module.exports = BinderController;
