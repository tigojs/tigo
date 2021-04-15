const LRUCache = require('lru-cache');
const wrapper = require('../utils/classWrapper');

const ctx = Symbol('ctx');
const scopeId = Symbol('scopeId');

class OSS {
  constructor(context, config) {
    if (!context.tigo.oss?.engine) {
      throw new Error("There's no any available OSS engine on the server.");
    }
    this[ctx] = context;
    this[scopeId] = context.params.scopeId;
    const cacheConfig = config?.cache || {};
    this.cache = new LRUCache({
      max: cacheConfig.max || 100,
      maxAge: cacheConfig.maxAge || 10 * 1000,
      updateAgeOnGet: true,
    });
    context.tigo.oss.events.on('policy-updated', ({ scopeId, policyName }) => {
      this.cache.del(`${scopeId}_${policyName}`);
    });
  }
  async getObject(bucket, key) {
    let formattedKey = key.startsWith('/') ? key.substr(1) : key;
    try {
      const file = await this[ctx].tigo.oss.engine.getObject({
        scopeId: this[scopeId],
        bucketName: bucket,
        key: formattedKey,
      });
      return file || null;
    } catch (err) {
      if (err.notFound) {
        return null;
      }
      this[ctx].logger.error('Failed to get object in lambda.', err);
      throw new Error('Failed to get the object from OSS.');
    }
  }
  // file should be a buffer
  async putObject(bucket, key, file, force = false) {
    if (!Buffer.isBuffer(file)) {
      throw new Error('File should be a buffer.');
    }
    let formattedKey = key.startsWith('/') ? key.substr(1) : key;
    try {
      await this[ctx].tigo.oss.engine.putObject({
        scopeId: this[scopeId],
        bucketName: bucket,
        key: formattedKey,
        file,
        force,
      });
    } catch (err) {
      if (err.duplicated) {
        throw new Error('Key is duplicated, please check the key of your object.');
      }
      this[ctx].logger.error('Failed to put object in lambda.', err);
      throw new Error('Failed to put object to OSS.');
    }
  }
  async getBucketPolicy(bucket) {
    let policy;
    try {
      policy = await ctx.tigo.oss.engine.getBucketPolicy({
        scopeId: ctx.state.user.scopeId,
        bucketName: bucket,
      });
    } catch (err) {
      if (err.notFound) {
        return null;
      }
      this[ctx].logger.error('Failed to get bucket policy from OSS.', err);
      throw new Error('Failed to get bucket policy from OSS.');
    }
    return policy;
  }
  async setBucketPolicy(bucket, policy) {
    if (typeof policy !== 'object') {
      throw new Error('Policy should be an object.');
    }
    try {
      await ctx.tigo.oss.engine.setBucketPolicy({
        scopeId,
        bucketName: bucket,
        policy,
      });
    } catch (err) {
      this[ctx].logger.error('Failed to set bucket policy.');
      throw new Error('Failed to set bucket policy.');
    }
  }
}

module.exports = wrapper(OSS);
