const { isDomain } = require('regex-go/dist/regex-go.umd');
const { collectStaticFiles } = require('@tigojs/utils');
const fs = require('fs');

const validateRules = {
  distPath: {
    required: true,
    validator: (v) => {
      return fs.existsSync(v) ? true : 'Dist path does not exist, please check it.';
    },
  },
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
    const staticFiles = collectStaticFiles.call(app, opts.distPath);
    app.static.fepanel = staticFiles;
    // register proxy
    const resolver = function (host, url, req) {
      const formattedPath = `${host}${url}`;
      const formattedDomain = opts.domain.replace(/\./g, '\\.');
      const staticFilesTester = new RegExp(`^${formattedDomain}\/(css|fonts|js)\/.+$`);
      const domainTester = new RegExp(`^${formattedDomain}\/`);
      if (staticFilesTester.test(formattedPath)) {
        return `http://127.0.0.1:${app.tigo.config.server.port}/static/fepanel/`;
      } else if (domainTester.test(formattedPath)) {
        return {
          rewriteTo: `http://127.0.0.1:${app.tigo.config.server.port}/static/fepanel/index.html`,
        };
      }
    };
    resolver.priority = 100;
    app.tigo.hostbinder.proxy.addResolver(resolver);
    if (app.tigo.hostbinder.useHttps) {
      const { email, production } = app.tigo.hostbinder.useHttps.letsencrypt;
      app.tigo.hostbinder.proxy.updateCertificates(opts.domain, email, production);
    }
		app.logger.debug('Resolver added.');
  },
};

module.exports = plugin;
