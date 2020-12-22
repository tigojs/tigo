const Koa = require('koa');
const { createLogger } = require('./utils/logger');
const { collectMiddleware } = require('./utils/collector');

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
    // add things to context
    this.server.context.config = {
      server: {
        host: this.config.host,
        port: this.config.port,
      },
      plugins: this.config.plugins,
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
