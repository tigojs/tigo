const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');
const { getEnvStorageKey } = require('../utils/storage');

const generalCheck = async (ctx, lambdaId) => {
  const lambda = await ctx.model.faas.script.findByPk(lambdaId);
  if (!lambda) {
    ctx.throw(400, '无法找到对应的函数');
  }
  if (lambda.scopeId !== ctx.state.user.scopeId) {
    ctx.throw(401, '无权访问');
  }
  return lambda;
};

class ScriptEnvController extends BaseController {
  getRoutes() {
    return {
      '/faas/env/get': {
        type: 'get',
        auth: true,
        target: this.handleGet,
      },
      '/faas/env/add': {
        type: 'post',
        auth: true,
        target: this.handleAdd,
      },
      '/faas/env/edit': {
        type: 'post',
        auth: true,
        target: this.handleEdit,
      },
      '/faas/env/delete': {
        type: 'post',
        auth: true,
        target: this.handleDelete,
      },
    };
  }
  async handleGet(ctx) {
    ctx.verifyParams({
      lambdaId: {
        type: 'string',
        required: true,
      },
    });
    const { lambdaId } = ctx.query;
    const lambda = await generalCheck(ctx, lambdaId);
    const envObj = await ctx.tigo.faas.storage.getObject(getEnvStorageKey(lambda.id));
    ctx.body = successResponse(envObj);
  }
  async handleAdd(ctx) {
    ctx.verifyParams({
      lambdaId: {
        type: 'string',
        required: true,
      },
      k: {
        type: 'string',
        required: true,
      },
      v: {
        type: 'string',
        required: true,
      },
    });
    const { lambdaId, k, v } = ctx.request.body;
    const lambda = await generalCheck(ctx, lambdaId);
    const key = getEnvStorageKey(lambda.id);
    const envObj = await ctx.tigo.faas.storage.getObject(key);
    if (envObj) {
      if (envObj[k]) {
        ctx.throw(400, 'Key已存在，请勿重复添加');
      } else {
        envObj[k] = v;
      }
      await ctx.tigo.faas.storage.setObject(key, envObj);
    } else {
      await ctx.tigo.faas.storage.setObject(key, {
        [k]: v,
      });
    }
    ctx.body = successResponse(null, '添加成功');
  }
  async handleEdit(ctx) {
    ctx.verifyParams({
      lambdaId: {
        type: 'string',
        required: true,
      },
      k: {
        type: 'string',
        required: true,
      },
      v: {
        type: 'string',
        required: true,
      },
    });
    const { lambdaId, k, v } = ctx.request.body;
    const lambda = await generalCheck(ctx, lambdaId);
    const key = getEnvStorageKey(lambda.id);
    const envObj = await ctx.tigo.faas.storage.getObject(key);
    if (!envObj) {
      ctx.throw(400, '找不到环境配置');
    }
    if (!envObj[k]) {
      ctx.throw(400, '找不到对应的键值');
    }
    envObj[k] = v;
    await ctx.tigo.faas.storage.setObject(key, envObj);
    ctx.service.faas.deleteCache(lambda.id);
    ctx.body = successResponse(null, '修改成功');
  }
  async handleDelete(ctx) {
    ctx.verifyParams({
      lambdaId: {
        type: 'string',
        required: true,
      },
      k: {
        type: 'string',
        required: true,
      },
    });
    const { lambdaId, k } = ctx.request.body;
    const lambda = await generalCheck(ctx, lambdaId);
    const key = getEnvStorageKey(lambda.id);
    const envObj = await ctx.tigo.faas.storage.getObject(key);
    if (!envObj) {
      ctx.throw(400, '找不到环境配置');
    }
    if (!envObj[k]) {
      ctx.throw(400, '找不到对应的键值');
    }
    delete envObj[k];
    await ctx.tigo.faas.storage.setObject(key, envObj);
    ctx.service.faas.deleteCache(lambda.id);
    ctx.body = successResponse(null, '删除成功');
  }
}

module.exports = ScriptEnvController;
