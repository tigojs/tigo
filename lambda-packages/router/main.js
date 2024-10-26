const { match } = require('path-to-regexp');
const { LRUCache } = require('lru-cache');

class Router {
  constructor(opts) {
    const cacheConfig = {
      max: 100,
      ttl: 60 * 1000, // 1 min
      updateAgeOnGet: true,
    };
    this.cache = new LRUCache(opts?.cache || cacheConfig);
    this.targets = {};
  }
  register(method, path, target) {
    if (!this.targets[method.toLowerCase()]) {
      this.targets[method.toLowerCase()] = [];
    }
    const targetMethod = this.targets[method.toLowerCase()];
    targetMethod.push({
      path,
      target,
    });
  }
  route(ctx) {
    const { method } = ctx;
    const formattedMethod = method.toLowerCase();
    const targetMethod = this.targets[formattedMethod];
    if (!targetMethod) {
      return {
        status: 400,
        message: 'Unsupported request method.',
      };
    }
    const cacheKey = `${method}_${ctx.path}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      ctx.params = cached.params;
      return Promise.resolve(cached.target.call(null, ctx));
    }
    let target;
    for (let i = 0; i < targetMethod.length; i++) {
      const matchFn = match(targetMethod[i].path, { decode: decodeURIComponent });
      const matchRes = matchFn(ctx.path);
      if (matchRes) {
        ctx.params = matchRes.params;
        target = targetMethod[i].target;
        break;
      }
    }
    if (!target) {
      return {
        status: 404,
        message: 'No route handler.',
      };
    }
    this.cache.set(cacheKey, {
      target,
      params: ctx.params,
    });
    return Promise.resolve(target.call(null, ctx));
  }
  head(...args) {
    this.register.call(this, 'head', ...args);
  }
  get(...args) {
    this.register.call(this, 'get', ...args);
  }
  post(...args) {
    this.register.call(this, 'post', ...args);
  }
  put(...args) {
    this.register.call(this, 'put', ...args);
  }
  delete(...args) {
    this.register.call(this, 'delete', ...args);
  }
  options(...args) {
    this.register.call(this, 'options', ...args);
  }
  trace(...args) {
    this.register.call(this, 'trace', ...args);
  }
  connect(...args) {
    this.register.call(this, 'connect', ...args);
  }
};

module.exports = Router;
