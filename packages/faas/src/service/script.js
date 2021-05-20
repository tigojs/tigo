const path = require('path');
const LRUCache = require('lru-cache');
const EventEmitter = require('events');
const fetch = require('node-fetch');
const { NodeVM } = require('vm2');
const { v4: uuidv4 } = require('uuid');
const { BaseService } = require('@tigojs/core');
const { createContextProxy } = require('../utils/context');
const { stackFilter } = require('../utils/stackFilter');
const { getStorageKey, getEnvStorageKey, getPolicyKey } = require('../utils/storage');
const { validatePolicy } = require('../utils/validate');
const allowList = require('../constants/allowList');
const Response = require('../classes/Response');
const CFS = require('../classes/CFS');
const OSS = require('../classes/OSS');
const KV = require('../classes/KV');

/**
 * @param {string} content String content before decoding
 * @returns {string} Content after decoded
 */
const getScriptContent = (content) => Buffer.from(content, 'base64').toString('utf-8');

/**
 * @param {string} scopeId
 * @param {string} name
 * @returns {string} Lambda ID LRU cache key
 */
const getLambdaIdCacheKey = (scopeId, name) => `${scopeId}_${name}`;

/**
 * @param {object} ctx koa context
 * @param {string} lambdaId ID of lambda
 * @returns {object} Lambda script model instance
 */
const generalCheck = async (ctx, lambdaId) => {
  const dbItem = await ctx.model.faas.script.findByPk(lambdaId);
  if (!dbItem) {
    ctx.throw(400, '找不到该函数');
  }
  if (dbItem.scopeId !== ctx.state.user.scopeId) {
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
    this.cache = new LRUCache({
      max: cacheConfig.maxLambda || 100,
      maxAge: cacheConfig.maxLambdaAge || 60 * 1000, // default max age is 1min,
      updateAgeOnGet: true,
      dispose: (_, cached) => {
        cached.eventEmitter.removeAllListeners();
        cached.eventEmitter = null;
        cached.vm = null;
      },
    });
    this.lambdaIdCache = new LRUCache({
      max: cacheConfig.maxIds || 1000,
      maxAge: cacheConfig.maxIdAge || 60 * 1000,
      updateAgeOnGet: true,
    });
    this.lambdaNameCache = new LRUCache({
      max: cacheConfig.maxNames || 1000,
      maxAge: cacheConfig.maxNameAge || 30 * 1000,
      updateAgeOnGet: true,
    });
    this.maxWaitTime = config.maxWaitTime || 10;
    this.scriptPathPrefix = path.resolve(app.rootDirPath, './lambda_userscript');
  }
  async getLambdaId(ctx, scopeId, name) {
    // check cache
    const cached = this.lambdaIdCache.get(getLambdaIdCacheKey(scopeId, name));
    if (cached) {
      return cached;
    }
    // get id from db
    const { id } = await ctx.model.faas.script.findOne({
      attributes: [
        'id',
      ],
      where: {
        scopeId,
        name,
      },
    });
    if (id) {
      this.lambdaIdCache.set(getLambdaIdCacheKey(scopeId, name), id);
    }
    return id || null;
  }
  async exec(ctx, scopeId, name) {
    // get lambda id from db
    const lambdaId = await this.getLambdaId(ctx, scopeId, name);
    if (!lambdaId) {
      ctx.throw(400, '无法找到对应的函数');
    }
    // check cache
    const cached = this.cache.get(lambdaId);
    const showStack = ctx.query.__tigoDebug === '1';
    let eventEmitter;
    if (cached) {
      eventEmitter = cached.eventEmitter;
    } else {
      // func not in cache
      const res = await this.runLambda(ctx, lambdaId);
      if (!res) {
        ctx.throw(400, '无法找到对应的函数');
      }
      eventEmitter = res.eventEmitter;
      this.cache.set(lambdaId, res);
    }
    // get policy
    let policy = await ctx.service.faas.policy.get(lambdaId);
    if (!policy) {
      policy = {};
    }
    try {
      await new Promise((resolve, reject) => {
        const wait = setTimeout(() => {
          reject(new Error('The function execution time is above the limit.'));
          eventEmitter.off('error', errorHandler);
        }, policy.maxWaitTime || this.maxWaitTime * 1000);
        const errorHandler = (err) => {
          clearTimeout(wait);
          reject(err);
        };
        eventEmitter.once('error', errorHandler);
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
            // set content type when body is a object
            if (!ctx.headers['content-type']) {
              if (typeof response.body === 'object') {
                ctx.set('Content-Type', 'application/json');
              } else {
                ctx.set('Content-Type', 'text/plain');
              }
            }
            clearTimeout(wait);
            eventEmitter.off('error', errorHandler);
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
        if (process.env.NODE_ENV !== 'dev') {
          err.stack = showStack ? stackFilter(err.stack) : null;
        }
      }
      err.fromFaas = true;
      throw err;
    }
  }
  async runLambda(ctx, lambdaId) {
    const showStack = ctx.query.__tigoDebug === '1';
    const script = await ctx.tigo.faas.storage.getString(getStorageKey(lambdaId));
    const eventEmitter = new EventEmitter();
    const addEventListener = (name, func) => {
      const wrapper = async (...args) => {
        try {
          await Promise.resolve(func.call(null, ...args));
        } catch (err) {
          eventEmitter.emit('error', err);
        }
      };
      eventEmitter.on(name, wrapper);
    };
    const emitLambda = async (name, ...args) => {
      const cached = this.cache.get(lambdaId);
      if (cached) {
        cached.eventEmitter.emit(name, ...args);
      } else {
        const res = await this.runLambda(ctx, lambdaId);
        this.cache.set(lambdaId, res);
        res.eventEmitter.emit(name, ...args);
      }
    };
    const env = await ctx.tigo.faas.storage.getObject(getEnvStorageKey(lambdaId));
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
    console.log(env);
    vm.freeze(env, 'SCRIPT_ENV');
    vm.freeze(Response, 'Response');
    vm.freeze(fetch, 'fetch');
    if (ctx.tigo.cfs) {
      vm.freeze(CFS(ctx, this.config.cfs), 'CFS');
    }
    if (ctx.tigo.oss) {
      vm.freeze(OSS(ctx, this.config.oss), 'OSS');
    }
    if (ctx.tigo.faas.lambdaKvEnabled) {
      vm.freeze(KV(ctx, lambdaId, this.config.lambdaKv), 'KV');
    }
    if (ctx.tigo.faas.log) {
      const logger = ctx.tigo.faas.log.createLogger(lambdaId);
      vm.freeze(logger, 'Log');
    }
    try {
      vm.run(script, `${this.scriptPathPrefix}_${new Date().valueOf()}.js`);
    } catch (err) {
      if (process.env.NODE_ENV !== 'dev') {
        err.stack = showStack ? stackFilter(err.stack) : null;
      }
      err.fromFaas = true;
      throw err;
    }
    return { vm, eventEmitter };
  }
  async add(ctx) {
    const { name, content, env, policy } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    // check content
    const scriptContent = getScriptContent(content);
    // check duplicate items
    if (await ctx.model.faas.script.hasName(scopeId, name)) {
      ctx.throw(400, '名称已被占用');
    }
    // validate policy if exists
    if (policy) {
      validatePolicy(ctx, policy);
    }
    // generate lambda id
    const lambdaId = uuidv4();
    // write content to kv storage
    const key = getStorageKey(lambdaId);
    await ctx.tigo.faas.storage.put(key, scriptContent);
    // save relation to db
    const script = await ctx.model.faas.script.create({
      id: lambdaId,
      scopeId: ctx.state.user.scopeId,
      name,
    });
    // if env exists, add env to kv db
    if (env) {
      await ctx.tigo.faas.storage.putObject(getEnvStorageKey(lambdaId), env || {});
    }
    // if policy exists, add policy to kv db
    if (policy) {
      await ctx.tigo.faas.storage.putObject(getPolicyKey(lambdaId), policy);
    }
    return script.id;
  }
  async edit(ctx) {
    const { id, name, content } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    // check content
    const scriptContent = getScriptContent(content);
    // check db item
    const lambda = await generalCheck(ctx, id);
    // if name changed, delete previous version in storage
    if (lambda.name !== name) {
      if (await ctx.model.faas.script.hasName(scopeId, name)) {
        ctx.throw(400, '名称已被占用');
      }
      await ctx.tigo.faas.storage.del(getStorageKey(lambda.id));
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
      this.cache.del(lambda.id);
      // env
      const envKey = getEnvStorageKey(lambda.id);
      const env = await ctx.tigo.faas.storage.getObject(envKey);
      if (env) {
        await ctx.tigo.faas.storage.del(envKey);
        await ctx.tigo.faas.storage.putObject(getEnvStorageKey(lambda.id), env);
      }
    } else {
      this.cache.del(lambda.id);
    }
    // update script
    await ctx.tigo.faas.storage.put(getStorageKey(lambda.id), scriptContent);
  }
  async rename(ctx) {
    const { id, newName } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    if (await ctx.model.faas.script.hasName(scopeId, newName)) {
      ctx.throw(400, '名称已被占用');
    }
    await generalCheck(ctx, id);
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
  }
  async delete(ctx) {
    const { id } = ctx.request.body;
    const lambda = await generalCheck(ctx, id);
    // delete env and script content
    await ctx.tigo.faas.storage.del(getEnvStorageKey(lambda.id));
    await ctx.tigo.faas.storage.del(getStorageKey(lambda.id));
    // delete kv storage
    const kvCollections = await ctx.tigo.faas.log.db.listCollections({
      name: lambda.id,
    }).toArray();
    if (kvCollections.length) {
      await ctx.tigo.faas.lambdaKvEngine.dropCollection(lambda.id);
    }
    // delete logs
    if (ctx.tigo.faas.log) {
      const logCollections = await ctx.tigo.faas.log.db.listCollections({
        name: lambda.id,
      }).toArray();
      if (logCollections.length) {
        await ctx.tigo.faas.log.db.dropCollection(lambda.id);
      }
    }
    this.cache.del(lambda.id);
    await ctx.model.faas.script.destroy({
      where: {
        id,
      },
    });
  }
  async getName(ctx) {
    const { id } = ctx.query;
    const lambda = await generalCheck(ctx, id);
    return lambda.name;
  }
  async getContent(ctx) {
    const { id } = ctx.query;
    const lambda = await generalCheck(ctx, id);
    const res = await ctx.tigo.faas.storage.getString(getStorageKey(lambda.id));
    return res;
  }
  deleteCache(key) {
    this.cache.del(key);
  }
}

module.exports = ScriptService;
