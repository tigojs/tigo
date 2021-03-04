const mysql = require('mysql2/promise');
const LRU = require('lru-cache');

const cache = new LRU({
  max: 100,
  maxAge: 1000 * 60 * 30,
  dispose: function (key, conn) {
    conn.end();
  },
  updateAgeOnGet: true,
});

const needValidate = ['host', 'user', 'database'];

const validateConfig = (config) => {
  needValidate.forEach((key) => {
    if (!config.key) {
      throw new Error(`Parameter [${key}] is necessary.`);
    }
  });
}

async function createConnection(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Config is empty.');
  }
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
    conn.__end.call(conn, args);
  }
  cache.set(key, conn);
  return conn;
}

module.exports = {
  createConnection,
};
