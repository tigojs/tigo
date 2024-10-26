const cors = require('@koa/cors');
const { LRUCache } = require('lru-cache');
const crypto = require('crypto');

const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 30,
  updateAgeOnGet: true,
});

const helper = async (ctx, opts) => {
  const hash = crypto.createHash('md5').update(JSON.stringify(opts)).digest('hex');
  let middleware = cache.get(hash);
  if (middleware) {
    await middleware(ctx, null);
  } else {
    middleware = cors(opts);
    cache.set(hash, middleware);
    await middleware(ctx, null);
  }
};

module.exports = helper;
