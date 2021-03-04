const Redis = require('ioredis');
const LRUCache = require('lru-cache');
const crypto = require('crypto');

const cache = new LRUCache({
  max: 100,
  maxAge: 1000 * 30,
  dispose: function (key, redis) {
    redis.disconnect();
  },
  updateAgeOnGet: true,
});

const getKey = (opts) => crypto.createHmac('md5', 'tigo').update(JSON.stringify(opts)).digest('hex');

async function createConnection(opts) {
  const cacheKey = getKey(opts);
  const stored = cache.get(cacheKey);
  if (stored) {
    return stored;
  }
  const redis = new Redis({
    ...opts,
    lazyConnect: true,
  });
  await redis.connect();
  cache.set(cacheKey, redis);

  return redis;
}

module.exports = {
  createConnection,
};
