const path = require('path');
const fs = require('fs');
const {
  collectController,
  collectModel,
} = require('@tigojs/utils');
const redbird = require('@artcodestudio/redbird');

const CONTROLLER_DIR = path.resolve(__dirname, './src/controller');
const MODEL_DIR = path.resolve(__dirname, './src/model');

const plugin = {
  type: 'module',
  mount(app, opts) {
    if (!app.tigo.auth) {
      throw new Error('Cannot find any mounted authorization plugin.');
    }
    opts = opts || {};
    // get sql engine
    let sqlEngine;
    if (opts.dbEngine) {
      const engine = app.dbEngine[opts.dbEngine];
      if (!engine) {
        throw new Error('Cannot find the specific SQL database engine.');
      }
      sqlEngine = engine;
    }
    if (!sqlEngine) {
      if (app.sqlDbEngine.length) {
        const engineName = app.sqlDbEngine[0];
        app.logger.warn(`Use SQL database engine [${engineName}] by default`);
        sqlEngine = app.dbEngine[engineName];
      } else {
        throw new Error('Cannot find avaliable SQL database engine.');
      }
    }
    // init redbird
    let certPath;
    if (opts.certPath) {
      if (fs.existsSync(opts.certPath)) {
        certPath = opts.certPath;
      } else {
        throw new Error('Path to store certs does not exist.');
      }
    } else {
      app.logger.warn('Use default cert storage path.');
      certPath = path.resolve(app.config.runDirPath, './hostbinder/proxy');
      if (!fs.existsSync(certPath)) {
        fs.mkdirSync(certPath, { recursive: true });
      }
    }
    const redbirdOpts = {
      port: opts.port || 80,
      letsencrypt: {
        path: certPath,
        port: opts.leMinimalPort || 12131,
        production: process.env.NODE_ENV !== 'dev',
      },
      xfwd: true,
    };
    if (opts.ssl !== false) {
      Object.assign(redbirdOpts, {
        ssl: {
          http2: opts.http2 !== false ? true : false,
          port: opts.sslPort || 443,
        },
      });
    }
    app.logger.debug('Run redbird proxy server...');
    const proxy = redbird(redbirdOpts);
    // mount to app
    const pluginObj = {
      proxy,
    };
    app.tigo.hostbinder = pluginObj;
    // collect module files
    const controllers = collectController.call(app, CONTROLLER_DIR);
    const models = collectModel.call(app, MODEL_DIR, sqlEngine);
    app.controller.hostbinder = controllers;
    app.model.hostbinder = models;
  },
  async afterMount(app) {
    // init proxy table
    const bindings = await app.model.hostbinder.binding.findAll();
    if (Array.isArray(bindings) && bindings.length) {
      bindings.forEach((item) => {
        proxy.register(item.host, item.target);
      });
    }
  }
};

module.exports = plugin;
