const Koa = require('koa');
const { createLogger } = require('./utils/logger');
const { collectMiddleware } = require('./utils/collector');

class App {
  constructor(config) {
    // init logger
    this.logger = createLogger(config.logger);
    // init koa server
    this.server = new Koa();
    this.initServer();
    // set config
    this.config = config;
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
