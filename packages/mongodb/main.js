const { MongoClient } = require('mongodb');

const plugin = {
  type: 'dbEngine',
  async mount(app, opts) {
    if (!opts.uri) {
      throw new Error('You should set the uri for create a mongodb connection.');
    }
    const connectorOpts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    if (opts.connectorOptions) {
      Object.assign(connectorOpts, opts.connectorOptions);
    }
    // create client
    const { useNewUrlParser, useUnifiedTopology } = connectorOpts;
    const client = new MongoClient(uri, {
      useNewUrlParser,
      useUnifiedTopology,
    });
    await client.connect();
    registerDbEngine(app, {
      engine: client,
      name: 'mongodb',
      engineType: 'mongodb',
      storageType: 'network',
    });
  },
};

module.exports = plugin;
