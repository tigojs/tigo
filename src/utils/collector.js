const path = require('path');
const fs = require('fs');
const { killProcess } = require('../utils/process');
const {
  pluginPackageExisted
} = require('./plugins');

const middlewareDir = path.resolve(__dirname, '../middleware');
const pageDir = path.resolve(__dirname, '../pages');

function collectMiddleware() {
  const files = fs.readdirSync(middlewareDir);
  const middlewares = [];
  files.forEach((filename) => {
    const filePath = path.resolve(middlewareDir, filename);
    try {
      const middleware = require(filePath);
      if (!middleware) {
        this.logger.warn(`Reading middleware script [${filename}] error, object is empty.`);
        return;
      }
      middlewares.push(middleware);
    } catch (err) {
      this.logger.error(`Something was wrong when collecting middleware [${filename}]`);
      this.logger.error(err);
      killProcess.call(this, 'middlewareCollectError');
    }
  });
  // middleware priority: higher first
  middlewares.sort((a, b) => {
    if (a.priority < b.priority) {
      return 1;
    }
    if (a.priority > b.priority) {
      return -1;
    }
    return 0;
  });
  return middlewares.map(m => m.install);
}

function collectPlugins() {
  const { plugins: pluginsConfig } = this.config;
  if (!pluginsConfig) {
    this.logger.warn('Plugins config was not found.');
    return;
  }
  const plugins = {};
  Object.keys(pluginsConfig).forEach((pluginName, index) => {
    const { package } = pluginsConfig[pluginName];
    if (!package) {
      this.logger.warn(`Package name of plugin [${pluginName}] was not set.`);
      return;
    }
    // if existed, skip
    if (plugins[pluginName]) {
      return;
    }
    // if not existed, import
    try {
      plugins[pluginName] = require(pluginName);
    } catch (err) {
      this.logger.error(`Import plugin [${pluginName}] failed.`);
      this.logger.error(err);
      return;
    }
    // plugins priority: lower first
    plugins[pluginName].priority = (index + 1) * 100;
    plugins[pluginName].config = {
      ...plugins[pluginName].config,
      ...pluginsConfig[pluginName].config,
    };
    collectPluginDependencies.call(
      this,
      pluginsConfig,
      plugins,
      plugins[pluginName],
      plugins[pluginName].dependencies,
    );
  });
  return plugins;
}

function collectPluginDependencies(
  pluginsConfig,
  plugins,
  plugin,
  dependencies
) {
  if (!dependencies || !Array.isArray(dependencies)) {
    return;
  }
  // require existed
  dependencies.forEach((package, index) => {
    const priority = plugin.priority - dependencies.length + index;
    const dependencyName = getPluginNameByPackage.call(pluginsConfig, package) || package;
    // check if imported
    if (pluginPackageExisted.apply(plugins)) {
      plugins[dependencyName].priority = priority;
      return;
    }
    // import dependency
    try {
      plugins[dependencyName] = require(package);
    } catch (err) {
      // load plugin dependency err
      this.logger.error(`Load dependency [${package}] of plugins [${pluginName}] failed.`);
      this.logger.error(err);
      killProcess.call(this, 'pluginCollectError');
    }
    plugins[dependencyName].priority = priority;
    if (pluginsConfig[dependencyName]) {
      const { config: dependencyConfig } = pluginsConfig[dependencyName];
      plugins[dependencyName].config = {
        ...plugins[dependencyName].config,
        ...dependencyConfig,
      };
    }
    collectPluginDependencies.call(
      this,
      pluginsConfig,
      plugins,
      plugins[dependencyName],
      plugins[dependencyName].dependencies,
    );
  });
}

function collectPages() {
  const files = fs.readdirSync(pageDir);
  const pages = {};
  files.forEach((filename) => {
    const filePath = path.resolve(pageDir, filename);
    try {
      const page = fs.readFileSync(filePath, { encoding: 'utf-8' });
      if (!page) {
        this.logger.warn(`Reading page file [${filename}] error, object is empty.`);
        return;
      }
      pages[path.basename(filePath, path.extname(filePath))];
    } catch (err) {
      this.logger.error(`Something was wrong when collecting page [${filename}]`);
      this.logger.error(err);
      killProcess('singlePageCollectError');
    }
  });
  return pages;
}

module.exports = {
  collectMiddleware,
  collectPlugins,
  collectPages,
};
