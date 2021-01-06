const path = require('path');
const compose = require('koa-compose');
const authErrorHandler = require('./middleware/authErrorHandler');
const tokenVerifier = require('./middleware/tokenVerifier');
const { collectController } = require('tigo/utils/collector');

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
        secret,
        verify: compose([authErrorHandler, tokenVerifier]),
      };
    }
    // register controllers
    collectController.call(app, CONTROLLER_DIR);
  },
};

module.exports = plugin;
