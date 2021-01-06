const levelup = require('levelup');
const leveldown = require('leveldown');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const DEFAULT_PATH = path.resolve(__dirname, '../run/database');

function openDatabase() {
  const { db: dbConfig } = this.config;
  if (!dbConfig) {
    this.logger.warn('Database config was not found, use default db path.');
  }

  const configDbPath = dbConfig ? dbConfig.path : null;
  const dbPath =  configDbPath || DEFAULT_PATH;
  const dbDir = path.dirname(dbPath);

  // check directory
  if (!fs.existsSync(dbDir)) {
    if (dbDir === path.dirname(DEFAULT_PATH)) {
      fs.mkdirSync(dbDir);
    } else {
      return killProcess.call(this, 'openDatabaseError');
    }
  }
  // open database
  const db = levelup(leveldown(dbPath));
  // extend
  db.setExpires = (key, data, expires) => {
    if (typeof expires !== 'number') {
      this.logger.error('Expires must be a number.');
      return;
    }
    if (expires <= 0) {
      return;
    }
    return db.set(key, {
      expires,
      value: data,
      createAt: moment().valueOf(),
    });
  }
  db.getExpires = async (key) => {
    if (!key) {
      this.logger.warn('Key must be a string, can\'t get data by a empty key.');
      return null;
    }
    const stored = await db.get(key);
    if (!stored) {
      return null;
    }
    const { value, createAt, expires } = stored;
    if (createAt + expires < moment().valueOf()) {
      await db.del(key);
      return null;
    }
    return value;
  }

  return db;
}

module.exports = openDatabase;
