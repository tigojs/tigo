function registerRoute({ path, type, info }) {
  if (this.tigo.auth && info.auth) {
    this.router[type](path, this.tigo.auth.verify, info.target);
  } else if (this.tigo.auth && info.apiAccess) {
    this.router[type](path, this.tigo.auth.apiVerify, info.target);
  } else {
    this.router[type](path, info.target);
  }
}

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
    const type = info.type;
    if (Array.isArray(type)) {
      type.forEach((t) => {
        registerRoute({
          path: realPath,
          type: t.toLowerCase(),
          info,
        });
      });
    } else if (typeof type === 'string') {
      registerRoute({
        path: realPath,
        type: type.toLowerCase(),
        info,
      });
    }
    this.logger.debug(`Registered route [${type.toUpperCase()}: ${realPath}] of [${instance._tigoName}] controller.`);
  });
}

module.exports = {
  registerController,
};
