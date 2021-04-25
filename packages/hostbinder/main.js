const path = require('path');
const fs = require('fs');
const {
  collectController,
  collectModel,
} = require('@tigojs/utils');
const redbird = require('@backrunner/redbird');
const { constants } = require('crypto');

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
    if (opts.engine) {
      const engine = app.dbEngine.sql[opts.engine];
      if (!engine) {
        throw new Error('Cannot find the specific SQL database engine.');
      }
      sqlEngine = engine;
    } else {
      const keys = Object.keys(app.dbEngine.sql);
      if (!keys.length) {
        throw new Error('Cannot find avaliable SQL database engine.');
      }
      sqlEngine = app.dbEngine.sql[keys[0]];
      app.logger.warn(`Use SQL database engine [${sqlEngine.name}] by default`);
    }
    // init redbird
    const redbirdOpts = {
      port: opts.port || 80,
      xfwd: true,
      logger: app.logger,
    };
    if (opts.https !== false) {
      let certPath;
      if (opts.certPath) {
        if (fs.existsSync(opts.certPath)) {
          certPath = opts.certPath;
        } else {
          throw new Error('Path to store certs does not exist.');
        }
      } else {
        app.logger.warn('Use default cert storage path.');
        certPath = path.resolve(app.config.runDirPath, './hostbinder/certs');
        if (!fs.existsSync(certPath)) {
          fs.mkdirSync(certPath, { recursive: true });
        }
      }
      if (!opts.leEmail) {
        throw new Error("You should set an email address for let's encrypt.");
      }
      Object.assign(redbirdOpts, {
        letsencrypt: {
          path: certPath,
          port: opts.leMinimalPort || 24292,
        },
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
      unlocked: !!opts.unlock,
      useHttps: opts.https !== false ? {
        letsencrypt: {
          email: opts.leEmail,
          production: process.env.NODE_ENV !== 'dev',
        },
        secureOptions: constants.SSL_OP_NO_SSLv2 | constants.SSL_OP_NO_SSLv3,
      }: false,
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
        const targetPath = `http://127.0.0.1:${app.tigo.config.server.port}${item.target}`;
        app.tigo.hostbinder.proxy.register(item.domain, targetPath, { ssl: app.tigo.hostbinder.useHttps });
      });
    }
  }
};

module.exports = plugin;
