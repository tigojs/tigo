const doPrompt = async function () {
  const answers = await this.inquirer.prompt([
    {
      type: 'password',
      message: 'Enter your secret for json web token:',
      name: 'secret',
    },
    {
      type: 'password',
      name: 'confirm',
      message: 'Enter your secret again:',
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
  this.updatePluginConfig('@tigojs/auth', (pluginConfig) => {
    Object.assign(pluginConfig, {
      secret: answers.secret,
    });
  });
};

module.exports = postInstall;
