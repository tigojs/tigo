const LRUCache = require('lru-cache');
const wrapper = require('../utils/classWrapper');
const ctx = Symbol('koaContext');
const lambdaId = Symbol('lambdaId');
const collection = Symbol('collection');
const cache = Symbol('cache');
const cacheEnabled = Symbol('cacheEnabled');

const validateKey = (key) => {
  if (typeof key !== 'string') {
    throw new Error('Lambda KV Storage only accepts string key.');
  }
};

class KV {
  constructor(context, _lambdaId, config) {
    if (!context.tigo.faas.lambdaKvEngine) {
      throw new Error('Lambda KV Storage is not enabled on this server.');
    }
    this[ctx] = context;
    this[lambdaId] = _lambdaId;
    this[collection] = this[ctx].tigo.faas.lambdaKvEngine.collection(this[lambdaId]);
    this[cacheEnabled] = false;
    // init cache
    const cacheConfig = config?.cache || {};
    const { enable } = cacheConfig;
    if (enable) {
      this[cacheEnabled] = true;
      this[cache] = new LRUCache({
        max: cacheConfig.max || 100,
        ttl: cacheConfig.maxAge || 10 * 1000,
        updateAgeOnGet: true,
      });
    }
  }
  async get(key) {
    validateKey(key);
    if (this[cacheEnabled]) {
      const cacheKey = `${this[lambdaId]}_${key}`;
      const cached = this[cache].get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    // no cached value
    const res = await this[collection].findOne({
      key,
    });
    if (typeof res !== 'undefined' && res !== null) {
      if (this[cacheEnabled]) {
        this[cache].set(cacheKey, res.value);
      }
    } else {
      return null;
    }
    return res.value;
  }
  async set(key, value) {
    validateKey(key);
    try {
      await this[collection].updateOne(
        {
          key,
        },
        {
          $set: {
            value,
            updatedTime: Date.now(),
          },
        },
        {
          upsert: true,
        }
      );
    } catch (err) {
      this[ctx].logger.error('Failed to set value.', err);
      if (process.env.NODE_ENV === 'dev') {
        throw err;
      } else {
        throw new Error('Failed to set value.');
      }
    }
    if (this[cacheEnabled]) {
      const cacheKey = `${this[lambdaId]}_${key}`;
      this[cache].del(cacheKey);
    }
  }
  async remove(key) {
    validateKey(key);
    try {
      await this[collection].deleteOne(
        {
          key,
        }
      );
    } catch (err) {
      this[ctx].logger.error('Failed to remove key.', err);
      throw new Error('Failed to remove key from kv storage.');
    }
    if (this[cacheEnabled]) {
      const cacheKey = `${this[lambdaId]}_${key}`;
      this[cache].del(cacheKey);
    }
  }
}

module.exports = wrapper(KV);
