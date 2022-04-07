const memwatch = require('node-memwatch-new');
const heapdump = require('heapdump');
const path = require('path');
const fs = require('fs');

const plugin = {
  mount(app) {
    const snapshotDir =  path.resolve(app.config.runDirPath, './snapshots');
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }
    memwatch.on('leak', () => {
      heapdump.writeSnapshot(path.resolve(snapshotDir, `./${Date.now()}.heapsnapshot`), (err, fileName) => {
        if (err) {
          app.logger.error('Failed to save heap snapshot.', err);
        }
        app.logger.info(`Memory leak detected, snapshot has saved to ${fileName}`);
      });
    });
  },
};

module.exports = plugin;
