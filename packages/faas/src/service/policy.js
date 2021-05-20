const { BaseService } = require('@tigojs/core');
const { getPolicyKey } = require('../utils/storage');
const { validatePolicy } = require('../utils/validate');
const LRUCache = require('lru-cache');

class LambdaPolicyService extends BaseService {
  constructor(app) {
    super(app);
    // get config
    let { config } = app.config.plugins.faas;
    if (!config) {
      config = {};
    }
    let { cache: cacheConfig } = config;
    cacheConfig = cacheConfig || {};
    // init cache
    this.cache = new LRUCache({
      max: cacheConfig.maxPolicies || 100,
      maxAge: cacheConfig.maxPolicyAge || 60 * 1000,
      updateAgeOnGet: true,
    });
  }
  async get(ctx, lambdaId) {
    const stored = this.cache.get(lambdaId);
    if (stored) {
      return stored;
    }
    let policy;
    try {
      policy = await ctx.tigo.faas.storage.getObject(getPolicyKey(lambdaId));
    } catch (err) {
      if (!err.notFound) {
        return null;
      }
      throw err;
    }
    if (policy) {
      this.cache.set(lambdaId, policy);
    }
    return policy || null;
  }
  async set(ctx, lambdaId, policy) {
    // validate
    validatePolicy(ctx, policy);
    // set to db
    await ctx.tigo.faas.storage.putObject(getPolicyKey(lambdaId), policy);
    this.cache.del(lambdaId);
  }
  delCache(lambdaId) {
    this.cache.del(lambdaId);
  }
}

module.exports = LambdaPolicyService;
