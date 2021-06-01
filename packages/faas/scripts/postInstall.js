const postInstall = async function () {
  const ans = await this.inquirer.prompt([
    {
      type: 'confirm',
      name: 'kvEnabled',
      message: 'Do you want to enable Key-Value storage for lambda?',
      default: true,
    },
  ]);
  this.updatePluginConfig('@tigojs/faas', (config) => {
    Object.assign(config, {
      lambdaKv: {
        enabled: ans.kvEnabled,
      },
    });
  });
};

module.exports = postInstall;
