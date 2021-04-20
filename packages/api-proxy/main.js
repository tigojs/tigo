const { isDomain } = require('regex-go/dist/regex-go.umd');

const validateRules = {
  domain: {
    required: true,
    validator: (v) => {
      return isDomain(v);
    },
  },
};

const validate = (rules, values) => {
  Object.keys(rules).forEach((key) => {
    const rule = rules[key];
    if (rule.required && !values[key]) {
      throw new Error(`${key} is missing, please set it in the config.`);
    }
    if (rule.validator && typeof rule.validator === 'function') {
      const res = rule.validator(values[key]);
      if (res !== true) {
        throw new Error(typeof res === 'string' ? res : `${key} is invalid, please check it.`);
      }
    }
  });
};

const plugin = {
  dependencies: [
    {
      package: '@tigojs/hostbinder',
      allowAutoImport: true,
    },
  ],
  mount(app, opts) {
    validate(opts, validateRules);
    // register proxy
    const resolver = function (host, url, req) {
      const formattedPath = `${host}${url}`;
      const formattedApiDomain = opts.domain.replaceAll('.', '\\.');
      const apiTester = new RegExp(`^${formattedApiDomain}${opts.prefix.replace('/', '\\/') || '\\/'}`);
      if (apiTester.test(formattedPath)) {
        return `http://127.0.0.1:${app.tigo.config.server.port}${app.tigo.config.router?.internal?.prefix || '/api'}`;
      }
    };
    resolver.priority = 100;
    app.tigo.hostbinder.proxy.addResolver(resolver);
    if (app.tigo.hostbinder.useHttps) {
      const { email, production } = app.tigo.hostbinder.useHttps.letsencrypt;
      app.tigo.hostbinder.proxy.updateCertificates(opts.domain, email, production);
    }
  }
};

module.exports = plugin;
