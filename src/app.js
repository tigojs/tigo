const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const { createLogger } = require('./utils/logger');
const {
  collectMiddleware,
  collectPages,
  collectPlugins,
} = require('./utils/collector');

function initServer(server) {
  const tigo = {
    config: Object.freeze({
      server: {
        host: this.config.host,
        port: this.config.port,
      },
    }),
    pages: Object.freeze(collectPages.apply(this)),
  };
  // init koa plugins
  this.server.use(bodyParser);
  // init middlewares
  const middlewares = collectMiddleware.apply(this);
  middlewares.forEach((middleware) => {
    server.use(middleware);
  });
  // init plugins
  const plugins = collectPlugins;
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
    initServer.call(this, server);
  }
  start() {
    const { port } = this.config;
    this.server.listen(port);
    this.logger.info(`Server is listening on [${port}]...`);
  }
}

module.exports = App;
