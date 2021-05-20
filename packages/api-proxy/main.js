const { isDomain } = require('regex-go/dist/regex-go.umd');

const validateRules = {
  domain: {
    required: true,
    validator: (v) => {
      if (typeof domain === 'object') {
        const { internal, external } = domain;
        return isDomain(internal) && isDomain(external);
      }
      return isDomain(v);
    },
  },
  strict: {
    required: false,
    validator: (v) => {
      if (typeof v !== 'boolean') {
        return false;
      }
      return true;
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
    let resolver;
    if (typeof opts.domain === 'object') {
      const { internal, external } = opts.domain;
      const internalPrefix = app.tigo.config.router?.internal?.prefix || '/api';
      const externalPrefix = app.tigo.config.router?.external?.prefix || '';
      resolver = function (host, url, req) {
        const formattedPath = `${host}${url}`;
        const formattedInternalDomain = internal.replace(/\./g, '\\.').replace(/\//g, '\\/');
        const formattedExternalDomain = external.replace(/\./g, '\\.').replace(/\//g, '\\/');
        const internalTester = new RegExp(`^${formattedInternalDomain}`);
        const externalTester = new RegExp(`^${formattedExternalDomain}`);
        const strictTester = new RegExp(`^${externalTester}/${internalPrefix.replace(/\//g, '\\/')}`);
        if (internalTester.test(formattedPath)) {
          let targetPath = `http://127.0.0.1:${app.tigo.config.server.port}/${internalPrefix}`;
          if (!targetPath.endsWith('/')) {
            targetPath = `${targetPath}/`;
          }
          return targetPath;
        }
        if (externalTester.test(formattedPath) && (!opts.strict || (opts.strict && !strictTester.test()))) {
          let targetPath = `http://127.0.0.1:${app.tigo.config.server.port}/${externalPrefix}`;
          if (!targetPath.endsWith('/')) {
            targetPath = `${targetPath}/`;
          }
          return targetPath;
        }
      };
    } else {
      resolver = function (host, url, req) {
        const formattedPath = `${host}${url}`;
        const formattedApiDomain = opts.domain.replace(/\./g, '\\.');
        const apiTester = new RegExp(`^${formattedApiDomain}`);
        if (apiTester.test(formattedPath)) {
          const targetPath = `http://127.0.0.1:${app.tigo.config.server.port}/`;
          return targetPath;
        }
      };
    }
    resolver.priority = 100;
    app.tigo.hostbinder.proxy.addResolver(resolver);
    // update certs
    if (app.tigo.hostbinder.useHttps) {
      const { email, production, greenlockOpts } = app.tigo.hostbinder.useHttps.letsencrypt;
      if (typeof opts.domain === 'object') {
        app.tigo.hostbinder.proxy.updateCertificates(opts.domain.internal, email, production, greenlockOpts);
        app.tigo.hostbinder.proxy.updateCertificates(opts.domain.external, email, production, greenlockOpts);
      } else {
        app.tigo.hostbinder.proxy.updateCertificates(opts.domain, email, production, greenlockOpts);
      }
    }
    app.logger.debug('Resolver added.');
  },
};

module.exports = plugin;
