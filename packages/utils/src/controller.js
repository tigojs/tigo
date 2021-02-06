function registerController(instance) {
  if (!instance) {
    this.logger.warn(`Cannot register controller [${instance._tigoName}] because the instance is empty.`);
    return;
  }
  if (!instance.getRoutes || typeof instance.getRoutes !== 'function') {
    this.logger.warn(`Controller [${instance._tigoName}] doesn't contain the getRoutes function.`)
    return;
  }
  let { router: routerConfig } =  this.config;
  routerConfig = routerConfig || {};
  let { internal: internalConfig, external: externalConfig } = routerConfig;
  internalConfig = internalConfig || {};
  externalConfig = externalConfig || {};
  const routes = instance.getRoutes();
  Object.keys(routes).forEach((path) => {
    const info = routes[path];
    if (info.cond && typeof info.cond === 'function') {
      if (!info.cond()) {
        return;
      }
    }
    let realPath;
    if (info.external && !info.internal) {
      realPath = `${externalConfig.base || ''}${path}`;
    } else {
      realPath = `${internalConfig.base || '/api'}${path}`;
    }
    const type = info.type.toLowerCase();
    if (this.tigo.auth && info.auth) {
      this.router[type](realPath, this.tigo.auth.verify, info.target);
    } else {
      this.router[type](realPath, info.target);
    }
    this.logger.debug(`Registered route [${type.toUpperCase()}: ${realPath}] of [${instance._tigoName}] controller.`);
  });
}

module.exports = {
  registerController,
};
