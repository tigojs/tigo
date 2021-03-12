const { isDomain } = require('regex-go/dist/regex-go.umd');

const validateRules = {
	distPath: {
		required: true,
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
}

const plugin = {
  dependencies: [
    {
      package: '@tigojs/hostbinder',
      allowAutoImport: false,
    },
  ],
	mount(app, opts) {
		validate(opts, validateRules);
		// TODO: mount panel dist files to app and register reverse proxy
	},
};

module.exports = plugin;
