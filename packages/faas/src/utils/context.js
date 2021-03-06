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
];

function createContextProxy(ctx) {
  // proxy
  const handler = {
    get: function (target, prop, recevier) {
      if (!allowContextProps.includes(prop)) {
        throw new TypeError('非法访问上下文');
      }
      if (prop === 'path') {
        return ctx.params.subPath || '/';
      } else {
        return Reflect.get(...arguments);
      }
    },
    set: function (target, key, value, receiver) {
      if (!allowContextProps.includes(key)) {
        throw new TypeError('非法操作上下文');
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
