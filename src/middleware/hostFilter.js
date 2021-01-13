const { createHttpError } = require('@tigo/utils');

const hostFilter = {
  priority: 100,
  install(app) {
    const { server: serverConfig } = app.config;
    if (!serverConfig) {
      return null;
    }
    const { host: hostname } = serverConfig;
    if (!hostname) {
      return null;
    }
    return async function (ctx, next) {
      if (hostname && ctx.hostname !== hostname) {
        ctx.status = 403;
        if (ctx.headers['origin'] || ctx.headers['x-requested-with']) {
          // xhr
          ctx.set('Content-Type', 'application/json');
          ctx.body = createHttpError('forbiddenAccess');
          return;
        }
        ctx.set('Content-Type', 'text/html');
        ctx.body = ctx.static.main.html.forbidden;
        return;
      }
      await next();
    }
  }
}

module.exports = hostFilter;
