const createError = require("../constrants/error");

const hostFilter = {
  priority: 100,
  async install(ctx, next) {
    const { server: serverConfig } = ctx.tigo.config;
    const { host: hostname } = serverConfig;
    if (hostname && ctx.hostname !== hostname) {
      ctx.status = 403;
      if (ctx.headers['origin'] || ctx.headers['x-requested-with']) {
        // xhr
        ctx.set('Content-Type', 'application/json');
        ctx.body ={
          success: false,
          ...createError('forbiddenAccess'),
        };
        return;
      }
      ctx.set('Content-Type', 'text/html');
      ctx.body = ctx.tigo.pages.forbidden;
      return;
    }
    await next();
  }
}

module.exports = hostFilter;
