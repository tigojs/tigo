const { MongoClient } = require('mongodb');
const { registerDbEngine } = require('@tigojs/utils');

const plugin = {
  type: 'dbEngine',
  async mount(app, opts) {
    if (!opts.uri) {
      throw new Error('You should set the uri for create a mongodb connection.');
    }
    // create client
    const client = new MongoClient(opts.uri, opts.connectorOptions || {});
    try {
      await client.connect();
    } catch (err) {
      await client.close();
      throw err;
    }
    registerDbEngine(app, {
      engine: client,
      name: 'tmongo',
      engineType: 'mongodb',
      storageType: 'network',
    });
  },
};

module.exports = plugin;
