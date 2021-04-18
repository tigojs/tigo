const postInstall = async function () {
  const answers = await this.inquirer.prompt([
    {
      type: 'number',
      name: 'lePort',
      message: "Port for Let's encrypt minimal web server",
      default: 24292,
      validate: (port) => {
        if (port < 1 || port > 65535) {
          return 'Invalid port, please retry.';
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'unlock',
      message: 'Enable unlock mode?',
      default: false,
    },
  ]);
  this.updatePluginConfig('@tigojs/hostbinder', (pluginConfig) => {
    Object.assign(pluginConfig, {
      leMinimalPort: answers.lePort,
      unlock: answers.unlock,
    });
  });
};

module.exports = postInstall;
