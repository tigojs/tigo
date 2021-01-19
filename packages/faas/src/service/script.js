const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const LRU = require('lru-cache');
const { NodeVM } = require('vm2');
const { BaseService } = require('@tigo/core');
const { createContextProxy } = require('../utils/context');

const USERSCRIPT_TEMPLATE = fs.readFileSync(
  path.resolve(__dirname, '../template/userscript.js'),
  { encoding: 'utf-8' },
);

const getStorageKey = (scriptId) => `faas_script_${scriptId}`;

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
    this.vm = new NodeVM();
    this.cache = new LRU({
      max: cacheConfig.max || 500,
      maxAge: cacheConfig.maxAge || 60 * 60 * 1000,  // default max age is 1h,
      updateAgeOnGet: true,
    });
  }
  async exec(ctx, scopeId, name) {
    const key = `${scopeId}_${name}`;
    let handleRequestFunc = this.cache.get(key);
    if (!handleRequestFunc) {
      // func not in cache
      const script = await ctx.faas.storage.get(getScriptKey(key));
      if (!script) {
        ctx.throw(400, '无法找到对应的脚本');
      }
      handleRequestFunc = this.vm.run(USERSCRIPT_TEMPLATE.replace('{{inject}}', script));
      this.cache.set(key, handleRequestFunc);
    }
    await handleRequestFunc(createContextProxy(ctx));
  }
  async add(ctx) {
    const { name, content, remark } = ctx.request.body;
    const { id: uid, scopeId } = ctx.state.user;
    // check duplicate items
    if (ctx.model.faas.script.hasName(uid, name)) {
      ctx.throw(400, '脚本名称已被占用');
    }
    // write content to kv storage
    const key = getStorageKey(`${scopeId}_${name}`);
    await ctx.faas.storage.set(
      key,
      Buffer.from(content, 'base64').toString('utf-8'),
    );
    // save relation to db
    const script = await ctx.model.faas.script.create({
      uid: ctx.state.user.id,
      name,
      remark,
    });
    return script.id;
  }
  async edit(ctx) {
    const { id, name, content, remark } = ctx.request.body;
    const { id: uid, scopeId } = ctx.state.user;
    // check db item
    const dbItem = await ctx.model.faas.script.findByPk(id);
    if (!dbItem) {
      ctx.throw(400, '找不到该脚本');
    }
    if (dbItem.uid !== uid) {
      ctx.throw(401, '无权访问');
    }
    // if name changed, delete previous version in storage
    if (dbItem.name !== name) {
      if (ctx.model.faas.script.hasName(uid, name)) {
        ctx.throw(400, '名称已被占用');
      }
      const oldKey = `${scopeId}_${dbItem.name}`;
      await ctx.faas.storage.del(getStorageKey(oldKey));
      this.cache.del(oldKey);
    }
    // update script
    const key = `${scopeId}_${name}`;
    await ctx.faas.storage.set(
      getStorageKey(key),
      Buffer.from(content, 'base64').toString('utf-8')
    )
    // flush cache
    this.cache.del(key);
    // update sql db
    await ctx.model.faas.script.update({
      id,
      uid,
      name,
      remark,
    });
  }
  async delete(ctx, id) {
    const { scopeId } = ctx.state.user;
    const dbItem = await ctx.model.faas.script.findByPk(id);
    if (!dbItem) {
      ctx.throw(400, '找不到该脚本');
    }
    const key = `${scopeId}_${dbItem.name}`;
    await ctx.faas.storage.del(getStorageKey(key));
    this.cache.del(key);
    await ctx.model.faas.script.destory({
      where: {
        id,
      },
    });
  }
  async getContent(ctx, scopeId, scriptId) {
    const key = `${scopeId}_${scriptId}`;
    return await ctx.faas.storage.get(getStorageKey(key));
  }
}

module.exports = ScriptService;
