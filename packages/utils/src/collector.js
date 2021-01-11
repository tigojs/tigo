const path = require('path');
const fs = require('fs');
const { killProcess } = require('./process');
const { pluginPackageExisted } = require('./plugins');
const { registerController } = require('./controller');

function collectController(dirPath) {
  const controller = {};
  if (!dirPath) {
    this.logger.error('Cannot find controller dir path.');
    return controller;
  }
  if (!fs.existsSync(dirPath)) {
    this.logger.error(`Controller directory [${dirPath}] does not exist.`);
    return controller;
  }
  const files = fs.readdirSync(dirPath);
  files.forEach((filename) => {
    const filePath = path.resolve(dirPath, filename);
    try {
      const Controller = require(filePath);
      if (!Controller) {
        this.logger.warn(`Reading controller script [${filename}] error, object is empty.`);
        killProcess.call(this, 'controllerCollectError');
        return;
      }
      const instance = new Controller(this);
      instance._tigoName = path.basename(filePath, path.extname(filePath));
      registerController.call(this, instance);
      controller[instance._tigoName] = instance;
    } catch (err) {
      this.logger.error(`Reading controller script [${filename}] error.`);
      this.logger.error(err);
      killProcess.call(this, 'controllerCollectError');
    }
  });
  if (Object.keys(controller).length > 0 && this.controller) {
    Object.assign(this.controller, controller);
  }
  return controller;
}

function collectService(dirPath) {
  const services = {};
  if (!fs.existsSync(dirPath)) {
    this.logger.warn(`Service directory [${dirPath}] does not exist.`);
    return services;
  }
  const files = fs.readdirSync(dirPath);
  files.forEach((filename) => {
    const filePath = path.resolve(dirPath, filename);
    try {
      const Service = require(filePath);
      const instance = new Service();
      if (!instance) {
        this.logger.error(`Reading service script [${filename}] error, object is empty.`);
        killProcess.call(this, 'serviceCollectError');
        return;
      }
      instance._tigoName = path.basename(filePath, path.extname(filePath));
      services[instance._tigoName] = instance;
    } catch (err) {
      this.logger.error(`Reading service script [${filename}] error.`);
      this.logger.error(err);
      killProcess.call(this, 'serviceCollectError');
    }
  });
  return services;
}

function collectModel(dirPath, engineName) {
  const models = {};

  const engine = this.dbEngine[engineName];
  if (!engine) {
    this.logger.error(`Database engine is not found.`);
    killProcess.call(this, 'modelCollectError');
    return;
  }

  if (!fs.existsSync(dirPath)) {
    this.logger.error(`Model directory [${dirPath}] does not exist.`);
    killProcess.call(this, 'modelCollectError');
    return;
  }

  const files = fs.readdirSync(dirPath);
  files.forEach((filename) => {
    const filePath = path.resolve(dirPath, filename);
    try {
      const defineFunc = require(filePath);
      if (!defineFunc) {
        this.logger.error(`Reading model script [${filename}] error, function is empty.`);
        killProcess.call(this, 'modelCollectError');
        return;
      }
      const instance = defineFunc.call(null, this, engine);
      if (!instance) {
        this.logger.error(`Create model instance [${filename}] failed.`);
        killProcess.call(this, 'modelCollectError');
        return;
      }
      instance._tigoName = path.basename(filePath, path.extname(filePath));
      models[instance._tigoName] = instance;
    } catch (err) {
      this.logger.error('Collecting model failed.');
      this.logger.error(err);
      killProcess.call(this, 'modelCollectError');
    }
  });

  return models;
}

function collectMiddleware(dirPath) {
  const middlewares = [];
  if (!fs.existsSync(dirPath)) {
    this.logger.warn(`Middleware directory [${dirPath}] does not exist.`);
    return middlewares;
  }
  const files = fs.readdirSync(dirPath);
  files.forEach((filename) => {
    const filePath = path.resolve(dirPath, filename);
    try {
      const middleware = require(filePath);
      if (!middleware) {
        this.logger.error(`Reading middleware script [${filename}] error, object is empty.`);
        killProcess.call(this, 'middlewareCollectError');
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
  const pages = {};

  if (!fs.existsSync(dirPath)) {
    this.logger.warn(`Pages directory ${dirPath} does not exist.`);
    return pages;
  }

  const files = fs.readdirSync(dirPath);
  files.forEach((filename) => {
    const filePath = path.resolve(dirPath, filename);
    try {
      const page = fs.readFileSync(filePath, { encoding: 'utf-8' });
      if (!page) {
        this.logger.error(`Reading page file [${filename}] error, page file is empty.`);
        killProcess.call(this, 'singlePageCollectError');
        return;
      }
      const name = path.basename(filePath, path.extname(filePath));
      pages[name] = page;
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
      plugins[pluginName] = require(package);
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
  collectService,
  collectModel,
  collectPages,
  collectPlugins,
};
