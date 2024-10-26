const mysql = require('mysql2/promise');
const LRU = require('lru-cache');

const cache = new LRU({
  max: 100,
  ttl: 1000 * 30,
  dispose: function (key, conn) {
    conn.__end.call(conn);
  },
  updateAgeOnGet: true,
});

const needValidate = ['host', 'user', 'database'];

const validateConfig = (config) => {
  needValidate.forEach((key) => {
    if (!config[key]) {
      throw new Error(`Parameter [${key}] is necessary.`);
    }
  });
}

async function createConnection(config) {
  config = config || {};
  validateConfig(config);
  const { host, port, user, database } = config;
  const key = `${host}${port || 3306}${user}${database}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }
  const conn = await mysql.createConnection(config);
  conn.__end = conn.end;
  conn.end = (...args) => {
    cache.del(key);
    conn.__end.call(conn, args);
  }
  cache.set(key, conn);
  return conn;
}

module.exports = {
  createConnection,
};
