const postInstall = async function () {
  const answers = await this.inquirer.prompt([
    {
      type: 'confirm',
      name: 'wal',
      message: 'Enable WAL for the SQLite?',
      default: false,
    },
  ]);
  this.updatePluginConfig('@tigojs/sqlite', (pluginConfig) => {
    Object.assign(pluginConfig, {
      wal: answers.wal,
    });
  });
};

module.exports = postInstall;
