function pluginPackageExisted(plugins, packageName) {
  if (!plugins) {
    return false;
  }
  const names = Object.keys(plugins);
  for (const name of names) {
    const { packageName: package } = plugins[name];
    if (package && package === packageName) {
      return true;
    }
  }
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

function getPluginNameByPackage(pluginConfig, packageName) {
  if (!pluginConfig) {
    return null;
  }
  if (typeof pluginConfig !== 'object') {
    throw new Error('Plugin config should be an object.');
  }
  const keys = Object.keys(pluginConfig);
  for (let key of keys) {
    const plugin = pluginConfig[key];
    if (plugin.package === packageName) {
      return key;
    }
  }
  return null;
}

module.exports = {
  pluginPackageExisted,
  getPluginConfig,
  getPublicPluginList,
  getPluginNameByPackage,
};
