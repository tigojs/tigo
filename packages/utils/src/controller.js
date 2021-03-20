const noStoreMiddleware = async (ctx, next) => {
  await next();
  ctx.set('Cache-Control', 'no-store');
};

function registerRoute({ path, type, info }) {
  const args = [path];
  if (this.tigo.auth && info.apiAccess) {
    args.push(this.tigo.auth.apiFlag, this.tigo.auth.verifier);
  } else if (this.tigo.auth && info.auth) {
    args.push(this.tigo.auth.verifier);
  }
  if (info.cors !== 'false') {
    args.push(this.framework.cors);
  }
  // add no-store cahce-control header for all internal api
  if (!info.external) {
    args.push(noStoreMiddleware);
  }
  args.push(info.target);
  this.router[type.toLowerCase().trim()](...args);
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
        registerRoute.call(this, {
          path: realPath,
          type: t.toLowerCase(),
          info,
        });
        this.logger.debug(`Registered route [${t.toUpperCase()}: ${realPath}] of [${instance._tigoName}] controller.`);
      });
    } else if (typeof type === 'string') {
      registerRoute.call(this, {
        path: realPath,
        type: type.toLowerCase(),
        info,
      });
      this.logger.debug(`Registered route [${type.toUpperCase()}: ${realPath}] of [${instance._tigoName}] controller.`);
    }
  });
}

module.exports = {
  registerController,
};
