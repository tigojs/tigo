const LRUCache = require('lru-cache');
const wrapper = require('../utils/classWrapper');
const ctx = Symbol('ctx');
const scopeId = Symbol('scopeId');

class CFS {
  constructor(context, config) {
    if (!context.tigo.cfs?.storage) {
      throw new Error('CFS module has not been installed ');
    }
    if (!context.params.scopeId) {
      throw new Error('Cannot get user info for accessing CFS.');
    }
    this[ctx] = context;
    this[scopeId] = context.params.scopeId;
    const cacheConfig = config?.cache || {};
    this.cache = new LRUCache({
      max: cacheConfig.max || 100,
      ttl: cacheConfig.maxAge || 10 * 1000,
      updateAgeOnGet: true,
    });
    // register event
    context.tigo.cfs.events.on('content-updated', (key) => {
      this.cache.del(key);
    });
  }
  async get(name, type = null) {
    let realName;
    let realType;
    if (!type) {
      const idx = name.lastIndexOf('.');
      if (idx < 0) {
        throw new Error('The name of config file is invalid.');
      }
      realName = name.substring(realName, idx);
      realType = name.substring(idx + 1);
    } else {
      realName = name;
      realType = type;
    }
    const key = `${this[scopeId]}_${realType}_${realName}`;
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    const content = await this[ctx].tigo.cfs.storage.getString(`confsto_item_${key}`);
    if (!content) {
      return null;
    }
    const decoded = Buffer.from(content, 'base64').toString('utf-8');
    this.cache.set(key, decoded);
    return decoded;
  }
}

module.exports = wrapper(CFS);
