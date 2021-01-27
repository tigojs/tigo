const path = require('path');
const fs = require('fs');
const {
  collectController,
  collectService,
} = require('@tigo/utils');

const CONTROLLER_DIR = path.resolve(__dirname, './src/controller');
const SERVICE_DIR = path.resolve(__dirname, './src/service');

const plugin = {
  dependencies: [
    {
      package: '@tigo/faas',
      allowAutoImport: false,
    },
  ],
  mount(app, config) {
    // check storage path
    let storagePath;
    if (config.storagePath) {
      if (!fs.existsSync(config.storagePath)) {
        throw new Error('Storage path for FaaS resources does not exist.');
      }
      storagePath = config.storagePath;
    } else {
      storagePath = path.resolve(app.config.runDirPath, './faas-resource');
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath);
      }
      app.logger.warn('Use default path for FaaS resources.');
    }
    // set flag
    app.tigo.faas.resourcePath = storagePath;
    app.tigo.faas.resourcePackEnabled = true;
    // collect controller and service
    const controllers = collectController.call(this, CONTROLLER_DIR);
    const services = collectService.call(this.SERVICE_DIR);
    Object.assign(app.controller.faas, controllers);
    Object.assign(app.services, services);
  },
};

module.exports = plugin;
