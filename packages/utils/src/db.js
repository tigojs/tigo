const engineTypes = ['kv', 'sql', 'mongodb'];
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
  if (!app.dbEngine[engineType]) {
    app.dbEngine[engineType] = {};
  }
  app.dbEngine[engineType][name] = engine;
}

// extend kv db wrapped by levelup
function extendLevelDb(db) {
  // extend
  db.set = db.put;
  db.hasObject = async (key) => {
    let obj;
    try {
      obj = await db.getObject(key);
    } catch (err) {
      if (err.notFound) {
        return false;
      }
      throw err;
    }
    if (!obj) {
      return false;
    }
    return true;
  }
  db.putObject = async (key, value) => {
    return await db.put(key, JSON.stringify(value));
  }
  db.setObject = db.putObject;
  db.getObject = async (key) => {
    try {
      const obj = await db.get(key, {
        asBuffer: false,
      });
      return JSON.parse(obj) || null;
    } catch (err) {
      if (err.notFound) {
        return null;
      }
      throw err;
    }
  }
  db.setExpires = (key, data, expires) => {
    if (typeof expires !== 'number') {
      throw new Error('Expires must be a number');
    }
    if (expires <= 0) {
      return;
    }
    return db.setObject(key, {
      expires,
      value: data,
      createAt: new Date().valueOf(),
    });
  }
  db.getExpires = async (key) => {
    const stored = await db.getObject(key);
    if (!stored) {
      return null;
    }
    const { value, createAt, expires } = stored;
    if (createAt + expires < new Date().valueOf()) {
      await db.del(key);
      return null;
    }
    return value;
  }
  return db;
}

function getTablePrefix(app) {
  return (app.config.db ? app.config.db.prefix : 'tigo') || 'tigo';
}

module.exports = {
  registerDbEngine,
  extendLevelDb,
  getTablePrefix,
};
