const { isDomain } = require('regex-go/dist/regex-go.umd');

const doPrompt = async function () {
  let opts = {};
  const confirm = await this.inquirer.prompt([
    {
      type: 'confirm',
      name: 'separate',
      message: 'Do you want to proxy internal APIs and external APIs separately?',
      default: false,
    },
  ]);
  if (confirm.seperate) {
    const answer = await this.inquirer.prompt([
      {
        type: 'input',
        name: 'internal',
        message: 'Proxy domain for internal APIs:',
        validate: (domain) => {
          if (!isDomain(domain)) {
            return 'Domain is invalid.';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'external',
        message: 'Proxy domain for external APIs',
        validate: (domain) => {
          if (!isDomain(domain)) {
            return 'Domain is invalid.';
          }
          return true;
        },
      },
    ]);
    Object.assign(opts, answer);
  } else {
    const answer = await this.inquirer.prompt([
      {
        type: 'input',
        name: 'domain',
        message: 'Proxy domain for APIs:',
        validate: (domain) => {
          if (!isDomain(domain)) {
            return 'Domain is invalid.';
          }
          return true;
        },
      },
    ]);
    opts.domain = answer.domain;
  }

  return opts;
};

const postInstall = async function () {
  const opts = await doPrompt.call(this);
  this.updatePluginConfig('@tigojs/api-proxy', (pluginConfig) => {
    Object.assign(pluginConfig, opts);
  });
};

module.exports = postInstall;
