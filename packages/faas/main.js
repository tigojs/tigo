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
  mount(app, opts) {
    opts = opts || {};
    // check auth plugin
    if (!app.tigo.auth) {
      throw new Error('Cannot find any mounted authorization plugin.');
    }
    // check sql db engine
    let sqlEngine;
    if (opts.dbEngine) {
      const engine = app.dbEngine.sql[opts.dbEngine];
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
    if (opts.storageEngine) {
      const engine = app.dbEngine.kv[opts.storageEngine];
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
      if (opts.storage && opts.storage.path) {
        if (!fs.existsSync(opts.storage.path)) {
          throw new Error(`Cannot find the specific storage path [${opts.storage.path}] for cfs.`);
        }
        secondArg = opts.storage.path;
      } else {
        secondArg = path.resolve(app.config.runDirPath, './faas/storage');
        app.logger.warn('Use default storage path for cfs.');
        if (!fs.existsSync(secondArg)) {
          fs.mkdirSync(secondArg, { recursive: true });
        }
      }
    } else {
      secondArg = opts.storage.connection;
    }
    // set object to app
    const faas = {
      storage: kvEngine.openDatabase(app, secondArg),
      allowedRequire: opts.allowedRequire || [],
    };
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
