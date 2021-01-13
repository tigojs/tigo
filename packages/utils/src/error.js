const http = require('http');
const escapeHtml = require('escape-html');
const sendToWormhole = require('stream-wormhole');
const { errorMessage, errorCode } = require('../constants/httpError');

function createHttpError(arg, message) {
  const code = typeof arg === 'number' ? arg : errorCode[arg];
  return {
    success: false,
    code,
    message: message || errorMessage[code],
  };
}

function renderErrorPage(
  ctx,
  code = 500,
  text = 'Unknown Error',
  stack = '',
) {
  const template = ctx.static.main.html.errorPage;
  if (!template) {
    return;
  }
  const rendered = template.replace(/{{statusCode}}/g, code)
    .replace(/{{statusText}}/g, text)
    .replace(/{{stack}}/g, stack);
  return rendered;
}

function getStatusText(code) {
  switch(code) {
    default:
      return 'Unknown Error';
    case 400:
      return 'Bad Request';
    case 401:
      return 'Authorization Failed';
    case 402:
      return 'Parameter Validation Failed';
    case 403:
      return 'Access Forbidden';
    case 404:
      return 'Not Found';
  }
}

function registerErrorHandler(app) {
  app.context.onerror = function (err) {
    // don't do anything if no error.
    if (err === null) {
      return;
    }

    if (this.req) sendToWormhole(this.req);

    const ctx = this;

    if (err.code === 'ENOENT') err.status = 404;
    if (typeof err.status !== 'number' || !http.STATUS_CODES[err.status]) {
      err.status = 500;
    }

    ctx.status = err.status || 500;
    ctx.set(err.headers);

    if (ctx.headers['origin'] || ctx.headers['x-requested-with']) {
      ctx.set('Content-Type', 'application/json');
      switch (ctx.status) {
        default:
          ctx.body = createHttpError('unknownError');
          break;
        case 400:
          ctx.body = createHttpError('badRequest');
          break;
        case 401:
          ctx.body = createHttpError('authorizationFailed');
          break;
        case 402:
          ctx.body = createHttpError('paramValidationFailed');
          break;
        case 403:
          ctx.body = createHttpError('forbiddenAccess');
          break;
        case 404:
          ctx.body = createHttpError('notFound');
          break;
      }
      ctx.body = JSON.stringify(ctx.body);
    } else {
      ctx.set('Content-Type', 'text/html');
      ctx.body = renderErrorPage(
        ctx,
        err.status,
        getStatusText(err.status),
        escapeHtml(err.stack),
      );
    }

    // end stream
    ctx.res.end(ctx.body);

    // output log
    ctx.logger.error(`[${ctx.method}] ${ctx.path} request failed.`);
    ctx.logger.error(err);
  }
}

module.exports = {
  createHttpError,
  renderErrorPage,
  registerErrorHandler,
};
