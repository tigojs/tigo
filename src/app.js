const Koa = require('koa');
const Logger = require('./utils/logger');

class App {
  constructor(config) {
    // init koa server
    this.server = Koa();
    this.initServer();
    // set config
    this.config = config;
    // init logger
    this.logger = Logger(config.logger);
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

  }
  initPlugins() {
    if (!this.plugins) {
      this.logger.warn('No plugins were found.');
    }

  }
}

module.exports = App;
