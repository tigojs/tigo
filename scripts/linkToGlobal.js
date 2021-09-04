const logger = require('./utils/logger');
const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

const PAKCAGES_DIR_PATH = path.resolve(__dirname, '../packages');

const linkToGlobal = () => {
  logger.info('Starting to link packages to global...');
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
    // run npm link
    child_process.execSync(`npm link`, {
      stdio: 'inherit',
      cwd: pkgDir,
    });
  });
};

linkToGlobal();
