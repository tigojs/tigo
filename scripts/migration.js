const path = require('path');
const App = require('../src/app');
const { getRuntimeConfig } = require('@tigojs/utils');
const logger = require('./utils/logger');

const serverDir = path.resolve(__dirname, '../');
const rc = getRuntimeConfig(serverDir);

logger.info('Initializing server instance...');
const app = new App(rc);
logger.info('Server instance');

// start migration
logger.info('Starting migration...');
Object.keys(app.model).forEach((namespace) => {
  const models = app.model[namespace];
  if (typeof models === 'object') {
    Object.keys(app.model[namespace]).forEach((modelName) => {
      const model = app.model[namespace][modelName];
      if (typeof model.sync === 'function') {
        logger.info(`Migrating ${modelName} in ${namespace}.`);
        model.sync({ alter: true });
      }
    });
  }
});
logger.info('Migration done.');
