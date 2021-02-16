const allowContextProps = [
  // koa base
  'req',
  'res',
  'request',
  'response',
  'cookies',
  'throw',
  'assert',
  'respond',
  // koa request aliases
  'header',
  'headers',
  'method',
  'url',
  'originalUrl',
  'origin',
  'href',
  'path',
  'query',
  'querystring',
  'host',
  'hostname',
  'fresh',
  'stale',
  'socket',
  'protocol',
  'secure',
  'ip',
  'ips',
  'subdomains',
  'is',
  'accepts',
  'acceptsEncodings',
  'acceptsCharsets',
  'acceptsLanguages',
  'get',
  // response aliases
  'body',
  'status',
  'message',
  'length',
  'type',
  'headerSent',
  'redirect',
  'attachment',
  'set',
  'append',
  'remove',
  'lastModified',
  'etag',
]

function createContextProxy(ctx) {
  // patch
  // ctx.path = ctx.path.replace(/\/lambda\/[a-z0-9]+\//, '');
  // if (ctx.path.includes('/')) {
  //   ctx.path = ctx.path.substring(ctx.path.indexOf('/'));
  // } else {
  //   ctx.path = '/';
  // }
  ctx.path = ctx.params.subPath || '/';
  // proxy
  const handler = {
    get: function (target, prop, recevier) {
      if (!allowContextProps.includes(prop)) {
        throw new TypeError('非法访问上下文');
      }
      return Reflect.get(...arguments);
    },
    set: function (target, key, value, receiver) {
      if (!allowContextProps.includes(key)) {
        throw new TypeError('非法操作上下文');
      }
      target[key] = value;
      return true;
    }
  };

  const proxy = new Proxy(ctx, handler);

  return proxy;
}

module.exports = {
  createContextProxy,
};
