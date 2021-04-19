const path = require('path');
const App = require('../src/app');
const { getRuntimeConfig } = require('@tigojs/utils');
const logger = require('./utils/logger');

const serverDir = path.resolve(__dirname, '../');
const rc = getRuntimeConfig(serverDir);

const doMigrate = async () => {
  // start migration
  logger.info('Starting migration...');
  try {
    await Promise.all(
      Object.keys(app.model)
        .map((namespace) => {
          const models = app.model[namespace];
          if (typeof models !== 'object') {
            return null;
          }
          return Promise.all(
            Object.keys(app.model[namespace])
              .map((modelName) => {
                const model = app.model[namespace][modelName];
                if (typeof model.sync !== 'function') {
                  return null;
                }
                logger.info(`Migrating ${modelName} in ${namespace}.`);
                return model.sync({ alter: true });
              })
              .filter((item) => !!item)
          );
        })
        .filter((item) => !!item)
    );
    logger.info('Migration done.');
    process.exit(0);
  } catch (err) {
    logger.error('Failed to migrate data structure.', err);
    process.exit(-1);
  }
};

// main

logger.info('Initializing server instance...');
const app = new App(rc);
logger.info('Server instance has been initialized.');

doMigrate();
