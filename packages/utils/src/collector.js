const path = require('path');
const fs = require('fs');
const { killProcess } = require('./process');
const { pluginPackageExisted, getPluginNameByPackage } = require('./plugins');
const { registerController } = require('./controller');
const { MEMO_EXT_PATTERN, MEMO_BUFFER_EXT_PATTERN } = require('../constants/pattern');

const PRIORITY_OFFSET = 10000;

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
        return killProcess.call(this, 'controllerCollectError');
      }
      const instance = new Controller(this);
      instance._tigoName = path.basename(filePath, path.extname(filePath));
      registerController.call(this, instance);
      controller[instance._tigoName] = instance;
    } catch (err) {
      this.logger.error(`Reading controller script [${filename}] error.`);
      this.logger.error(err);
      return killProcess.call(this, 'controllerCollectError');
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
      const instance = new Service(this);
      if (!instance) {
        this.logger.error(`Reading service script [${filename}] error, object is empty.`);
        return killProcess.call(this, 'serviceCollectError');
      }
      instance._tigoName = path.basename(filePath, path.extname(filePath));
      services[instance._tigoName] = instance;
    } catch (err) {
      this.logger.error(`Reading service script [${filename}] error.`);
      this.logger.error(err);
      return killProcess.call(this, 'serviceCollectError');
    }
  });
  return services;
}

function collectModel(dirPath, e) {
  const models = {};

  // compatible with direct pass
  const engine = typeof e === 'string' ? this.dbEngine.sql[e] : e;
  if (!engine || typeof engine !== 'object') {
    this.logger.error(`Database engine is not found.`);
    return killProcess.call(this, 'modelCollectError');
  }

  if (!fs.existsSync(dirPath)) {
    this.logger.error(`Model directory [${dirPath}] does not exist.`);
    return killProcess.call(this, 'modelCollectError');
  }

  const files = fs.readdirSync(dirPath);
  files.forEach((filename) => {
    const filePath = path.resolve(dirPath, filename);
    try {
      const defineFunc = require(filePath);
      if (!defineFunc) {
        this.logger.error(`Reading model script [${filename}] error, function is empty.`);
        return killProcess.call(this, 'modelCollectError');
      }
      const instance = defineFunc.call(null, this, engine);
      if (!instance) {
        this.logger.error(`Create model instance [${filename}] failed.`);
        return killProcess.call(this, 'modelCollectError');
      }
      instance._tigoName = path.basename(filePath, path.extname(filePath));
      models[instance._tigoName] = instance;
    } catch (err) {
      this.logger.error('Collecting model failed.');
      this.logger.error(err);
      return killProcess.call(this, 'modelCollectError');
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
        return killProcess.call(this, 'middlewareCollectError');
      }
      middlewares.push(middleware);
    } catch (err) {
      this.logger.error(`Something was wrong when collecting middleware [${filename}]`);
      this.logger.error(err);
      return killProcess.call(this, 'middlewareCollectError');
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
  return middlewares;
}

function getStaticFile({ path, useMemo = false, ext }) {
  const textMemo = MEMO_EXT_PATTERN.test(ext);
  const bufferMemo = MEMO_BUFFER_EXT_PATTERN.test(ext);
  const canMemo = textMemo || bufferMemo;
  if (!useMemo || !canMemo) {
    return path;
  }
  if (textMemo) {
    return fs.readFileSync(path, { encoding: 'utf-8' });
  } else {
    return fs.readFileSync(path);
  }
}

function collectStaticFiles(dirPath, first = true) {
  const staticConfig = {
    memo: false,
  };

  if (this.config?.static) {
    Object.assign(staticConfig, this.config.static);
  }

  const statics = {};

  if (!fs.existsSync(dirPath)) {
    this.logger.warn(`Directory [${dirPath}] does not exist.`);
    return statics;
  }
  const { memo: useMemo } = staticConfig;
  first && this.logger.warn(useMemo ? 'Using memory mode for static files.' : 'Using stream mode for static files.');

  const files = fs.readdirSync(dirPath);
  files.forEach((filename) => {
    const filePath = path.resolve(dirPath, filename);
    const fileStat = fs.statSync(filePath);
    // is directory
    if (fileStat.isDirectory()) {
      const ret = collectStaticFiles.call(this, filePath, false);
      Object.keys(ret).forEach((key) => {
        if (!statics[key]) {
          statics[key] = {};
        }
        Object.assign(statics[key], ret[key]);
      });
      return;
    }
    // is file
    const originExt = path.extname(filePath);
    const ext = originExt.toLowerCase().substr(1);
    const base = path.basename(filePath, originExt);
    if (!statics[ext]) {
      statics[ext] = {};
    }
    statics[ext][base] = getStaticFile({ path: filePath, useMemo, ext });
  });

  return statics;
}

function collectPlugins() {
  const { plugins: pluginsConfig } = this.config;
  const plugins = {};

  if (!pluginsConfig) {
    this.logger.warn('Plugins config was not found.');
    return plugins;
  }

  Object.keys(pluginsConfig).forEach((pluginName, index) => {
    this.logger.setPrefix(pluginName);
    const { package: packageName, enable } = pluginsConfig[pluginName];
    if (enable === false) {
      // only when enable is false, skip it
      this.logger.warn(`${pluginName} has been disabled in your configuration, skipped.`);
      return;
    }
    if (!packageName) {
      this.logger.warn(`Package name of plugin was not set.`);
      return;
    }
    // if existed, skip
    if (plugins[pluginName]) {
      return;
    }
    // if not existed, import
    try {
      plugins[pluginName] = require(packageName);
    } catch (err) {
      this.logger.error(`Import plugin failed.`);
      this.logger.error(err);
      return killProcess.call(this, 'pluginCollectError');
    }
    if (!plugins[pluginName].name) {
      plugins[pluginName].name = pluginName;
    }
    if (!plugins[pluginName].package) {
      plugins[pluginName].packageName = packageName;
    }
    // plugins priority: lower first
    if (plugins[pluginName].type === 'dbEngine') {
      plugins[pluginName].priority = (index + 1) * 100;
    } else {
      plugins[pluginName].priority = PRIORITY_OFFSET + (index + 1) * 100;
    }
    plugins[pluginName].config = {
      ...plugins[pluginName].config,
      ...pluginsConfig[pluginName].config,
    };
    collectPluginDependencies.call(this, {
      pluginsConfig,
      plugins,
      pluginName,
      plugin: plugins[pluginName],
      dependencies: plugins[pluginName].dependencies,
    });
  });

  this.logger.setPrefix(null);
  return plugins;
}

function reorderPluginDependenciesPriority({ pluginsConfig, plugins, plugin }) {
  if (
    !plugin.dependencies ||
    !plugin.dependencies.length ||
    !Array.isArray(plugins.dependencies)
  ) {
    return;
  }
  plugin.dependencies.forEach((packageName, index) => {
    const dependencyName = getPluginNameByPackage(pluginsConfig, packageName);
    if (plugins[dependencyName].priority < plugin.priority) {
      return;
    }
    plugins[dependencyName].priority = plugin.priorityBase - plugin.dependencies.length + index;
  });
}

function collectPluginDependencies({ pluginsConfig, plugins, plugin, pluginName, dependencies }) {
  if (!dependencies || !Array.isArray(dependencies)) {
    return;
  }
  // require existed
  dependencies.forEach((dependency, index) => {
    const isObject = typeof dependency === 'object';
    let packageName;
    if (isObject) {
      packageName = dependency.package;
    } else if (typeof dependency === 'string') {
      packageName = dependency;
    } else {
      this.logger.error(`Plugin contains contains an unrecognized dependency.`);
      this.logger.error(err);
      return killProcess.call(this, 'pluginCollectError');
    }
    const priority = (plugin.priorityBase || plugin.priority) - dependencies.length + index;
    const dependencyName = getPluginNameByPackage(pluginsConfig, packageName) || packageName.replace('@tigojs/', '');
    // check if imported
    if (pluginPackageExisted(plugins, packageName)) {
      if (plugins[dependencyName].priority && plugins[dependencyName].priority >= plugin.priority) {
        plugins[dependencyName].priority = priority;
        plugins[dependencyName].priorityBase = plugin.priority - dependencies.length;
      }
      reorderPluginDependenciesPriority({ pluginsConfig, plugins, plugin: plugins[dependencyName] });
      return;
    } else if (isObject && !dependency.allowAutoImport) {
      // if the dependency is only allowed to be imported manually, exit
      this.logger.error(`Dependency [${packageName}] needs to be imported manually.`);
    } else {
      this.logger.warn(`Try to import [${packageName}] automatically by default.`);
    }
    // import dependency
    this.logger.setPrefix(dependencyName);
    try {
      plugins[dependencyName] = require(packageName);
    } catch (err) {
      // load plugin dependency err
      this.logger.error(`Load dependency [${packageName}] failed.`);
      this.logger.error(err);
      return killProcess.call(this, 'pluginCollectError');
    }
    if (!plugins[dependencyName].name) {
      plugins[dependencyName].name = dependencyName;
    }
    if (!plugins[dependencyName].package) {
      plugins[dependencyName].packageName = packageName;
    }
    plugins[dependencyName].priority = priority;
    if (pluginsConfig[dependencyName]) {
      const { config: dependencyConfig } = pluginsConfig[dependencyName];
      plugins[dependencyName].config = {
        ...plugins[dependencyName].config,
        ...dependencyConfig,
      };
    }
    collectPluginDependencies.call(this, pluginsConfig, plugins, plugins[dependencyName], plugins[dependencyName].dependencies);
    this.logger.setPrefix(pluginName);
  });
  this.logger.setPrefix(pluginName);
}

module.exports = {
  collectMiddleware,
  collectController,
  collectService,
  collectModel,
  collectStaticFiles,
  collectPlugins,
};
