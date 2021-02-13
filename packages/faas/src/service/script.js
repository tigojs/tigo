const path = require('path');
const fs = require('fs');
const LRU = require('lru-cache');
const { NodeVM } = require('vm2');
const { BaseService } = require('@tigo/core');
const { createContextProxy } = require('../utils/context');
const { stackFilter } = require('../utils/stackFilter');
const { getEnvStorageKey } = require('../utils/env');

const USERSCRIPT_TEMPLATE = fs.readFileSync(
  path.resolve(__dirname, '../template/userscript.js'),
  { encoding: 'utf-8' },
);

const getStorageKey = (scriptId) => `faas_script_${scriptId}`;

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
    // set vm and cache
    this.vm = new NodeVM({
      require: {
        external: {
          modules: ['@tigo/lambda-*'],
        },
      },
    });
    this.cache = new LRU({
      max: cacheConfig.max || 500,
      maxAge: cacheConfig.maxAge || 60 * 60 * 1000,  // default max age is 1h,
      updateAgeOnGet: true,
    });
    this.scriptPathPrefix = path.resolve(app.rootDirPath, './lambda_userscript');
  }
  async exec(ctx, scopeId, name) {
    const key = `${scopeId}_${name}`;
    let handleRequestFunc = this.cache.get(key);
    if (!handleRequestFunc) {
      // func not in cache
      const script = await ctx.faas.storage.get(getStorageKey(key));
      if (!script) {
        ctx.throw(400, '无法找到对应的脚本');
      }
      handleRequestFunc = this.vm.run(
        USERSCRIPT_TEMPLATE.replace('{{inject}}', script),
        `${this.scriptPathPrefix}_${new Date().valueOf()}.js`,
      );
      this.cache.set(key, handleRequestFunc);
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
    const key = getStorageKey(`${scopeId}_${name}`);
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
      await ctx.faas.storage.put(
        getEnvStorageKey(script.id),
        Buffer.from(content, 'base64').toString('utf-8')
      );
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
      const oldKey = `${scopeId}_${dbItem.name}`;
      await ctx.faas.storage.del(getStorageKey(oldKey));
      await ctx.model.faas.script.update({
        name,
      }, {
        where: {
          id,
        },
      });
      this.cache.del(oldKey);
    }
    // update script
    const key = `${scopeId}_${name}`;
    await ctx.faas.storage.put(
      getStorageKey(key),
      Buffer.from(content, 'base64').toString('utf-8')
    )
    // flush cache
    this.cache.del(key);
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
    const key = `${scopeId}_${dbItem.name}`;
    const newKey = `${scopeId}_${dbItem.newName}`;
    const content = await ctx.faas.storage.get(key);
    await ctx.faas.storage.del(getStorageKey(key));
    this.cache.del(key);
    await ctx.faas.storage.put(getStorageKey(newKey), content);
  }
  async delete(ctx) {
    const { id } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    const dbItem = await generalCheck(ctx, id);
    const key = `${scopeId}_${dbItem.name}`;
    await ctx.faas.storage.del(getEnvStorageKey(dbItem.id));
    await ctx.faas.storage.del(getStorageKey(key));
    this.cache.del(key);
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
    const key = `${scopeId}_${dbItem.name}`;
    return await ctx.faas.storage.get(getStorageKey(key));
  }
}

module.exports = ScriptService;
