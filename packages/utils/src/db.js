const engineTypes = ['kv', 'sql'];
const storageTypes = ['local', 'network'];

function registerDbEngine(app, {
  name,
  engine,
  engineType,
  storageType,
}) {
  if (!name || !engine || !engineType || !storageType) {
    throw new Error('Cannot register the database engine because of the invalid arguments');
  }
  if (!engineTypes.includes(engineType)) {
    throw new Error('engineType is invalid');
  }
  if (!storageTypes.includes(storageType)) {
    throw new Error('storageType is invalid');
  }
  if (app.dbEngine[engineType][name]) {
    throw new Error(`Database engine [${name}] already existed`);
  }
  Object.assign(engine, {
    name,
    engineType,
    storageType,
  });
  app.dbEngine[engineType][name] = engine;
}

function getTablePrefix(app) {
  return (app.config.db ? app.config.db.prefix : 'tigo') || 'tigo';
}

module.exports = {
  registerDbEngine,
  getTablePrefix,
};
