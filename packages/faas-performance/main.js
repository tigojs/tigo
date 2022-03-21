const { collectController } = require('@tigojs/utils');
const path = require('path');
const RequestPermLog = require('./src/classes/requestPermLog');
const RequestStatusLog = require('./src/classes/requestStatusLog');

const CONTROLLER_PATH = path.resolve(__dirname, './src/controller');

const isNotNumber = (n) => n && typeof n !== 'number';

const plugin = {
  dependencies: ['@tigojs/faas'],
  mount(app, opts) {
    if (!opts) {
      opts = {};
    }
    const needValidate = [['maxTimeSpan', opts.maxTimeSpan], ['maxKeepDays', opts.maxKeepDays]];
    for (const item of needValidate) {
      const [name, value] = item;
      if (isNotNumber(value)) {
        throw new Error(`${name} should be a number.`);
      }
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
      maxKeepDays: opts.maxKeepDays,
      createReqPermLog: (lambdaId) => new RequestPermLog(app, database, lambdaId),
      createReqStatusLog: (lambdaId) => new RequestStatusLog(app, database, lambdaId),
    };
    if (!app.tigo.faas.enabledFeats) {
      app.tigo.faas.enabledFeats = {};
    }
    app.tigo.faas.enabledFeats.perm = true;
    app.tigo.faas.perm = faasPerm;
  },
};

module.exports = plugin;
