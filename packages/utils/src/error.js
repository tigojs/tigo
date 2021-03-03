const http = require('http');
const fs = require('fs');
const escapeHtml = require('escape-html');
const sendToWormhole = require('stream-wormhole');
const { errorMessage, errorCode } = require('../constants/httpError');

const templateCache = {};

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
  let template = ctx.static.main.html.errorPage;
  if (!template) {
    return;
  }
  // if not use memo, read error page into memory
  const useMemo = ctx.tigo.config.static && ctx.tigo.config.static.memo;
  if (!useMemo) {
    if (templateCache[template]) {
      template = templateCache[template];
    } else {
      const content = fs.readFileSync(template, { encoding: 'utf-8' });
      templateCache[template] = content;
      template = content;
    }
  }
  const rendered = template.replace(/{{statusCode}}/g, code)
    .replace(/{{statusText}}/g, text)
    .replace(/{{stack}}/g, stack)
    .replace('{{ver}}', ctx.tigo.version);
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
    case 403:
      return 'Access Forbidden';
    case 404:
      return 'Not Found';
    case 422:
      return 'Parameter Validation Failed';
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
        case 403:
          ctx.body = createHttpError('forbiddenAccess');
          break;
        case 404:
          ctx.body = createHttpError('notFound');
          break;
        case 422:
          ctx.body = createHttpError('paramValidationFailed');
          break;
      }
      if (
        err.message
        && err.status !== 422
        && process.env.NODE_ENV === 'dev'
      ) {
        ctx.body.message = err.message;
      }
      if (
        err.stack
        && (process.env.NODE_ENV === 'dev' || err.fromFaas)
      ) {
        ctx.body.stack = err.stack;
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

    if (err.status !== 500) {
      err._innerType = 'business';
    }

    // output log
    if (err._innerType !== 'business') {
      ctx.logger.error(`[${ctx.method}] ${ctx.path} request failed.`);
      ctx.logger.error(err);
    }
  }

  // catch 404
  app.use(async function (ctx, next) {
    await next();
    if (ctx.status === 404) {
      if (ctx.headers['origin'] || ctx.headers['x-requested-with']) {
        ctx.set('Content-Type', 'application/json');
        ctx.body = createHttpError('notFound');
      } else {
        ctx.set('Content-Type', 'text/html');
        ctx.body = renderErrorPage(
          ctx,
          404,
          getStatusText(404)
        );
      }
      ctx.status = 404;
    }
  });
}

module.exports = {
  createHttpError,
  renderErrorPage,
  registerErrorHandler,
};
