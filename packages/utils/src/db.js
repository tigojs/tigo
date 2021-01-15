function getTablePrefix(app) {
  return (app.config.db ? app.config.db.prefix : 'tigo') || 'tigo';
}

module.exports = {
  getTablePrefix,
};
