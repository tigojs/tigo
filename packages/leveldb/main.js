const openDatabase = require("./src/level");

const plugin = {
  type: 'dbEngine',
  mount(app, config) {
    const db = openDatabase(app, config);
    app.dbEngine.leveldb = db;
    app.kvDbEngine.push('leveldb');
    app.server.leveldb = db;
    app.server.context.leveldb = db;
  }
};

module.exports = plugin;
