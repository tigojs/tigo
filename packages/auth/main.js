const path = require('path');
const compose = require('koa-compose');
const authErrorHandler = require('./middleware/authErrorHandler');
const tokenVerifier = require('./middleware/tokenVerifier');
const { collectController } = require('@tigo/utils');

const CONTROLLER_DIR = path.resolve(__dirname, './controller');

const plugin = {
  mount(app, config) {
    // use error handler
    app.server.use(authErrorHandler);
    // create auth object
    const { secret } = config;
    if (!secret) {
      throw new Error('Cannot find secret in config');
    }
    if (!app.tigo.auth) {
      app.tigo.auth = {
        config: config || {},
        secret,
        verify: compose([authErrorHandler, tokenVerifier]),
      };
    }
    const { engine } = app.tigo.auth.config;
    if (engine) {
      if (!app.sqlDbEngine.includes(engine)) {
        throw new Error('Cannot find the specific db engine.');
      }
    } else {
      if (!!app.sqlDbEngine.length) {
        throw new Error('No avaliable mounted sql db engine.');
      }
      app.logger.warn(`Use first db engine [${app.sqlDbEngine[0]}] by default.`);
      app.tigo.auth.config.engine = app.sqlDbEngine[0];
    }
    // register controllers
    collectController.call(app, CONTROLLER_DIR);
  },
};

module.exports = plugin;
