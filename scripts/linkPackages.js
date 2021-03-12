const { getRawRC } = require('./utils/rc');
const logger = require('./utils/logger');
const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

const pkgNameTester = /\@tigojs\/[a-z-]+/g

const linkPackages = () => {
  const rc = getRawRC();
  if (!rc) {
    logger.error('Cannot read .tigorc, maybe it does not exist.');
    return;
  }
  // read framework package.json
  const framePkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json')), { encoding: 'utf-8' });
  const dependencies = framePkg?.dependencies;
  const matches = rc.matchAll(pkgNameTester);
  const pkgs = [];
  for (const match of matches) {
    pkgs.push(match[0]);
  }
  logger.info('Found following packages: ', pkgs);
  pkgs.forEach((pkg) => {
    if (Array.isArray(dependencies) && dependencies.includes(pkg)) {
      logger.info(`${pkg} has been linked to framework, skip.`);
      return;
    }
    logger.info(`Start link ${pkg}...`);
    child_process.execSync(`npm link ${pkg}`, '../')
  });
}

linkPackages();
