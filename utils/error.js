const { errorMessage, errorCode } = require('../constants/httpError');

function createHttpError(arg) {
  if (typeof arg === 'number') {
    return {
      code: arg,
      message: errorMessage[arg],
    };
  }
  const code = errorCode[arg];
  return {
    code,
    message: errorMessage[code],
  };
}

function registerErrorHandler(app) {
  app.context.onerror = function (err) {
    // don't do anything if no error.
    if (err === null) {
      return;
    }
    const ctx = this;
    ctx.status = err.status || 500;
    if (ctx.headers['origin'] || ctx.headers['x-requested-with']) {
      ctx.set('Content-Type', 'application/json');
      ctx.body = {
        success: false,
        ...createHttpError('unknownError'),
      };
    } else {
      ctx.set('Content-Type', 'text/html');
      ctx.body = ctx.tigo.pages.unknownError;
    }
    // output log
    ctx.logger.error(`[${ctx.method}] ${ctx.path}: request failed: `);
    ctx.logger.error(err);
  }
}

module.exports = {
  createHttpError,
  registerErrorHandler,
};
