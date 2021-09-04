const { fetchPackageVersion } = require('./utils/npm');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const child_process = require('child_process');
const compareVersion = require('compare-versions');

const PAKCAGES_DIR_PATH = path.resolve(__dirname, '../packages');
const rootDir = path.resolve(__dirname, '../');

function publishPackages(dirPath) {
  const resolvedPath = dirPath ? path.resolve(rootDir, dirPath) : null;
  const packageDirPath = resolvedPath || PAKCAGES_DIR_PATH;
  const packagesDir = fs.readdirSync(packageDirPath);
  packagesDir.forEach(async (name) => {
    const packageDir = path.resolve(packageDirPath, `./${name}`);
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
    logger.info(`Fetching ${pkg.name} version info from npm...`);
    let npmVersion;
    try {
      npmVersion = await fetchPackageVersion(pkg.name);
    } catch (err) {
      logger.error(`Fetching version error for [${pkg.name}], the package may not exist.`, err.message);
      if (process.env.INGORE_NOTFOUND !== 'true') {
        return;
      }
    }
    if (process.env.INGORE_NOTFOUND !== 'true') {
      if (!npmVersion) {
        logger.error(`Cannot fetch version info from npm for [${pkg.name}].`);
        return;
      }
      const { version } = pkg;
      logger.info(`pkg: ${pkg.name}, npm version: ${npmVersion}, local version: ${version}`);
      if (compareVersion.compare(npmVersion, version, '<')) {
        logger.info('Local version is newer than npm, publishing the package...');
        child_process.execSync('npm publish --access=public --registry=https://registry.npmjs.org', { stdio: 'inherit', cwd: packageDir });
        logger.info('Package published.');
      }
    } else {
      logger.warn('Force publishing the package...');
      child_process.execSync('npm publish --access=public --registry=https://registry.npmjs.org', { stdio: 'inherit', cwd: packageDir });
      logger.info('Package published.');
    }
  });
}

publishPackages(process.env.PACKAGES_DIR_PATH);
