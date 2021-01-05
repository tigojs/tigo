function registerController(instance) {
  if (!instance) {
    this.logger.warn(`Cannot register controller [${instance.name}] because the instance is empty.`);
    return;
  }
  if (!instance.getRoutes || typeof instance.getRoutes !== 'function') {
    this.logger.warn(`Controller [${instance.name}] doesn't contain the getRoutes function.`)
    return;
  }
  const routes = instance.getRoutes();
  Object.keys(routes).forEach((path) => {
    const info = routes[path];
    const type = info.type.toLowerCase();
    this.router[type](path, info.target);
    this.logger.debug(`Registered route [${type.toUpperCase()}: ${path}] of [${instance.name}] controller.`);
  });
}

module.exports = {
  registerController,
};
