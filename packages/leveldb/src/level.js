const levelup = require('levelup');
const leveldown = require('leveldown');
const moment = require('moment');

function openDatabase(app, dbPath) {
  // open database
  const db = levelup(leveldown(dbPath));

  // extend
  db.set = db.put;
  db.hasObject = async (key) => {
    let obj;
    try {
      obj = await db.getObject(key);
    } catch (err) {
      if (err.notFound) {
        return false;
      }
      throw err;
    }
    if (!obj) {
      return false;
    }
    return true;
  }
  db.putObject = async (key, value) => {
    return await db.put(key, JSON.stringify(value));
  }
  db.setObject = db.putObject;
  db.getObject = async (key) => {
    try {
      const obj = await db.get(key, {
        asBuffer: false,
      });
      return JSON.parse(obj) || null;
    } catch (err) {
      if (err.notFound) {
        return null;
      }
      throw err;
    }
  }
  db.setExpires = (key, data, expires) => {
    if (typeof expires !== 'number') {
      throw new Error('Expires must be a number');
    }
    if (expires <= 0) {
      return;
    }
    return db.setObject(key, {
      expires,
      value: data,
      createAt: moment().valueOf(),
    });
  }
  db.getExpires = async (key) => {
    const stored = await db.getObject(key);
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
