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

function getPluginList(pluginConfig) {
  const list = [];
  Object.keys(pluginConfig).forEach((name) => {
    // return a list contains package name of plugins.
    list.push(pluginConfig[name].package);
  });
  return list;
}

module.exports = {
  pluginPackageExisted,
  getPluginConfig,
  getPluginList,
};
