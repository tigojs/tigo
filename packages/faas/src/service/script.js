const path = require('path');
const LRU = require('lru-cache');
const EventEmitter = require('events');
const fetch = require('node-fetch');
const { NodeVM } = require('vm2');
const { BaseService } = require('@tigojs/core');
const { createContextProxy } = require('../utils/context');
const { stackFilter } = require('../utils/stackFilter');
const { getStorageKey, getEnvStorageKey } = require('../utils/storage');
const allowList = require('../constants/allowList');
const Response = require('../classes/Response');
const CFS = require('../classes/CFS');
const OSS = require('../classes/OSS');

const getScriptContent = (content) => Buffer.from(content, 'base64').toString('utf-8');

const generalCheck = async (ctx, id) => {
  const dbItem = await ctx.model.faas.script.findByPk(id);
  if (!dbItem) {
    ctx.throw(400, '找不到该函数');
  }
  if (dbItem.uid !== ctx.state.user.id) {
    ctx.throw(401, '无权访问');
  }
  return dbItem;
};

class ScriptService extends BaseService {
  constructor(app) {
    super(app);
    let { config } = app.config.plugins.faas;
    if (!config) {
      app.logger.warn('Cannot find configuration for FaaS plugin, use default options.');
      config = {};
    }
    this.config = config;
    let { cache: cacheConfig } = config;
    cacheConfig = cacheConfig || {};
    // set cache
    this.cache = new LRU({
      max: cacheConfig.max || 100,
      maxAge: cacheConfig.maxAge || 60 * 1000, // default max age is 1min,
      updateAgeOnGet: true,
      dispose: (_, cached) => {
        cached.eventEmitter = null;
        cached.vm = null;
      },
    });
    this.maxWaitTime = config.maxWaitTime || 10;
    this.scriptPathPrefix = path.resolve(app.rootDirPath, './lambda_userscript');
  }
  async exec(ctx, scopeId, name) {
    const cacheKey = `${scopeId}_${name}`;
    const cached = this.cache.get(cacheKey);
    const showStack = ctx.query.__tigoDebug === '1';
    let eventEmitter;
    if (cached) {
      eventEmitter = cached.eventEmitter;
    } else {
      // func not in cache
      try {
        const res = await this.runLambda(ctx, scopeId, name);
        eventEmitter = res.eventEmitter;
        this.cache.set(cacheKey, res);
      } catch (err) {
        if (err.notFound) {
          ctx.throw(400, '无法找到对应的函数');
        } else {
          err.stack = showStack ? stackFilter(err.stack) : null;
          err.fromFaas = true;
          throw err;
        }
      }
    }
    try {
      await new Promise((resolve, reject) => {
        const wait = setTimeout(() => {
          reject(new Error('The function execution time is above the limit.'));
        }, this.maxWaitTime * 1000);
        eventEmitter.emit('request', {
          context: createContextProxy(ctx),
          respondWith: (response) => {
            if (!response || !response instanceof Response) {
              reject(new Error('Response is invalid, please check your code.'));
            }
            ctx.status = response.status || 200;
            if (response.headers) {
              Object.keys(response.headers).forEach((key) => {
                ctx.set(key, response.headers.key);
              });
            }
            ctx.body = response.body || '';
            // set content type when body is a string
            if (typeof response.body === 'string' && !ctx.headers['content-type']) {
              ctx.set('Content-Type', 'application/json');
            }
            clearTimeout(wait);
            resolve();
          },
        });
      });
    } catch (err) {
      if (typeof err === 'string') {
        err = {
          message: err,
          stack: err,
        };
      } else {
        err.stack = showStack ? stackFilter(err.stack) : null;
      }
      err.fromFaas = true;
      throw err;
    }
  }
  async runLambda(ctx, scopeId, name) {
    const script = await ctx.tigo.faas.storage.get(getStorageKey(scopeId, name));
    const eventEmitter = new EventEmitter();
    const addEventListener = (name, func) => {
      eventEmitter.on(name, func);
    };
    const emitLambda = async (name, ...args) => {
      const cacheKey = `${scopeId}_${name}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        cached.eventEmitter.emit(name, ...args);
      } else {
        const res = await this.runLambda(ctx, scopeId, name);
        this.cache.set(cacheKey, res);
        res.eventEmitter.emit(name, ...args);
      }
    };
    const env = await ctx.tigo.faas.storage.getObject(getEnvStorageKey(scopeId, name));
    const vm = new NodeVM({
      eval: false,
      wasm: false,
      sandbox: {
        addEventListener,
        emitLambda,
      },
      require: {
        external: {
          modules: [...allowList, ...ctx.tigo.faas.allowedRequire],
        },
      },
    });
    vm.freeze(env, 'SCRIPT_ENV');
    vm.freeze(Response, 'Response');
    vm.freeze(fetch, 'fetch');
    if (ctx.tigo.cfs) {
      vm.freeze(CFS(ctx, this.config.cfs), 'CFS');
    }
    if (ctx.tigo.oss) {
      vm.freeze(OSS(ctx, this.config.oss), 'OSS');
    }
    if (this.kvConfig.enable) {
      vm.freeze(KV(ctx, this.config.kv), 'KV');
    }
    if (ctx.tigo.faasLog) {
      const logger = ctx.tigo.faasLog.createLogger(ctx.tigo.faasLog.getLambdaId(scopeId, name));
      vm.freeze(logger, 'Logger');
    }
    vm.run(script, `${this.scriptPathPrefix}_${new Date().valueOf()}.js`);
    return { vm, eventEmitter };
  }
  async add(ctx) {
    const { name, content, env } = ctx.request.body;
    const { id: uid, scopeId } = ctx.state.user;
    // check content
    const scriptContent = getScriptContent(content);
    // check duplicate items
    if (await ctx.model.faas.script.hasName(uid, name)) {
      ctx.throw(400, '名称已被占用');
    }
    // write content to kv storage
    const key = getStorageKey(scopeId, name);
    await ctx.tigo.faas.storage.put(key, scriptContent);
    // save relation to db
    const script = await ctx.model.faas.script.create({
      uid: ctx.state.user.id,
      name,
    });
    // if env exists, add env to kv db
    if (env) {
      await ctx.tigo.faas.storage.putObject(getEnvStorageKey(scopeId, name), env || {});
    }
    return script.id;
  }
  async edit(ctx) {
    const { id, name, content } = ctx.request.body;
    const { id: uid, scopeId } = ctx.state.user;
    // check content
    const scriptContent = getScriptContent(content);
    // check db item
    const dbItem = await generalCheck(ctx, id);
    // if name changed, delete previous version in storage
    if (dbItem.name !== name) {
      if (await ctx.model.faas.script.hasName(uid, name)) {
        ctx.throw(400, '名称已被占用');
      }
      await ctx.tigo.faas.storage.del(getStorageKey(scopeId, dbItem.name));
      await ctx.model.faas.script.update(
        {
          name,
        },
        {
          where: {
            id,
          },
        }
      );
      this.cache.del(`${scopeId}_${dbItem.name}`);
      // env
      const envKey = getEnvStorageKey(scopeId, dbItem.name);
      const env = await ctx.tigo.faas.storage.get(envKey);
      if (env) {
        await ctx.tigo.faas.storage.del(envKey);
        await ctx.tigo.faas.storage.putObject(getEnvStorageKey(scopeId, name), env);
      }
    } else {
      this.cache.del(`${scopeId}_${name}`);
    }
    // update script
    await ctx.tigo.faas.storage.put(getStorageKey(scopeId, name), scriptContent);
  }
  async rename(ctx) {
    const { id, newName } = ctx.request.body;
    const { id: uid, scopeId } = ctx.state.user;
    if (await ctx.model.faas.script.hasName(uid, newName)) {
      ctx.throw(400, '名称已被占用');
    }
    const dbItem = await generalCheck(ctx, id);
    await ctx.model.faas.script.update(
      {
        name: newName,
      },
      {
        where: {
          id,
        },
      }
    );
    // script
    const oldKey = getStorageKey(scopeId, dbItem.name);
    const content = await ctx.tigo.faas.storage.get(oldKey);
    await ctx.tigo.faas.storage.del(oldKey);
    this.cache.del(`${scopeId}_${dbItem.name}`);
    await ctx.tigo.faas.storage.put(getStorageKey(scopeId, newName), content);
    // env
    const envKey = getEnvStorageKey(scopeId, dbItem.name);
    const env = await ctx.tigo.faas.storage.get(envKey);
    if (env) {
      await ctx.tigo.faas.storage.del(getStorageKey(envKey));
      await ctx.tigo.faas.storage.putObject(getEnvStorageKey(scopeId, newName), env || {});
    }
  }
  async delete(ctx) {
    const { id } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    const dbItem = await generalCheck(ctx, id);
    await ctx.tigo.faas.storage.del(getEnvStorageKey(scopeId, dbItem.name));
    await ctx.tigo.faas.storage.del(getStorageKey(scopeId, dbItem.name));
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
    return await ctx.tigo.faas.storage.get(getStorageKey(scopeId, dbItem.name));
  }
  deleteCache(key) {
    this.cache.del(key);
  }
}

module.exports = ScriptService;
