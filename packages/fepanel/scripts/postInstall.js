const path = require('path');
const fs = require('fs');
const { isDomain } = require('regex-go/dist/regex-go.umd');

const postInstall = async function () {
  const answers = await this.inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'Domain which you want to bind to the frontend panel',
      validate: (domain) => {
        if (!isDomain(domain)) {
          return 'Domain is invalid.';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'dist',
      message: 'Directory path which contains the bundled files of frontend panel',
      validate: (distPath) => {
        const absolutePath = distPath.includes('./') || distPath.includes('.\\') ? path.resolve(this.workDir, distPath) : distPath;
        if (!fs.existsSync(absolutePath)) {
          return 'Cannot find the directory, please check your input.';
        }
        return true;
      },
    },
  ]);
  const installedPlugins = Object.keys(this.rc.content.plugins);
  installedPlugins.forEach((pluginName) => {
    const plugin = this.rc.content.plugins[pluginName];
    if (plugin.package === '@tigojs/fepanel') {
      if (!plugin.config) {
        plugin.config = {};
      }
      Object.assign(plugin.config, {
        domain: answers.domain,
        distPath: answers.dist,
      });
      this.rc.write(this.rc.status, this.rc.content);
      this.logger.info('Runtime config has been updated.');
      return;
    }
  });
};

module.exports = postInstall;
