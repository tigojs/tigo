const noStoreMiddleware = async (ctx, next) => {
  ctx.set('Cache-Control', 'no-store');
  return await next();
};

function registerRoute({ path, type, info, instance }) {
  const args = [path];
  if (!info.target || typeof info.target !== 'function') {
    throw new Error(`Cannot find the target for the route [${path}].`);
  }
  if (info.cors !== false) {
    args.push(this.framework.cors);
  }
  if (this.tigo.auth && info.apiAccess) {
    args.push(this.tigo.auth.apiFlag, this.tigo.auth.verifier);
  } else if (this.tigo.auth && info.auth) {
    args.push(this.tigo.auth.verifier);
  }
  // add no-store cahce-control header for all internal api
  if (!info.external) {
    args.push(noStoreMiddleware);
  }
  args.push(info.target.bind(instance));
  this.router[type](...args);
}

function registerController(instance) {
  if (!instance) {
    this.logger.warn(`Cannot register controller [${instance._tigoName}] because the instance is empty.`);
    return;
  }
  if (typeof instance.getRoutes !== 'function') {
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
    let type = info.type;
    let includeOptions = false;
    if (Array.isArray(type)) {
      const types = [...new Set(type)];
      types.forEach((type) => {
        type = type.toLowerCase().trim();
        if (type === 'options') {
          includeOptions = true;
        }
        registerRoute.call(this, {
          path: realPath,
          type,
          info,
          instance,
        });
        this.logger.debug(`Registered route [${type.toUpperCase()}: ${realPath}] of [${instance._tigoName}] controller.`);
      });
    } else if (typeof type === 'string') {
      type = type.toLowerCase().trim();
      if (type === 'options') {
        includeOptions = true;
      }
      registerRoute.call(this, {
        path: realPath,
        type,
        info,
        instance,
      });
      this.logger.debug(`Registered route [${type.toUpperCase()}: ${realPath}] of [${instance._tigoName}] controller.`);
    }
    // register options route if need cors
    if (info.cors !== false && !includeOptions) {
      registerRoute.call(this, {
        path: realPath,
        type: 'options',
        info,
        instance,
      });
      this.logger.debug(`Registered cors [${realPath}] of [${instance._tigoName}] controller.`);
    }
  });
}

module.exports = {
  registerController,
};
