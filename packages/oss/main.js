const path = require('path');
const {
  collectController,
} = require('@tigojs/utils');
const EventEmitter = require('events');

const CONTROLLER_DIR = path.resolve(__dirname, './src/controller');

const plugin = {
  type: 'module',
  mount(app, opts) {
    // check auth plugin
    if (!app.tigo.auth) {
      throw new Error('Cannot find any mounted authorization plugin.');
    }
    if (!opts.storage || !opts.storage.engine) {
      throw new Error('You should specific a storage engine.');
    }
    const enginePackageName = opts.storage.engine;
    const Engine = require(enginePackageName);
    const engine = new Engine(app, opts.storage.config);
    app.logger.debug(`OSS storage engine ${enginePackageName} imported.`);
    // set object to app
    const oss = {
      engine,
      events: new EventEmitter(),
    };
    app.tigo.oss = oss;
    // collect controllers
    const controllers = collectController.call(app, CONTROLLER_DIR);
    app.controller.oss = controllers;
  }
};

module.exports = plugin;
