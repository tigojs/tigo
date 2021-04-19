const path = require('path');
const accessVerifier = require('./src/middleware/accessVerifier');
const apiRequestFlag = require('./src/middleware/apiRequestFlag');
const {
  collectController,
  collectService,
  collectModel,
} = require('@tigojs/utils');

const CONTROLLER_DIR = path.resolve(__dirname, './src/controller');
const SERVICE_DIR = path.resolve(__dirname, './src/service');
const MODEL_DIR = path.resolve(__dirname, './src/model');

const plugin = {
  type: 'basic',
  mount(app, config) {
    // create auth object
    const { secret } = config;
    if (!secret) {
      throw new Error('Cannot find secret in config');
    }
    app.tigo.auth = {
      config: config || {},
      secret,
      verifier: accessVerifier,
      apiFlag: apiRequestFlag,
    };
    let { engine } = app.tigo.auth.config;
    if (engine) {
      if (!app.dbEngine.sql[engine]) {
        throw new Error('Cannot find the specific db engine.');
      }
    } else {
      const keys = Object.keys(app.dbEngine.sql);
      if (!keys.length) {
        throw new Error('No avaliable sql db engine.');
      }
      engine = app.dbEngine.sql[keys[0]];
      app.logger.warn(`Use first db engine [${engine.name}] by default.`);
    }
    // collect controllers
    const controllers = collectController.call(app, CONTROLLER_DIR);
    app.controller.auth = controllers;
    // collect services
    const services = collectService.call(app, SERVICE_DIR);
    app.service.auth = services;
    // collect models
    const models = collectModel.call(app, MODEL_DIR, engine);
    app.model.auth = models;
  },
};

module.exports = plugin;
