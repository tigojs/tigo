const { registerDbEngine } = require('@tigojs/utils');
const openDatabase = require("./src/level");

const plugin = {
  type: 'dbEngine',
  mount(app) {
    registerDbEngine(app, {
      engine: {
        openDatabase,
      },
      name: 'leveldb',
      engineType: 'kv',
      storageType: 'local',
    });
  }
};

module.exports = plugin;
