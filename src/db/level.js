const levelup = require('levelup');
const leveldown = require('leveldown');
const path = require('path');
const fs = require('fs');

const DEFAULT_PATH = path.resolve(__dirname, '../database/leveldb');

function openDatabase() {
  const { db: dbConfig } = this.config;
  const dbPath = dbConfig.path || DEFAULT_PATH;
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

  return db;
}

module.exports = openDatabase;
