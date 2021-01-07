function hasDbEngine(app) {
  return Object.keys(app.dbEngine) > 0;
}

function hasSqlDbEngine(app) {
  return !!app.sqlDbEngine.length;
}

function hasKvDbEngine(app) {
  return !!app.kvDbEngine.length;
}

module.exports = {
  hasDbEngine,
  hasSqlDbEngine,
  hasKvDbEngine,
};
