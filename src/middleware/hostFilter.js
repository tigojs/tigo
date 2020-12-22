const hostFilter = {
  priority: 100,
  async install(ctx, next) {
    const { host: hostname } = ctx.config.server;
    if (hostname && ctx.hostname !== hostname) {
      ctx.status = 404;
      return;
    }
    await next();
  }
}

module.exports = hostFilter;
