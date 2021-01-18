const path = require('path');

function getSafeFileName(filename) {
  const extName = path.extName(filename);
  return `${path.basename(filename, extName)}.${extName}`;
}

module.exports = {
  getSafeFileName,
};
