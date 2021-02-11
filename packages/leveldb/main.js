const openDatabase = require("./src/level");

const plugin = {
  type: 'dbEngine',
  mount(app) {
    app.dbEngine.leveldb = {
      open: openDatabase,
    };
    app.kvDbEngine.push('leveldb');
  }
};

module.exports = plugin;
