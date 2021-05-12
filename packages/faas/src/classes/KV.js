const LRUCache = require('lru-cache');
const wrapper = require('../utils/classWrapper');
const ctx = Symbol('ctx');
const scopeId = Symbol('scopeId');

const getKvKey = (scopeId, key) => `faas_kv_${scopeId}_${key}`;

const checkKey = (key) => {
  if (typeof key !== 'string') {
    throw new Error('Lambda KV Storage only accepts string key.');
  }
};
const checkValue = (value) => {
  if (typeof value !== 'string') {
    throw new Error('Lambda KV Storage only accepts string value.');
  }
};

class KV {
  constructor(context, config) {
    if (!context.tigo.faas.kvStorage) {
      throw new Error('Lambda KV Storage is not enabled on this server.');
    }
    this[ctx] = context;
    this[scopeId] = context.params.scopeId;
    // init cache
    const cacheConfig = config?.cache || {};
    this.cache = new LRUCache({
      max: cacheConfig.max || 100,
      maxAge: cacheConfig.maxAge || 10 * 1000,
      updateAgeOnGet: true,
    });
  }
  async get(key) {
    checkKey(key);
    const cacheKey = `${this[scopeId]}_${key}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    // no cached value
    const value = await this[ctx].tigo.faas.kvStorage.getString(getKvKey(this[scopeId], key));
    if (value) {
      this.cache.set(cacheKey, value);
    }
    return value;
  }
  async set(key, value) {
    checkKey(key);
    checkValue(value);
    try {
      await this[ctx].tigo.faas.kvStorage.put(getKvKey(this[scopeId], key), value);
    } catch (err) {
      this[ctx].logger.error('Failed to set value.', err);
      throw new Error('Failed to set value.');
    }
    const cacheKey = `${this[scopeId]}_${key}`;
    this.cache.del(cacheKey);
  }
  async remove(key) {
    checkKey(key);
    try {
      await this[ctx].tigo.faas.kvStorage.del(getKvKey(this[scopeId], key));
    } catch (err) {
      this[ctx].logger.error('Failed to remove key.', err);
      throw new Error('Failed to remove key from kv storage.');
    }
    const cacheKey = `${this[scopeId]}_${key}`;
    this.cache.del(cacheKey);
  }
}

module.exports = wrapper(KV);
