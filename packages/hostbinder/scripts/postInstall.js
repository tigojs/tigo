const EMAIL_TESTER = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const postInstall = async function () {
  const answers = await this.inquirer.prompt([
    {
      type: 'confirm',
      name: 'https',
      message: 'Enable https support?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'unlock',
      message: 'Enable unlock mode (the destination URL can be configured as any URL in the scope of server)?',
      default: false,
    },
  ]);
  const config = {
    leMinimalPort: answers.lePort,
    unlock: answers.unlock,
    https: answers.https,
  };
  if (answers.https) {
    const httpsAns = await this.inquirer.prompt([
      {
        type: 'confirm',
        name: 'http2',
        message: 'Enable http2 support?',
        default: true,
      },
      {
        type: 'input',
        name: 'email',
        message: "Input your email address for Let's encrypt",
        validate: (value) => {
          if (!EMAIL_TESTER.test(value)) {
            return 'This email address is invalid, please input a new one.';
          }
          return true;
        },
      },
    ]);
    Object.assign(config, {
      http2: httpsAns.http2,
      leEmail: httpsAns.email,
    });
  }
  this.updatePluginConfig('@tigojs/hostbinder', (pluginConfig) => {
    Object.assign(pluginConfig, config);
  });
};

module.exports = postInstall;
