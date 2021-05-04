const LambdaLogger = require('./src/utils/logger');
const getLambdaId = require('./src/utils/log');

const plugin = {
  type: 'module',
  dependencies: ['@tigojs/faas'],
  mount(app, opts) {
    // get mongodb engine
    let engine;
    if (opts.mongoEngine) {
      engine = app.dbEngine.mongodb[opts.mongoEngine];
      if (!engine) {
        throw new Error('Cannot find the specific MongoDB engine.');
      } else {
        if (!app.dbEngine.mongodb.length) {
          throw new Error('Cannot find any available MongoDB engine.');
        }
        engine = app.dbEngine.mongodb[0];
      }
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
    app.tigo.faas.enabledFeats.lambdaLog = true;
    app.tigo.faasLog = faasLog;
  },
};

module.exports = plugin;
