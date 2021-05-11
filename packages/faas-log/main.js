const LambdaLogger = require('./src/utils/logger');
const getLambdaId = require('./src/utils/log');

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
    // set up database
    const database = engine.db(opts.database || 'tigo_lambda_log');
    // set up plugin obj
    const faasLog = {
      db: database,
      createLogger: (lambdaId) => new LambdaLogger(app, database, lambdaId),
      getLambdaId,
      maxTimeSpan: opts.maxTimeSpan || 1000 * 60 * 60 * 24  // 1 day
    };
    if (!app.tigo.faas.enabledFeats) {
      app.tigo.faas.enabledFeats = {};
    }
    app.tigo.faas.enabledFeats.log = true;
    app.tigo.faasLog = faasLog;
  },
};

module.exports = plugin;
