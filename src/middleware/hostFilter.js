const hostFilter = {
  priority: 100,
  async install(ctx, next) {
    const { hostname } = ctx.config.server.host;
    if (hostname && ctx.hostname !== hostname) {
      ctx.status = 404;
      return;
    }
    await next();
  }
}

module.exports = hostFilter;
