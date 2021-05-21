const uriValidator = /^(mongodb:(?:\/{2})?)((\w+?):(\w+?)@|:?@?)(\w+?):(\d+)\/(\w+?)$/;

const postInstall = async function () {
  const ans = await this.inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to set the connection uri now?',
      default: true,
    },
  ]);
  if (!ans.confirm) {
    this.updatePluginConfig('@tigojs/mongodb', (config) => {
      Object.assign(config, {
        uri: '',
      });
    });
    this.logger.warn("You've not set the connection uri yet, please remember to set it later.");
    return;
  }
  const input = await this.inquirer.prompt([
    {
      type: 'input',
      name: 'uri',
      message: 'Your connection uri: ',
      validate: (v) => {
        if (!uriValidator.test(v)) {
          return 'The uri is invalid, please check it and input again.';
        }
        return true;
      },
    },
  ]);
  this.updatePluginConfig('@tigojs/mongodb', (config) => {
    Object.assign(config, {
      uri: input.uri,
    });
  });
};

module.exports = postInstall;
