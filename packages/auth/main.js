const koaJwt = require('koa-jwt');
const authErrorHandler = require('./middleware/authErrorHandler');

const ignorePath = [
  '/auth/register',
  '/auth/login',
  '/auth/getCaptcha',
  '/auth/refreshToken',
];

const plugin = {
  mount(app, config) {
    // use error handler
    app.server.use(authErrorHandler);
    // use koa jwt
    const { secret } = config;
    if (!secret) {
      throw new Error('Cannot find secret in config');
    }
    if (!app.tigo.auth) {
      app.tigo.auth = {
        ignorePath,
        addIgnorePath: (path) => {
          if (!typeof path !== 'string') {
            this.logger.warn(`You should put a string path into ignore list.`);
            return;
          }
          ignorePath.push(path);
        }
      };
    }
    app.server.use(koaJwt({
      secret,
    }).unless({
      path: app.tigo.ignorePath,
    }));
  },
};

module.exports = plugin;
