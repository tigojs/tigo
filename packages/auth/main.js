const path = require('path');
const tokenVerifier = require('./middleware/tokenVerifier');
const apiRequestVerifier = require('./middleware/apiRequestVerifier');
const {
  collectController,
  collectService,
  collectModel,
} = require('@tigojs/utils');

const CONTROLLER_DIR = path.resolve(__dirname, './controller');
const SERVICE_DIR = path.resolve(__dirname, './service');
const MODEL_DIR = path.resolve(__dirname, './model');

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
      verify: tokenVerifier,
      apiVerify: apiRequestVerifier,
    };
    let { engine } = app.tigo.auth.config;
    if (engine) {
      if (!app.sqlDbEngine.includes(engine)) {
        throw new Error('Cannot find the specific db engine.');
      }
    } else {
      if (!!!app.sqlDbEngine.length) {
        throw new Error('No avaliable mounted sql db engine.');
      }
      app.logger.warn(`Use first db engine [${app.sqlDbEngine[0]}] by default.`);
      app.tigo.auth.config.engine = app.sqlDbEngine[0];
      engine = app.sqlDbEngine[0];
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
