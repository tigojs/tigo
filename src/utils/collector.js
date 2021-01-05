const path = require('path');
const fs = require('fs');
const { killProcess } = require('../utils/process');
const { pluginPackageExisted } = require('./plugins');
const { registerController } = require('./controller');

const controllerDir = path.resolve(__dirname, '../controller');
const middlewareDir = path.resolve(__dirname, '../middleware');
const pageDir = path.resolve(__dirname, '../pages');

function collectController(dirPath) {
  const actualDirPath = dirPath || controllerDir;
  const controller = {};
  if (!fs.existsSync(actualDirPath)) {
    this.logger.warn(`Controller directory ${actualDirPath} does not exist.`);
    return controller;
  }
  const files = fs.readdirSync(actualDirPath);
  files.forEach((filename) => {
    const filePath = path.resolve(actualDirPath, filename);
    try {
      const Controller = require(filePath);
      if (!Controller) {
        this.logger.warn(`Reading controller script [${filename}] error, object is empty.`);
        return;
      }
      const instance = new Controller();
      registerController.call(this, instance);
      controller[instance.name] = instance;
    } catch (err) {
      this.logger.error(`Reading controller script [${filename}] error.`);
      this.logger.error(err);
      killProcess.call(this, 'controllerCollectError');
    }
  });
  return controller;
}

function collectMiddleware(dirPath) {
  const actualDirPath = dirPath || middlewareDir;
  const middlewares = [];
  if (!fs.existsSync(actualDirPath)) {
    this.logger.warn(`Middleware directory ${actualDirPath} does not exist.`);
    return middlewares;
  }
  const files = fs.readdirSync(actualDirPath);
  files.forEach((filename) => {
    const filePath = path.resolve(actualDirPath, filename);
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


function collectPages(dirPath) {
  const actualDirPath = dirPath || pageDir;
  const pages = {};
  if (!fs.existsSync(actualDirPath)) {
    this.logger.warn(`Pages directory ${actualDirPath} does not exist.`);
    return pages;
  }
  const files = fs.readdirSync(actualDirPath);
  files.forEach((filename) => {
    const filePath = path.resolve(actualDirPath, filename);
    try {
      const page = fs.readFileSync(filePath, { encoding: 'utf-8' });
      if (!page) {
        this.logger.warn(`Reading page file [${filename}] error, page file is empty.`);
        return;
      }
      pages[path.basename(filePath, path.extname(filePath))];
    } catch (err) {
      this.logger.error(`Something was wrong when collecting page [${filename}]`);
      this.logger.error(err);
      killProcess.call(this, 'singlePageCollectError');
    }
  });
  return pages;
}

function collectPlugins() {
  const { plugins: pluginsConfig } = this.config;
  const plugins = {};

  if (!pluginsConfig) {
    this.logger.warn('Plugins config was not found.');
    return plugins;
  }

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
      killProcess.call(this, 'pluginCollectError');
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
    const dependencyName = getPluginNameByPackage.call(pluginsConfig, package) || package.replace('@tigo/', '');
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

module.exports = {
  collectMiddleware,
  collectController,
  collectPages,
  collectPlugins,
};
