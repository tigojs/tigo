const LambdaLogger = require('./src/utils/logger');

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
    };
    app.tigo.faas.logServiceEnabled = true;
    app.tigo.faasLog = faasLog;
  },
};

module.exports = plugin;
