const path = require('path');
const fs = require('fs');

const middlewareDir = path.resolve(__dirname, '../middleware');
const pageDir = path.resolve(__dirname, '../pages');

function collectMiddleware() {
  const files = fs.readdirSync(middlewareDir);
  const middlewares = [];
  files.forEach((filename) => {
    const filePath = path.resolve(middlewareDir, filename);
    try {
      const middleware = require(filePath);
      if (!middleware) {
        this.logger.warn(`Reading middleware script [${filename}] error, object is empty.`);
        return;
      }
      middlewares.push(middleware);
    } catch (err) {
      this.logger.error(`Something was wrong when collecting middleware [${filename}]`);
      this.logger.error(err);
    }
  });
  middlewares.sort((a, b) => {
    if (a.priority < b.priority) {
      return 1;
    }
    if (a.priority > b.priority) {
      return -1;
    }
    return 0;
  });
  return middlewares.map(m => m.install);
}

function collectPages() {
  const files = fs.readdirSync(pageDir);
  const pages = {};
  files.forEach((filename) => {
    const filePath = path.resolve(pageDir, filename);
    try {
      const page = fs.readFileSync(filePath, { encoding: 'utf-8' });
      if (!page) {
        this.logger.warn(`Reading page file [${filename}] error, object is empty.`);
        return;
      }
      pages[path.basename(filePath, path.extname(filePath))];
    } catch (err) {
      this.logger.error(`Something was wrong when collecting page [${filename}]`);
      this.logger.error(err);
    }
  });
  return pages;
}

module.exports = {
  collectMiddleware,
  collectPages,
};
