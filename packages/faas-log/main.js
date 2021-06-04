const LambdaLogger = require('./src/utils/logger');
const { collectController } = require('@tigojs/utils');
const path = require('path');

const CONTROLLER_PATH = path.resolve(__dirname, './src/controller');

const plugin = {
  dependencies: ['@tigojs/faas'],
  mount(app, opts) {
    if (!opts) {
      opts = {};
    }
    // validate time span
    if (opts.maxTimeSpan && typeof opts.maxTimeSpan !== 'number') {
      throw new Error('maxTimeSpan should be a number.');
    }
    // validate maxKeepDays
    if (opts.maxKeepDays && typeof opts.maxKeepDays !== 'number') {
      throw new Error('maxKeepDays should be a number.');
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
    // set up database
    const database = engine.db(opts.database || 'tigo_lambda_log');
    // collect controllers
    const controllers = collectController.call(app, CONTROLLER_PATH);
    Object.assign(app.controller.faas, controllers);
    // set up plugin obj
    const faasLog = {
      db: database,
      createLogger: (lambdaId) => new LambdaLogger(app, database, lambdaId),
      maxTimeSpan: opts.maxTimeSpan || 1000 * 60 * 60 * 24,  // 1 day
      maxKeepDays: opts.maxKeepDays,
    };
    if (!app.tigo.faas.enabledFeats) {
      app.tigo.faas.enabledFeats = {};
    }
    app.tigo.faas.enabledFeats.log = true;
    app.tigo.faas.log = faasLog;
  },
};

module.exports = plugin;
