const Koa = require('koa');
const Router = require('koa-rapid-router');
const bodyParser = require('koa-bodyparser');
const { createLogger } = require('./utils/logger');
const {
  collectMiddleware,
  collectPages,
  collectPlugins,
} = require('./utils/collector');
const { killProcess } = require('./utils/process');

function initServer(server) {
  const tigo = {
    config: Object.freeze({
      server: {
        host: this.config.host,
        port: this.config.port,
      },
    }),
    pages: collectPages.apply(this),
  };
  // init koa plugins
  this.server.use(bodyParser);
  this.server.use(this.router.Koa());
  // init middlewares
  const middlewares = collectMiddleware.apply(this);
  middlewares.forEach((middleware) => {
    server.use(middleware);
  });
  // init plugins
  const plugins = collectPlugins.call(this);
  Object.keys(plugins).forEach((name) => {
    if (typeof plugins[name].mount !== 'function') {
      this.logger.error(`Plugin [${name}] doesn't have mount function.`);
      return killProcess.call(this, 'pluginInstallError');
    }
    plugins[name].mount.call(this);
  });
  // add tigo obj to server
  server.tigo = tigo;
  server.context.tigo = tigo;
}

class App {
  constructor(config) {
    // init logger
    this.logger = createLogger(config.logger);
    // init config
    this.config = config;
    // init koa server
    this.server = new Koa();
    this.router = new Router();
    initServer.call(this, this.server);
  }
  start() {
    const { port } = this.config;
    this.server.listen(port);
    this.logger.info(`Server is listening on [${port}]...`);
  }
}

module.exports = App;
