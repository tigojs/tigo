class LocalStorageEngine {
  constructor(app, config) {
    app.logger.setPrefix('oss-local');
    // init kv database engine
    let kvEngine;
    this.app = app;
    this.config = config;
    app.logger.setPrefix(null);
  }
}

module.exports = LocalStorageEngine;
