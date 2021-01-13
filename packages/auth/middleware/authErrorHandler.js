const path = require('path');
const fs = require('fs');

const authErrorHandler = async (ctx, next) => {
  return next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 401;
      if (ctx.headers['origin'] || ctx.headers['x-requested-with']) {
        ctx.set('Content-Type', 'application/json');
        const errorMessage = process.env.NODE_ENV === 'dev' ? err.message || '没有权限访问' : '没有权限访问';
        ctx.body = {
          success: false,
          code: 401000,
          message: errorMessage,
        };
        return;
      }
      ctx.set('Content-Type', 'text/html');
      ctx.body = ctx.static.auth.html.authFailed;
    } else {
      throw err;
    }
  })
};

module.exports = authErrorHandler;
