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

let version;

async function fetchVersion() {
  logger.info('Fetching utils package info from npm...');
  version = await fetchPackageVersion('@tigojs/utils');
  if (!version) {
    return;
  }
  logger.info(`Latest utils version is v${version}`);
}

const upgrade = ({ name, pkgPath, pkgDir }) => {
  let pkg;
  const readPkg = () => {
    pkg = JSON.parse(fs.readFileSync(pkgPath, { encoding: 'utf-8' }));
  };
  readPkg();
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
    cwd: pkgDir,
  });
  readPkg();
  bumpMinorVersion(pkg);
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '  '), { encoding: 'utf-8' });
  logger.info(`Utils in [${name}] has been upgraded.`);
};

const upgradeUtils = async () => {
  await fetchVersion();
  logger.info('Utils upgrade started...');
  // packages
  const packagesDir = fs.readdirSync(PAKCAGES_DIR_PATH);
  packagesDir.forEach((name) => {
    const pkgDir = path.resolve(PAKCAGES_DIR_PATH, `./${name}`);
    const stat = fs.statSync(pkgDir);
    if (!stat.isDirectory()) {
      logger.debug(`[${name}] is not directory, skip.`);
      return;
    }
    const pkgPath = path.resolve(pkgDir, './package.json');
    if (!fs.existsSync(pkgPath)) {
      logger.warn(`There's no package.json under [${name}].`);
      return;
    }
    upgrade({ name, pkgPath, pkgDir });
  });
  // framework
  const frameworkDir = path.resolve(__dirname, '../');
  const frameworkPkgPath = path.resolve(frameworkDir, './package.json');
  upgrade({ name: 'framework', pkgPath: frameworkPkgPath, pkgDir: frameworkDir });
};

upgradeUtils();
