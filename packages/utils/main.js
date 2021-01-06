const path = require('path');
const fs = require('fs');

const collectPath = [
  path.resolve(__dirname, './src'),
];

const toExport = {};

collectPath.forEach((dirPath) => {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const m = require(path.resolve(dirPath, file));
    Object.assign(toExport, m);
  });
});

module.exports = toExport;
