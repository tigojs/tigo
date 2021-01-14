const {
  createHttpError,
  renderErrorPage,
} = require('@tigo/utils');

const authErrorHandler = async (ctx, next) => {
  return next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 401;
      if (ctx.headers['origin'] || ctx.headers['x-requested-with']) {
        ctx.set('Content-Type', 'application/json');
        ctx.body = createHttpError(
          'authorizationFailed',
          process.env.NODE_ENV === 'dev' ? err.message : null,
        );
        return;
      }
      ctx.set('Content-Type', 'text/html');
      ctx.body = renderErrorPage(ctx, 401, 'Authorization Failed', err.stack);
    } else {
      throw err;
    }
  })
};

module.exports = authErrorHandler;
