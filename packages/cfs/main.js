const path = require('path');
const fs = require('fs');
const {
  collectController,
  collectService,
  collectModel,
} = require('@tigojs/utils');

const CONTROLLER_DIR = path.resolve(__dirname, './src/controller');
const SERVICE_DIR = path.resolve(__dirname, './src/service');
const MODEL_DIR = path.resolve(__dirname, './src/model');

const plugin = {
  type: 'module',
  mount(app, config) {
    // check auth plugin
    if (!app.tigo.auth) {
      throw new Error('Cannot find any mounted authorization plugin.');
    }
    // check sql engine
    let sqlEngine;
    if (config?.dbEngine) {
      const engine = app.dbEngine.sql[config.dbEngine];
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
    // check kv storage engine
    let kvEngine;
    if (config?.storageEngine) {
      const engine = app.dbEngine.kv[config.storageEngine];
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
    let secondArg;
    if (kvEngine.storageType === 'local') {
      if (config?.storage?.path) {
        if (!fs.existsSync(config.storage.path)) {
          throw new Error(`Cannot find the specific storage path [${config.storage.path}] for cfs.`);
        }
        secondArg = config.storage.path;
      } else {
        app.logger.warn('Use default storage path for cfs.');
        secondArg = path.resolve(app.config.runDirPath, './cfs/storage');
        if (!fs.existsSync(secondArg)) {
          fs.mkdirSync(secondArg, { recursive: true });
        }
      }
    } else {
      secondArg = config.storage.connection;
    }
    // set object to app
    const cfs = {
      storage: kvEngine.openDatabase(app, secondArg),
    };
    app.tigo.cfs = cfs;
    // collect controller, service and model
    const controllers = collectController.call(app, CONTROLLER_DIR);
    app.controller.cfs = controllers;
    const services = collectService.call(app, SERVICE_DIR);
    app.service.cfs = services;
    const models = collectModel.call(app, MODEL_DIR, sqlEngine);
    app.model.cfs = models;
  },
};

module.exports = plugin;
