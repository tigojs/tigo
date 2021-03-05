const sequelize = require('sequelize');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');
const { registerDbEngine } = require('@tigojs/utils');

const { Sequelize } = sequelize;

const plugins = {
  type: 'dbEngine',
  mount(app, config) {
    if (!config) {
      app.logger.warn('Cannot find the configuration for sqlite db engine, use default settings.');
    }

    const conf = config || {};
    if (conf.storage && !fs.existsSync(path.dirname(conf.storage))) {
      app.logge.error('Directory of sqlite storage does not exist.');
      throw new Error('Sqlite storage directory does not exist.');
    }

    if (!conf.storage) {
      app.logger.warn('Use default storage path.');
    }
    const storagePath = conf.storage || path.resolve(app.config.runDirPath, './sqlite.db');

    const sqlite = new Sequelize('database', null, null, {
      dialect: 'sqlite',
      dialectModule: sqlite3,
      storage: storagePath,
      define: {
        paranoid: conf.paranoid || false,
        underscored: conf.underscored || true,
        freezeTableName: conf.freezeTableName || true,
      },
      logging: process.env.DB_ENV === 'dev' ? (msg) => app.logger.debug(msg) : false,
    });

    if (conf.wal) {
      sqlite.query('PRAGMA journal_mode = WAL;');
    }

    // add info to app
    registerDbEngine(app, {
      engine: sqlite,
      name: 'sqlite',
      engineType: 'sql',
      storageType: 'local',
    });
  },
};

module.exports = plugins;
