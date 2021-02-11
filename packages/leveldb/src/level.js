const levelup = require('levelup');
const leveldown = require('leveldown');
const moment = require('moment');

function openDatabase(app, dbPath) {
  // open database
  const db = levelup(leveldown(dbPath));

  // extend
  db.set = db.put;
  db.hasObject = async (key) => {
    const obj = await db.getObject(key);
    if (!obj) {
      return false;
    }
    return true;
  }
  db.getObject = async (key) => {
    if (!key) {
      app.logger.warn('Cannot get object from database because of key is empty.');
      return null;
    }
    try {
      return await db.get(key);
    } catch (err) {
      if (err.notFound) {
        return null;
      }
      throw err;
    }
  }
  db.setExpires = (key, data, expires) => {
    if (typeof expires !== 'number') {
      app.logger.error('Expires must be a number.');
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
      app.logger.warn('Key must be a string, can\'t get data by a empty key.');
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
