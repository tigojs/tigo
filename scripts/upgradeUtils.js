const path = require('path');
const fs = require('fs');
const NpmApi = require('npm-api');
const child_process = require('child_process');
const log4js = require('log4js');

log4js.configure({
  appenders: {
    stdout: {
      type: 'stdout',
    },
  },
  categories: {
    default: { appenders: ['stdout'], level: 'debug' },
  },
});

const logger = log4js.getLogger();

const PAKCAGES_DIR_PATH = path.resolve(__dirname, '../packages');

const npm = new NpmApi();

const fetchPackageVersion = async () => {
  const repo = npm.repo('@tigojs/utils');
  const package = await repo.package();
  return package.version;
};

const upgradeUtils = async () => {
  logger.info('Fetching utils package info from npm...');
  const version = await fetchPackageVersion();
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
    const installedVersion = pkg.dependencies['@tigojs/utils'].substr(1);
    if (installedVersion === version) {
      logger.info(`Skip [${name}], utils is latest version.`);
      return;
    }
    logger.info(`Upgrading utils in [${name}]...`);
    child_process.execSync(`npm install @tigojs/utils@${version} --save`, {
      stdio: 'inherit',
      cwd: packageDir,
    });
    logger.info(`Utils in package [${name}] has been upgraded.`);
  });
  // framework
  const frameworkDir = path.resolve(__dirname, '../');
  let frameworkPkg;
  try {
    frameworkPkg = JSON.parse(fs.readFileSync(path.resolve(frameworkDir, './package.json'), { encoding: 'utf-8' }));
  } catch {
    logger.error(`Cannot read package.json of framework.`);
    return;
  }
  const frameworkInstalledVersion = frameworkPkg.dependencies['@tigojs/utils'].substr(1);
  if (frameworkInstalledVersion === version) {
    logger.info(`Skip framework, utils is latest version.`);
    return;
  }
  logger.info(`Upgrading utils in framework.`);
  child_process.execSync(`npm install @tigojs/utils@${version} --save`, {
    stdio: 'inherit',
  });
  logger.info(`Utils in framework has been upgraded.`);
};

upgradeUtils();
