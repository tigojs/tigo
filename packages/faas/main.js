const path = require('path');
const {
  collectController,
  collectService,
  collectModel,
} = require('@tigo/utils');

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
    // check sql db engine
    let sqlEngine;
    if (config && config.engine) {
      const engine = app.dbEngine[config.storage];
      if (!engine) {
        throw new Error('Cannot find the specific SQL database engine.');
      }
      sqlEngine = engine;
    }
    if (!sqlEngine) {
      if (app.sqlDbEngine.length) {
        const engineName = app.sqlDbEngine[0];
        app.logger.warn(`Use SQL database engine [${engineName}] by default`);
        sqlEngine = app.dbEngine[engineName];
      } else {
        throw new Error('Cannot find avaliable SQL database engine.');
      }
    }
    // check kv db engine
    let kvEngine;
    if (config && config.storage) {
      const engine = app.dbEngine[config.storage];
      if (!engine) {
        throw new Error('Cannot find the specific storage engine');
      }
      kvEngine = engine;
    }
    if (!app.kvDbEngine.includes('leveldb') && !app.kvDbEngine.includes('rocksdb')) {
      throw new Error('Cannot find leveldb or rocksdb engine.');
    }
    if (!kvEngine) {
      if (app.dbEngine.rocksdb) {
        kvEngine = app.dbEngine.rocksdb;
        app.logger.warn('Use rocksdb for FaaS by default.');
      } else if (app.dbEngine.leveldb) {
        kvEngine = app.dbEngine.leveldb;
        app.logger.warn('Use leveldb for FaaS by default.');
      }
    }
    // set object to app
    const faas = {
      storage: kvEngine,
    };
    app.tigo.faas = faas;
    app.server.faas = faas;
    app.server.context.faas = faas;
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
