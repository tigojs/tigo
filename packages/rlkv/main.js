const { registerDbEngine, extendLevelDb } = require('@tigojs/utils');
const redis = require('redis');
const levelup = require('levelup');
const redisdown = require('redisdown');
const LRUCache = require('lru-cache');
const crypto = require('crypto');

const cache = new LRUCache({
  max: 30,
});

const getCacheKey = (conn) => crypto.createHash('sha1').update(JSON.stringify(conn)).digest('hex');

const openDatabase = (app, conn) => {
  if (!conn) {
    throw new Error('You should fill in the connection configuration.');
  }
  const cacheKey = getCacheKey(conn);
  const cached = cache.get(cacheKey);
  let redisClient;
  if (!cached) {
    redisClient = redis.createClient(conn);
    redisClient.on('end', () => {
      // if connection closed, remove client from cache
      cache.del(cacheKey);
    });
    cache.set(cacheKey, redisClient);
  } else {
    redisClient = cached;
  }
  const db = extendLevelDb(levelup('rlkv', { db: redisdown, redis: redisClient }));
  return db;
};

const plugin = {
  mount(app) {
    registerDbEngine(app, {
      engine: {
        openDatabase,
      },
      name: 'rlkv',
      engineType: 'kv',
      storageType: 'network',
    });
  }
}

module.exports = plugin;
