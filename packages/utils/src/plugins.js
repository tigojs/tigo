function pluginPackageExisted(packageName) {
  if (!this) {
    return false;
  }
  Object.keys(this).forEach((name) => {
    const { package } = this[name];
    if (package && package === packageName) {
      return true;
    }
  });
  return false;
}

function getPluginConfig(app) {
  if (!app || !app.tigo || !app.tigo.config) {
    app.logger && app.logger.error(`[util:plugin] Cannot get plugin config.`);
  }
  return app.tigo.config.plugins;
}

function getPublicPluginList(app) {
  return Object.keys(app.plugins)
    .filter((k) => app.plugins[k].type === 'module')
    .map((k) => app.plugins[k].packageName);
}

module.exports = {
  pluginPackageExisted,
  getPluginConfig,
  getPublicPluginList,
};
