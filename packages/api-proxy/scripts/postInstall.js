const { isDomain } = require('regex-go/dist/regex-go.umd');

const doPrompt = async function () {
  const answer = await this.inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'Domain that needs to be bound to the internal APIs',
      validate: (domain) => {
        if (!isDomain(domain)) {
          return 'Domain is invalid.';
        }
        return true;
      },
    },
  ]);

  return answer;
}

const postInstall = async function () {
  const answer = await doPrompt.call(this);
  const { domain } = answer;
  this.updatePluginConfig('@tigojs/api-proxy', (pluginConfig) => {
    Object.assign(pluginConfig, {
      domain,
    });
  });
};

module.exports = postInstall;
