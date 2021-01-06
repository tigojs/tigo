const Koa = require('koa');
const Router = require('@pwp-app/koa-rapid-router');
const bodyParser = require('koa-bodyparser');
const koaLogger = require('koa-logger');
const { createLogger } = require('./utils/logger');
const { registerErrorHandler } = require('./utils/error');
const {
  collectMiddleware,
  collectPages,
  collectPlugins,
  collectController,
} = require('./utils/collector');
const { killProcess } = require('./utils/process');
const openDatabase = require('./db/level');

function initDb() {
  const db = openDatabase.call(this);
  this.server.db = db;
  this.server.context.db = db;
}

function initServer() {
  const tigo = {
    config: {
      server: {
        host: this.config.host,
        port: this.config.port,
      },
      plugins: this.config.plugins,
    },
    pages: collectPages.apply(this),
  };
  // init koa plugins
  this.server.use(bodyParser());
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
  this.server.use(this.routerContainer.Koa());
  // register error handler
  registerErrorHandler(this.server);
  // init middlewares
  const middlewares = collectMiddleware.apply(this);
  middlewares.forEach((middleware) => {
    if (!middleware) {
      this.logger.error(`Cannot accept a empty middleware.`);
      killProcess.call(this, 'middlewareCollectError');
    }
    this.server.use(middleware);
  });
  // add tigo obj to app, server and context
  this.tigo = tigo;
  this.server.tigo = tigo;
  this.server.context.tigo = tigo;
  this.server.logger = this.logger;
  this.server.context.logger = this.logger;
  // bind controller and service object to koa
  this.server.controller = this.controller;
  this.server.context.controller = this.controller;
  // init plugins
  const plugins = collectPlugins.call(this);
  Object.keys(plugins).forEach((name) => {
    if (typeof plugins[name].mount !== 'function') {
      this.logger.error(`Plugin [${name}] doesn't have mount function.`);
      return killProcess.call(this, 'pluginMountError');
    }
    try {
      plugins[name].mount.call(this, this, this.config.plugins[name].config);
      this.logger.debug(`Plugin [${name}] mounted.`);
    } catch (err) {
      this.logger.error(`Mount plugin [${name}] failed.`);
      this.logger.error(err);
      killProcess.call(this, 'pluginMountError');
    }
  });
  // init controller
  const controllers = collectController.call(this);
  this.controller = controllers;
}

class App {
  constructor(config) {
    // init logger
    this.logger = createLogger(config.logger);
    // init config
    this.config = config;
    // init koa server
    this.server = new Koa();
    this.routerContainer = new Router();
    const basePath = this.config.routeBase || '';
    this.router = this.routerContainer.create(basePath);
    this.logger.debug(`Using route base path: [${basePath}]`);
    // init db
    initDb.call(this);
    // init server
    initServer.call(this);
  }
  start() {
    const { port } = this.config;
    this.server.listen(port);
    this.logger.info(`Server is listening on port [${port}]...`);
  }
}

module.exports = App;
