const postInstall = async function () {
  const answers = await this.inquirer.prompt([
    {
      type: 'confirm',
      name: 'wal',
      message: 'Enable WAL for the SQLite?',
      default: false,
    },
  ]);
  const installedPlugins = Object.keys(this.rc.content.plugins);
  installedPlugins.forEach((pluginName) => {
    const plugin = this.rc.content.plugins[pluginName];
    if (plugin.package === '@tigojs/sqlite') {
      if (!plugin.config) {
        plugin.config = {};
      }
      Object.assign(plugin.config, {
        wal: answers.wal,
      });
      this.rc.write(this.rc.status, this.rc.content);
      this.logger.info('Runtime config has been updated.');
      return;
    }
  });
};

module.exports = postInstall;
