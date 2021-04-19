const { createHttpError } = require('@tigojs/utils');

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
        ctx.throw(403, 'Host is not in the whitelist.');
      }
      await next();
    }
  }
}

module.exports = hostFilter;
