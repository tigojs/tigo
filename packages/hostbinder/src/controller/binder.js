const { BaseController } = require('@tigojs/core');

const domainValidator = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;

class BinderController extends BaseController {
  getRoute() {
    return {
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
  async handleList(ctx) {
    const list = await ctx.model.hostbinder.binding.findAll(({
      where: {
        uid: ctx.state.user.id,
      },
    }));
    ctx.body = successResponse(list.map((item) => ({
      ...item,
      target: item.target.replace(`http://127.0.0.1:${ctx.tigo.config.server.port}`, ''),
    })));
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
        format: new RegExp(`^\/(lambda)|(config)\/${ctx.state.user.scopeId}.*$`),
      },
    });
    const { domain, target } = ctx.request.body;
    if (await ctx.model.hostbinder.binding.domainExists(domain)) {
      ctx.throw(400, '域名已存在');
    }
    const targetPath = `http://127.0.0.1:${ctx.tigo.config.server.port}${target}`;
    ctx.hostbinder.proxy.register(domain, targetPath);
    await ctx.model.hostbinder.binding.create({
      uid: ctx.state.user.id,
      domain,
      target: targetPath,
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
    const item = ctx.model.hostbinder.binding.findByPk(id);
    if (!item) {
      ctx.throw(400, '找不到对应的ID');
    }
    if (item.uid !== ctx.state.user.id) {
      ctx.throw(401, '无权访问');
    }
    ctx.hostbinder.proxy.unregister(item.domain, item.target);
    await ctx.model.hostbinder.binding.destroy({
      where: {
        id,
      },
    });
    ctx.body = successResponse(null, '删除成功');
  }
};

module.exports = BinderController;
