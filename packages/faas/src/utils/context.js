const allowContextProps = [
  // koa base
  'cookies',
  'throw',
  'assert',
  'respond',
  // koa request aliases
  'header',
  'headers',
  'method',
  'path',
  'query',
  'querystring',
  'host',
  'hostname',
  'fresh',
  'stale',
  'protocol',
  'secure',
  'ip',
  'ips',
  'is',
  'accepts',
  'acceptsEncodings',
  'acceptsCharsets',
  'acceptsLanguages',
  'get',
  // koa response aliases
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
  // router
  'params',
];

function createContextProxy(ctx) {
  // proxy
  const handler = {
    get: function (target, prop, recevier) {
      if (!allowContextProps.includes(prop)) {
        throw new TypeError('Violation access context.');
      }
      if (prop === 'path') {
        return ctx.params.subPath || '/';
      } else {
        return Reflect.get(...arguments);
      }
    },
    set: function (target, key, value, receiver) {
      if (!allowContextProps.includes(key)) {
        throw new TypeError('Violation operate context.');
      }
      target[key] = value;
      return true;
    },
  };

  const proxy = new Proxy(ctx, handler);

  return proxy;
}

module.exports = {
  createContextProxy,
};
