function registerController(instance) {
  if (!instance) {
    this.logger.warn(`Cannot register controller [${instance._tigoName}] because the instance is empty.`);
    return;
  }
  if (!instance.getRoutes || typeof instance.getRoutes !== 'function') {
    this.logger.warn(`Controller [${instance._tigoName}] doesn't contain the getRoutes function.`)
    return;
  }
  const routes = instance.getRoutes();
  Object.keys(routes).forEach((path) => {
    const info = routes[path];
    if (info.cond && typeof info.cond === 'function') {
      if (!info.cond()) {
        return;
      }
    }
    const type = info.type.toLowerCase();
    if (this.tigo.auth && info.auth) {
      this.router[type](path, this.tigo.auth.verify, info.target);
    } else {
      this.router[type](path, info.target);
    }
    this.logger.debug(`Registered route [${type.toUpperCase()}: ${path}] of [${instance._tigoName}] controller.`);
  });
}

module.exports = {
  registerController,
};
