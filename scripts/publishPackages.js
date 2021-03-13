const { fetchPackageVersion } = require('./utils/npm');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const child_process = require('child_process');
const compareVersion = require('compare-versions');

const PAKCAGES_DIR_PATH = path.resolve(__dirname, '../packages');

function publishPackages() {
  const packagesDir = fs.readdirSync(PAKCAGES_DIR_PATH);
  packagesDir.forEach(async (name) => {
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
    logger.info(`Fetching ${pkg.name} version info from npm...`);
    const npmVersion = await fetchPackageVersion(pkg.name);
    const { version } = pkg.version;
    logger.info(`npm version: ${npmVersion}, local version: ${version}`);
    if (compareVersion(npmVersion, version, '<')) {
      logger.info('Local version is newer than npm, publishing the package...');
      child_process.execSync('npm publish --access=public', { stdio: 'inherit', cwd: packageDir });
      logger.info('Package published.');
    }
  });
}

publishPackages();
