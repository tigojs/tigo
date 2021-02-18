const path = require('path');
const fs = require('fs');
const LRU = require('lru-cache');
const { NodeVM } = require('vm2');
const { BaseService } = require('@tigojs/core');
const { createContextProxy } = require('../utils/context');
const { stackFilter } = require('../utils/stackFilter');
const { getEnvStorageKey } = require('../utils/env');

const USERSCRIPT_TEMPLATE = fs.readFileSync(
  path.resolve(__dirname, '../template/userscript.js'),
  { encoding: 'utf-8' },
);

const getStorageKey = (scopeId, name) => `faas_script_${scopeId}_${name}`;

const generalCheck = async (ctx, id) => {
  const dbItem = await ctx.model.faas.script.findByPk(id);
  if (!dbItem) {
    ctx.throw(400, '找不到该脚本');
  }
  if (dbItem.uid !== ctx.state.user.id) {
    ctx.throw(401, '无权访问');
  }
  return dbItem;
}

class ScriptService extends BaseService {
  constructor(app) {
    let { config } = app.config.plugins.faas;
    if (!config) {
      app.logger.warn('Cannot find configuration for FaaS plugin, use default options.');
      config = {};
    }
    let { cache: cacheConfig } = config;
    cacheConfig = cacheConfig || {};
    super(app);
    // set cache
    this.cache = new LRU({
      max: cacheConfig.max || 500,
      maxAge: cacheConfig.maxAge || 60 * 60 * 1000,  // default max age is 1h,
      updateAgeOnGet: true,
    });
    this.scriptPathPrefix = path.resolve(app.rootDirPath, './lambda_userscript');
  }
  async exec(ctx, scopeId, name) {
    const cacheKey = `${scopeId}_${name}`;
    let handleRequestFunc = this.cache.get(cacheKey);
    if (!handleRequestFunc) {
      // func not in cache
      const script = await ctx.faas.storage.get(getStorageKey(scopeId, name));
      if (!script) {
        ctx.throw(400, '无法找到对应的脚本');
      }
      const env = await ctx.faas.storage.getObject(getEnvStorageKey(scopeId, name));
      const vm = new NodeVM({
        eval: false,
        wasm: false,
        require: {
          external: {
            modules: ['@tigojs/lambda-*'],
          },
        },
      });
      vm.freeze(env, 'SCRIPT_ENV');
      handleRequestFunc = vm.run(
        USERSCRIPT_TEMPLATE.replace('{{inject}}', script),
        `${this.scriptPathPrefix}_${new Date().valueOf()}.js`,
      );
      this.cache.set(cacheKey, handleRequestFunc);
    }
    try {
      await handleRequestFunc(createContextProxy(ctx));
    } catch (err) {
      err.stack = stackFilter(err.stack);
      throw err;
    }
  }
  async add(ctx) {
    const { name, content, env } = ctx.request.body;
    const { id: uid, scopeId } = ctx.state.user;
    // check duplicate items
    if (await ctx.model.faas.script.hasName(uid, name)) {
      ctx.throw(400, '名称已被占用');
    }
    // write content to kv storage
    const key = getStorageKey(scopeId, name);
    await ctx.faas.storage.put(
      key,
      Buffer.from(content, 'base64').toString('utf-8'),
    );
    // save relation to db
    const script = await ctx.model.faas.script.create({
      uid: ctx.state.user.id,
      name,
    });
    // if env exists, add env to kv db
    if (env) {
      await ctx.faas.storage.putObject(getEnvStorageKey(scopeId, name), env);
    }
    return script.id;
  }
  async edit(ctx) {
    const { id, name, content } = ctx.request.body;
    const { id: uid, scopeId } = ctx.state.user;
    // check db item
    const dbItem = await generalCheck(ctx, id);
    // if name changed, delete previous version in storage
    if (dbItem.name !== name) {
      if (await ctx.model.faas.script.hasName(uid, name)) {
        ctx.throw(400, '名称已被占用');
      }
      await ctx.faas.storage.del(getStorageKey(scopeId, dbItem.name));
      await ctx.model.faas.script.update({
        name,
      }, {
        where: {
          id,
        },
      });
      this.cache.del(`${scopeId}_${dbItem.name}`);
      // env
      const envKey = getEnvStorageKey(scopeId, dbItem.name);
      const env = await ctx.faas.storage.get(envKey);
      if (env) {
        await ctx.faas.storage.del(envKey);
        await ctx.faas.storage.putObject(getEnvStorageKey(scopeId, name), env);
      }
    } else {
      this.cache.del(`${scopeId}_${name}`);
    }
    // update script
    await ctx.faas.storage.put(
      getStorageKey(scopeId, name),
      Buffer.from(content, 'base64').toString('utf-8')
    )
  }
  async rename(ctx) {
    const { id, newName } = ctx.request.body;
    const { id: uid, scopeId } = ctx.state.user;
    if (await ctx.model.faas.script.hasName(uid, newName)) {
      ctx.throw(400, '名称已被占用');
    }
    const dbItem = await generalCheck(ctx, id);
    await ctx.model.faas.script.update({
      name: newName,
    }, {
      where: {
        id,
      },
    });
    // script
    const oldKey = getStorageKey(scopeId, dbItem.name);
    const content = await ctx.faas.storage.get(oldKey);
    await ctx.faas.storage.del(oldKey);
    this.cache.del(`${scopeId}_${dbItem.name}`);
    await ctx.faas.storage.put(getStorageKey(scopeId, newName), content);
    // env
    const envKey = getEnvStorageKey(scopeId, dbItem.name);
    const env = await ctx.faas.storage.get(envKey);
    if (env) {
      await ctx.faas.storage.del(getStorageKey(envKey));
      await ctx.faas.storage.putObject(getEnvStorageKey(scopeId, newName), env);
    }
  }
  async delete(ctx) {
    const { id } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    const dbItem = await generalCheck(ctx, id);
    await ctx.faas.storage.del(getEnvStorageKey(scopeId, dbItem.name));
    await ctx.faas.storage.del(getStorageKey(scopeId, dbItem.name));
    this.cache.del(`${scopeId}_${dbItem.name}`);
    await ctx.model.faas.script.destroy({
      where: {
        id,
      },
    });
  }
  async getContent(ctx) {
    const { id } = ctx.query;
    const { scopeId } = ctx.state.user;
    const dbItem = await generalCheck(ctx, id);
    return await ctx.faas.storage.get(getStorageKey(scopeId, dbItem.name));
  }
}

module.exports = ScriptService;
