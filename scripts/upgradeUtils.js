const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const logger = require('./utils/logger');
const { fetchPackageVersion } = require('./utils/npm');

const PAKCAGES_DIR_PATH = path.resolve(__dirname, '../packages');

const bumpMinorVersion = async (pkg) => {
  const version = pkg.version.split('.');
  version[2] = parseInt(version[2], 10) + 1;
  pkg.version = version.join('.');
};

const upgradeUtils = async () => {
  logger.info('Fetching utils package info from npm...');
  const version = await fetchPackageVersion('@tigojs/utils');
  if (!version) {
    return;
  }
  logger.info(`Latest utils version is v${version}`);
  logger.info('Utils upgrade started...');
  // packages
  const packagesDir = fs.readdirSync(PAKCAGES_DIR_PATH);
  packagesDir.forEach((name) => {
    const packageDir = path.resolve(PAKCAGES_DIR_PATH, `./${name}`);
    const stat = fs.statSync(packageDir);
    if (!stat.isDirectory()) {
      logger.debug(`[${name}] is not directory, skip.`);
      return;
    }
    const pkgPath = path.resolve(packageDir, './package.json');
    if (!fs.existsSync(pkgPath)) {
      logger.warn(`There's no package.json under [${name}].`);
      return;
    }
    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, { encoding: 'utf-8' }));
    } catch {
      logger.error(`Cannot read package.json of [${name}].`);
      return;
    }
    if (!pkg || !pkg.dependencies || !pkg.dependencies['@tigojs/utils']) {
      logger.info(`[${name}] doesn't use utils.`);
      return;
    }
    let installedVersion = pkg.dependencies['@tigojs/utils'];
    if (installedVersion.startsWith('file:')) {
      logger.info(`Utils in [${name}] is a link, skip.`);
      return;
    } else {
      installedVersion = installedVersion.substr(1);
    }
    if (installedVersion === version) {
      logger.info(`Skip [${name}], utils is latest version.`);
      return;
    }
    logger.info(`Upgrading utils in [${name}]...`);
    child_process.execSync(`npm install @tigojs/utils@${version} --save`, {
      stdio: 'inherit',
      cwd: packageDir,
    });
    bumpMinorVersion(pkg);
    fs.writeFileSync(pkg, JSON.stringify(pkg, null, '  '), { encoding: 'utf-8' });
    logger.info(`Utils in package [${name}] has been upgraded.`);
  });
  // framework
  const frameworkDir = path.resolve(__dirname, '../');
  const frameworkPkgPath = path.resolve(frameworkDir, './package.json');
  let frameworkPkg;
  try {
    frameworkPkg = JSON.parse(fs.readFileSync(frameworkPkgPath, { encoding: 'utf-8' }));
  } catch {
    logger.error(`Cannot read package.json of framework.`);
    return;
  }
  let frameworkInstalledVersion = frameworkPkg.dependencies['@tigojs/utils'];
  if (frameworkInstalledVersion.startsWith('file:')) {
    logger.info('Utils in framework is a link, skip.');
    return;
  } else {
    frameworkInstalledVersion = frameworkInstalledVersion.substr(1);
  }
  if (frameworkInstalledVersion === version) {
    logger.info(`Skip framework, utils is latest version.`);
    return;
  }
  logger.info(`Upgrading utils in framework.`);
  child_process.execSync(`npm install @tigojs/utils@${version} --save`, {
    stdio: 'inherit',
  });
  bumpMinorVersion(frameworkPkg);
  fs.writeFileSync(frameworkPkgPath, JSON.stringify(frameworkPkg, null, '  '), { encoding: 'utf-8' });
  logger.info(`Utils in framework has been upgraded.`);
};

upgradeUtils();
