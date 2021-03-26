const doPrompt = async function () {
  const answers = await this.inquirer.prompt([
    {
      type: 'password',
      message: 'Enter your secret for json web token',
      name: 'secret',
    },
    {
      type: 'password',
      name: 'confirm',
      message: 'Enter your secret again',
    },
  ]);
  if (answers.secret !== answers.confirm) {
    this.logger.error('The two passwords are different, please try again.');
    return await doPrompt.call(this);
  }
  return answers;
}

const postInstall = async function () {
  const answers = await doPrompt.call(this);
  const installedPlugins = Object.keys(this.rc.content.plugins);
  installedPlugins.forEach((pluginName) => {
    const plugin = this.rc.content.plugins[pluginName];
    if (plugin.package === '@tigojs/auth') {
      if (!plugin.config) {
        plugin.config = {};
      }
      Object.assign(plugin.config, {
        secret: answers.secret,
      });
      this.rc.write(this.rc.status, this.rc.content);
      this.logger.info('Runtime config has been updated.');
      return;
    }
  });
};

module.exports = postInstall;
