const path = require('path');
const fs = require('fs');
const {
  collectController,
  collectService,
  collectModel,
} = require('@tigojs/utils');
const EventEmitter = require('events');

const CONTROLLER_DIR = path.resolve(__dirname, './src/controller');
const SERVICE_DIR = path.resolve(__dirname, './src/service');
const MODEL_DIR = path.resolve(__dirname, './src/model');

const plugin = {
  type: 'module',
  mount(app, opts) {
    // check auth plugin
    if (!app.tigo.auth) {
      throw new Error('Cannot find any mounted authorization plugin.');
    }
    // check sql engine
    let sqlEngine;
    if (opts?.dbEngine) {
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
    // check kv storage engine
    let kvEngine;
    if (opts?.kvEngine) {
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
    let secondArg;
    if (kvEngine.storageType === 'local') {
      if (opts?.kvConfig?.storagePath) {
        const { storagePath } = opts.kvConfig;
        if (!fs.existsSync(storagePath)) {
          throw new Error(`Cannot find the specific storage path [${storagePath}] for cfs.`);
        }
        secondArg = storagePath;
      } else {
        app.logger.warn('Use default storage path for cfs.');
        secondArg = path.resolve(app.config.runDirPath, './cfs/storage');
        if (!fs.existsSync(secondArg)) {
          fs.mkdirSync(secondArg, { recursive: true });
        }
      }
    } else {
      if (!opts?.kvConfig?.connection) {
        throw new Error('You should provide necessary connection info for the KV database engine.');
      }
      secondArg = opts.kvConfig.connection;
    }
    // set object to app
    const cfs = {
      storage: kvEngine.openDatabase(app, secondArg),
      events: new EventEmitter(),
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
