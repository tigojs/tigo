const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const Koa = require('koa');
const TreeRouter = require('koa-tree-router');
const koaBody = require('koa-body');
const cors = require('koa-cors');
const koaLogger = require('koa-logger');
const compress = require('koa-compress');
const parameter = require('koa-parameter');
const {
  createLogger,
  registerErrorHandler,
  killProcess,
  collectMiddleware,
  collectStaticFiles,
  collectPlugins,
  collectController,
} = require('@tigojs/utils');
const packageJson = require('../package.json');

const CONTROLLER_DIR = path.resolve(__dirname, './controller');
const MIDDLWARE_DIR = path.resolve(__dirname, './middleware');
const STATIC_DIR = path.resolve(__dirname, './static');

function checkDirectory() {
  const runDirPath = path.resolve(__dirname, '../run');
  if (!fs.existsSync(runDirPath)) {
    fs.mkdirSync(runDirPath);
  }
}

function initServer() {
  const tigo = {
    version: packageJson.version,
    config: this.config,
  };
  // collect static files
  const static = collectStaticFiles.call(this, STATIC_DIR);
  this.static.main = static;
  // init koa plugins
  this.server.use(cors(this.config.cors || null));
  this.server.use(koaBody());
  this.server.use(compress({
    filter(type) {
      return /^text/i.test(type) || type === 'application/json';
    },
    threshold: 2048,
    flush: zlib.constants.Z_SYNC_FLUSH,
    br: (type) => {
      // we can be as selective as we can:
      if (/^image\//i.test(type)) return null;
      if (/^text\//i.test(type) || type === 'application/json') {
        return {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          [zlib.constants.BROTLI_PARAM_QUALITY]: 6,
        };
      }
      return { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 }
    }
  }));
  parameter(this.server);
  // dev koa plugins
  if (process.env.NODE_ENV === 'dev') {
    const accessLogEnabled = this.config.dev && this.config.dev.accessLog;
    if (accessLogEnabled) {
      this.server.use(koaLogger((str, args) => {
        this.logger.debug(str);
      }));
    }
  }
  // use router
  this.server.use(this.router.routes());
  // register error handler
  registerErrorHandler(this.server);
  // init middlewares
  const middlewares = collectMiddleware.call(this, MIDDLWARE_DIR);
  middlewares.forEach((middleware) => {
    if (!middleware) {
      this.logger.error(`Cannot accept an empty middleware.`);
      killProcess.call(this, 'middlewareCollectError');
    }
    const func = middleware.install(this);
    if (!func || typeof func !== 'function') {
      return;
    }
    this.server.use(func);
  });
  // add tigo obj to app, server and context
  this.tigo = tigo;
  this.server.tigo = tigo;
  this.server.context.tigo = tigo;
  this.server.logger = this.logger;
  this.server.context.logger = this.logger;
  this.server.dbEngine = this.dbEngine;
  this.server.sqlDbEngine = this.sqlDbEngine;
  this.server.kvDbEngine = this.kvDbEngine;
  // bind controller and service object to koa
  this.server.controller = this.controller;
  this.server.context.controller = this.controller;
  this.server.service = this.service;
  this.server.context.service = this.service;
  this.server.model = this.model;
  this.server.context.model = this.model;
  this.server.static = this.static;
  this.server.context.static = this.static;
  // init plugins
  const plugins = collectPlugins.call(this);
  Object.keys(plugins).forEach((name) => {
    this.logger.setPrefix(name);
    if (typeof plugins[name].mount !== 'function') {
      this.logger.error(`Plugin doesn't have mount function.`);
      return killProcess.call(this, 'pluginMountError');
    }
    try {
      plugins[name].mount.call(this, this, this.config.plugins[name].config);
      this.logger.debug(`Plugin mounted.`);
    } catch (err) {
      this.logger.error(`Mount pluginfailed.`);
      this.logger.error(err);
      killProcess.call(this, 'pluginMountError');
    }
  });
  this.logger.setPrefix(null);
  this.plugins = plugins;
  this.server.plugins = this.plugins;
  // init controller
  const controllers = collectController.call(this, CONTROLLER_DIR);
  this.controller.main = controllers;
}

class App {
  constructor(config) {
    // file system related check
    checkDirectory();
    // add root path
    this.rootDirPath = path.resolve(__dirname, '../');
    // init config
    this.config = config;
    this.config.runDirPath = path.resolve(__dirname, '../run');
    // init db related
    this.dbEngine = {};
    this.sqlDbEngine = [];
    this.kvDbEngine = [];
    // init base
    this.controller = {};
    this.service = {};
    this.model = {};
    this.static = {};
    // init logger
    this.logger = createLogger.call(this, this.config.logger);
    // init koa server
    this.server = new Koa();
    this.router = new TreeRouter();
    // init server
    initServer.call(this);
  }
  start() {
    const port = (this.config.server ? this.config.server.port : 8800) || 8800;
    this.server.listen(port);
    this.logger.info(`Server is listening on port [${port}]...`);
  }
}

module.exports = App;
