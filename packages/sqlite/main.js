const sequelize = require('sequelize');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

const { Sequelize } = sequelize;

const plugins = {
  mount(app, config) {
    if (!config) {
      app.logger && app.logger.warn('[sqlite] Cannot find the configuration of sqlite db, use default settings.');
    }

    const conf = config || {};
    if (conf.storage && !fs.existsSync(path.dirname(conf.storage))) {
      app.logger && app.logger.error('[sqlite] Directory of sqlite storage does not exist.');
      throw new Error('Sqlite storage directory does not exist.');
    }

    if (!conf.storage) {
      app.logger && app.logger.warn('[sqlite] Use default storage path.')
    }
    const storagePath = conf.storage || path.resolve(app.config.runDirPath, './sqlite.db');

    const sqlite = new Sequelize('database', null, null, {
      dialect: 'sqlite',
      dialectModule: sqlite3,
      storage: storagePath,
      define: {
        paranoid: conf.paranoid || false,
        underscored: config.underscored || true,
        freezeTableName: config.freezeTableName || true,
      }
    });

    // add info to app
    app.sqlDbEngine.push('sqlite');
    app.dbEngine.sqlite = sqlite;

    // bind to app
    app.server.sqlite = sqlite;
    app.server.context.sqlite = sqlite;
  }
};

module.exports = plugins;
