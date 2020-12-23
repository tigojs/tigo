const Koa = require('koa');
const { createLogger } = require('./utils/logger');
const { collectMiddleware, collectPages } = require('./utils/collector');

class App {
  constructor(config) {
    // init logger
    this.logger = createLogger(config.logger);
    // init config
    this.config = config;
    // init koa server
    this.server = new Koa();
    this.initServer();
    // init plugins
    this.plugins = config.plugins;
    this.initPlugins();
  }
  start() {
    const { port } = this.config;
    this.server.listen(port);
    this.logger.info(`Server is listening on [${port}]...`);
  }
  initServer() {
    // collect pages
    const pages = collectPages.apply(this);
    // add things to context
    this.server.tigo = {
      config: {
        server: {
          host: this.config.host,
          port: this.config.port,
        },
        plugins: this.config.plugins,
      },
      pages,
    };
    // set middlewares
    const middlewares = collectMiddleware.apply(this);
    middlewares.forEach((middleware) => {
      this.server.use(middleware);
    });
  }
  initPlugins() {
    if (!this.plugins) {
      this.logger.warn('No plugins were found.');
    }
  }
}

module.exports = App;
