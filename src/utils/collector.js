const path = require('path');
const fs = require('fs');

const dirPath = path.resolve(__dirname, '../middleware');

function collectMiddleware() {
  const files = fs.readdirSync(dirPath);
  const middlewares = [];
  files.forEach((filename) => {
    const filePath = path.resolve(dirPath, filename);
    try {
      const middleware = require(filePath);
      if (!middleware) {
        return;
      }
      middlewares.push(middleware);
    } catch (err) {
      this.logger.error('Something was wrong when collecting middleware: ', err);
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

module.exports = {
  collectMiddleware,
};
