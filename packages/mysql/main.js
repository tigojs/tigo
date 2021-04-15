const sequelize = require('sequelize');
const { registerDbEngine } = require('@tigojs/utils');

const { Sequelize } = sequelize;

const needValidate = ['host', 'port', 'user', 'password', 'database'];

const validateConfig = (opts, keys) => {
  for (let i = 0; i < keys.length; i++) {
    if (typeof opts[keys[i]] === 'undefined' || opts[keys[i]] === null) {
      throw new Error(`${keys[i]} is empty, please check it.`);
    }
  }
};

const plugin = {
  type: 'dbEngine',
  mount(app, opts) {
    if (!opts) {
      app.logger.warn('Cannot find the configuration for mysql db engine, use default settings.');
    }
    validateConfig(opts, needValidate)
    opts = opts || {};
    opts.pool = opts.pool || {};
    opts.define = opts.define || {};
    opts.dialect = opts.dialect || {};
    const mysql = new Sequelize(opts.database, opts.user, opts.password, {
      host: opts.host,
      port: opts.port,
      dialect: 'mysql',
      pool: {
        max: opts.pool.max || 30,
        min: opts.pool.min || 5,
        acquire: opts.pool.acquire || 30 * 1000,
        idle: opts.pool.idle || 10 * 1000,
      },
      define: {
        paranoid: opts.define.paranoid || false,
        underscored: opts.define.underscored || true,
        freezeTableName: opts.define.freezeTableName || true,
      },
      dialectOptions: {
        charset: opts.dialect.charset || 'utf8mb4',
        collate: opts.dialect.collate || 'utf8mb4_unicode_ci',
      },
      logging: process.env.DB_ENV === 'dev' ? (msg) => app.logger.debug(msg) : false,
    });

    registerDbEngine(app, {
      engine: mysql,
      name: 'mysql',
      engineType: 'sql',
      storageType: 'network',
    });
  },
};

module.exports = plugin;
