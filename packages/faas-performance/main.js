const { collectController } = require('@tigojs/utils');
const path = require('path');
const RequestPermLog = require('./src/classes/requestPermLog');
const RequestStatusLog = require('./src/classes/requestStatusLog');

const CONTROLLER_PATH = path.resolve(__dirname, './src/controller');

const plugin = {
  dependencies: ['@tigojs/faas'],
  mount(app, opts) {
    if (!opts) {
      opts = {};
    }
    // get mongodb engine
    let engine;
    if (opts.mongoEngine) {
      engine = app.dbEngine.mongodb[opts.mongoEngine];
      if (!engine) {
        throw new Error('Cannot find the specific MongoDB engine.');
      }
    } else {
      const keys = Object.keys(app.dbEngine.mongodb);
      if (!keys.length) {
        throw new Error('Cannot find any available MongoDB engine.');
      }
      app.logger.warn(`Using engine [${keys[0]}] by default.`);
      engine = app.dbEngine.mongodb[keys[0]];
    }
    const database = engine.db(opts.database || 'tigo_lambda_performence');
    // collect controllers
    const controllers = collectController.call(app, CONTROLLER_PATH);
    Object.assign(app.controller.faas, controllers);
    // set up plugin obj
    const faasPerm = {
      db: database,
      maxTimeSpan: opts.maxTimeSpan || 86400 * 1000,
      createReqPermLog: (lambdaId) => new RequestPermLog(database, lambdaId),
      createReqStatusLog: (lambdaId) => new RequestStatusLog(database, lambdaId),
    };
    if (!app.tigo.faas.enabledFeats) {
      app.tigo.faas.enabledFeats = {};
    }
    app.tigo.faas.enabledFeats.perm = true;
    app.tigo.faas.perm = faasPerm;
  },
};

module.exports = plugin;
