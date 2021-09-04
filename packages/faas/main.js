const { collectController, collectService, collectModel } = require('@tigojs/utils');
const { ownerCheck } = require('./src/utils/validate');
const path = require('path');
const fs = require('fs');

const CONTROLLER_DIR = path.resolve(__dirname, './src/controller');
const SERVICE_DIR = path.resolve(__dirname, './src/service');
const MODEL_DIR = path.resolve(__dirname, './src/model');

const getKvOptions = function ({ kvEngine, kvConfig, defaultLocalPath }) {
  let dbOpts;
  if (kvEngine.storageType === 'local') {
    if (kvConfig && kvConfig.storagePath) {
      if (!fs.existsSync(kvConfig.storagePath)) {
        throw new Error(`Cannot find the specific storage path [${kvConfig.storagePath}].`);
      }
      dbOpts = kvConfig.storagePath;
    } else {
      dbOpts = defaultLocalPath;
      this.logger.warn('Use default storage path.');
      if (!fs.existsSync(dbOpts)) {
        fs.mkdirSync(dbOpts, { recursive: true });
      }
    }
  } else {
    if (!kvConfig || !kvConfig.connection) {
      throw new Error('You should provide necessary connection info for the KV database engine.');
    }
    dbOpts = kvConfig.storage;
  }
  return dbOpts;
};

const runDirPath = function (p) {
  return path.resolve(this.config.runDirPath, p);
};

const plugin = {
  type: 'module',
  mount(app, opts) {
    opts = opts || {};
    // check auth plugin
    if (!app.tigo.auth) {
      throw new Error('Cannot find any mounted authorization plugin.');
    }
    // check sql db engine
    let sqlEngine;
    if (opts.sqlEngine) {
      const engine = app.dbEngine.sql[opts.sqlEngine];
      if (!engine) {
        throw new Error('Cannot find the specific SQL database engine.');
      }
      sqlEngine = engine;
    } else {
      const keys = Object.keys(app.dbEngine.sql);
      if (!keys.length) {
        throw new Error('Cannot find avaliable SQL database engine.');
      }
      sqlEngine = app.dbEngine.sql[keys[0]];
      app.logger.warn(`Use SQL database engine [${sqlEngine.name}] by default`);
    }
    // check kv db engine
    let kvEngine;
    if (opts.kvEngine) {
      const engine = app.dbEngine.kv[opts.kvEngine];
      if (!engine) {
        throw new Error('Cannot find the specific storage engine');
      }
      kvEngine = engine;
    } else {
      const keys = Object.keys(app.dbEngine.kv);
      if (!keys.length) {
        throw new Error('Cannot find any KV database engine.');
      }
      kvEngine = app.dbEngine.kv[keys[0]];
      app.logger.warn(`Use ${kvEngine.name} for config storage by default.`);
    }
    // open database
    const faas = {
      storage: kvEngine.openDatabase(
        app,
        getKvOptions.call(app, {
          kvEngine,
          kvConfig: opts.kvConfig || {},
          defaultLocalPath: runDirPath.call(app, './faas/storage'),
        })
      ),
      allowedRequire: opts.allowedRequire || [],
      allowBuiltin: opts.allowBuiltin ?? false,
      allowedBuiltin: opts.allowedBuiltin || [],
      ownerCheck,
    };
    // init lambda kv if enabled
    const lambdaKvConfig = opts.lambdaKv || {};
    if (lambdaKvConfig.enabled) {
      app.logger.debug('Lambda KV is enabled.');
      // get mongodb engine
      const keys = Object.keys(app.dbEngine.mongodb);
      let engine;
      if (!keys.length) {
        throw new Error('Cannot find any mongodb engine.');
      }
      if (lambdaKvConfig.engine) {
        if (!keys.includes(lambdaKvConfig.engine)) {
          throw new Error('Cannot find the specific mongodb engine.');
        }
        engine = app.dbEngine.mongodb[lambdaKvConfig.engine];
      } else {
        engine = app.dbEngine.mongodb[keys[0]];
      }
      engine = engine.db(opts.database || 'tigo_lambda_kv');
      Object.assign(faas, {
        lambdaKvEngine: engine,
        lambdaKvEnabled: true,
      });
    }
    app.tigo.faas = faas;
    // collect controllers
    const controllers = collectController.call(app, CONTROLLER_DIR);
    app.controller.faas = controllers;
    // collect services
    const services = collectService.call(app, SERVICE_DIR);
    app.service.faas = services;
    // collect models
    const models = collectModel.call(app, MODEL_DIR, sqlEngine);
    app.model.faas = models;
  },
};

module.exports = plugin;
