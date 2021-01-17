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

const getScriptKey = (id) => `faas_script_${id || uuid.v4()}`;

class ScriptService extends BaseService {
  constructor(app) {
    let { faas: config } = app.config.plugins;
    if (!config) {
      app.logger.warn('Cannot find configuration for FaaS plugin, use default options.');
      config = {};
    }
    let { cache: cacheConfig } = config;
    if (!cacheConfig) {
      cacheConfig = {};
    }
    this.vm = new NodeVM();
    this.cache = new LRU({
      max: cacheConfig.max || 1000,
      maxAge: cacheConfig.maxAge || 60 * 60 * 1000,  // default max age is 1h,
      updateAgeOnGet: true,
    });
    super(app);
  }
  async exec(ctx, scriptId) {
    let handleRequestFunc = this.cache.get(scriptId);
    if (!handleRequestFunc) {
      // func not in cache
      const script = await ctx.faas.storage.get(getScriptKey(scriptId));
      if (!script) {
        ctx.throw(400, '无法找到对应的脚本');
      }
      handleRequestFunc = this.vm.run(script);
      this.cache.set(scriptId, handleRequestFunc);
    }
    await handleRequestFunc(createContextProxy(ctx));
  }
  async write(ctx, content, scriptId = null) {
    const id = scriptId || uuid.v4();
    await ctx.faas.storage.set(
      getScriptKey(id),
      USERSCRIPT_TEMPLATE.replace('{{inject}}', content),
    );
    // remove cache if exists, script should be recompiled
    if (scriptId) {
      this.cache.del(scriptId);
    }
    return id;
  }
  async delete(ctx, scriptId) {
    await ctx.faas.storage.del(getScriptKey(scriptId));
  }
}

module.exports = ScriptService;
