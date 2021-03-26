const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

const engines = [
  {
    name: 'Local Storage Engine',
    package: '@tigojs/oss-local',
  },
];
const engineMap = {};

engines.forEach((engine) => {
  engineMap[engine.name] = engine.package;
});

const postInstall = async function () {
  const answers = await this.inquirer.prompt([
    {
      type: 'list',
      name: 'engine',
      message: 'Which engine you want to use?',
      choices: engines.map((item) => item.name),
    },
  ]);
  if (!answers.engine) {
    this.logger.warn('No engine will be installed, the object storage service needs an engine to work, please install an engine manually.');
    return;
  }
  const enginePkgName = engineMap[answers.engine];
  const repo = await this.npm.repo(enginePkgName);
  let pkg;
  try {
    pkg = await repo.package();
  } catch (err) {
    this.logger.error('Cannot fetch package info of the engine.');
    throw err;
  }
  const serverPkgPath = path.resolve(this.workDir, './package.json');
  if (fs.existsSync(serverPkgPath)) {
    const serverPkg = JSON.parse(fs.readFileSync(serverPkgPath, { encoding: 'utf-8' }));
    if (serverPkg.dependencies) {
      Object.keys(serverPkg.dependencies).forEach((dependency) => {
        if (dependency === pkg.name && serverPkg.dependencies[dependency] === pkg.version) {
          this.logger.info('Engine has already been installed, skip.');
          return;
        }
      });
    }
  }
  this.logger.info(`Starting to install the engine [${enginePkgName}]...`);
  child_process.execSync(`npm install ${enginePkgName} --save`, { stdio: 'inherit' });
  // write config to rc
  const installedPlugins = Object.keys(this.rc.content.plugins);
  installedPlugins.forEach((pluginName) => {
    const plugin = this.rc.content.plugins[pluginName];
    if (plugin.package === '@tigojs/oss') {
      // set engine
      if (!plugin.config) {
        plugin.config = {};
      }
      Object.assign(plugin.config, {
        storage: {
          engine: enginePkgName,
        },
      });
      this.logger.info('Runtime config has been updated.');
      return;
    }
  });
  this.rc.write(this.rc.status, this.rc.content);
  this.logger.info('Engine installed.');
};

module.exports = postInstall;
