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
  const installedPlugins = Object.keys(this.rc.content.plugins);
  installedPlugins.forEach((pluginName) => {
    const plugin = this.rc.content.plugins[pluginName];
    if (plugin.package === '@tigojs/hostbinder') {
      if (!plugin.config) {
        plugin.config = {};
      }
      Object.assign(plugin.config, {
        leMinimalPort: answers.lePort,
        unlock: answers.unlock,
      });
      this.rc.write(this.rc.status, this.rc.content);
      this.logger.info('Runtime config has been updated.');
      return;
    }
  });
};

module.exports = postInstall;
