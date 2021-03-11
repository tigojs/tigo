const levelup = require('levelup');
const leveldown = require('leveldown');
const { extendLevelDb } = require('@tigojs/utils');

function openDatabase(app, dbPath) {
  // open database
  const db = extendLevelDb(levelup(leveldown(dbPath)));
  return db;
}

module.exports = openDatabase;
