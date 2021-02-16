const { BaseController } = require('@tigo/core');
const { successResponse } = require('@tigo/utils');
const { getEnvStorageKey } = require('../utils/env');

const generalCheck = async (ctx, scriptId) => {
  const script = await ctx.model.faas.script.findByPk(scriptId);
  if (!script) {
    ctx.throw(400, '无法找到对应的脚本');
  }
  if (script.uid !== ctx.state.user.id) {
    ctx.throw(401, '无权访问');
  }
  return script;
}

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
    if (ctx.query.scriptId) {
      ctx.query.scriptId = parseInt(ctx.query.scriptId, 10);
    }
    ctx.verifyParams({
      scriptId: {
        type: 'number',
        required: true,
      },
    });
    const { scriptId } = ctx.query;
    const { scopeId } = ctx.state.user;
    const script = await generalCheck(ctx, scriptId);
    const envObj = await ctx.faas.storage.getObject(getEnvStorageKey(scopeId, script.name))
    ctx.body = successResponse(envObj);
  }
  async handleAdd(ctx) {
    ctx.verifyParams({
      scriptId: {
        type: 'number',
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
    const { scriptId, k, v } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    const script = await generalCheck(ctx, scriptId);
    const key = getEnvStorageKey(scopeId, script.name);
    const envObj = await ctx.faas.storage.getObject(key);
    if (envObj) {
      if (envObj[k]) {
        ctx.throw(400, 'Key已存在，请勿重复添加');
      } else {
        envObj[k] = v;
      }
      await ctx.faas.storage.setObject(key, envObj);
    } else {
      await ctx.faas.storage.setObject(key, {
        [k]: v,
      });
    }
    ctx.body = successResponse(null, '添加成功');
  }
  async handleEdit(ctx) {
    ctx.verifyParams({
      scriptId: {
        type: 'number',
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
    const { scriptId, k, v } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    const script = await generalCheck(ctx, scriptId);
    const key = getEnvStorageKey(scopeId, script.name);
    const envObj = await ctx.faas.storage.getObject(key);
    if (!envObj) {
      ctx.throw(400, '找不到环境配置');
    }
    if (!envObj[k]) {
      ctx.throw(400, '找不到对应的键值');
    }
    envObj[k] = v;
    await ctx.faas.storage.setObject(key, envObj);
    ctx.body = successResponse(null, '修改成功');
  }
  async handleDelete(ctx) {
    ctx.verifyParams({
      scriptId: {
        type: 'number',
        required: true,
      },
      k: {
        type: 'string',
        required: true,
      },
    });
    const { scriptId, k } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    const script = await generalCheck(ctx, scriptId);
    const key = getEnvStorageKey(scopeId, script.name);
    const envObj = await ctx.faas.storage.getObject(key);
    if (!envObj) {
      ctx.throw(400, '找不到环境配置');
    }
    if (!envObj[k]) {
      ctx.throw(400, '找不到对应的键值');
    }
    delete envObj[k];
    await ctx.faas.storage.setObject(key, envObj);
    ctx.body = successResponse(null, '删除成功');
  }
}

module.exports = ScriptEnvController;
