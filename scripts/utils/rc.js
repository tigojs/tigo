const path = require('path');
const fs = require('fs');

const FRAMEWORK_DIR = path.resolve(__dirname, '../../');
const JSON_RC = path.resolve(FRAMEWORK_DIR, './.tigorc');
const JS_RC = `${JSON_RC}.js`;

const getRC = () => {
  if (fs.existsSync(JSON_RC)) {
    return JSON.parse(fs.readFileSync(JSON_RC, { encoding: 'utf-8' }));
  } else if (fs.existsSync(JS_RC)) {
    return require(JS_RC);
  }
  return null;
};

const getRawRC = () => {
  if (fs.existsSync(JSON_RC)) {
    return fs.readFileSync(JSON_RC, { encoding: 'utf-8' });
  } else if (fs.existsSync( JS_RC)) {
    return fs.readFileSync(JS_RC, { encoding: 'utf-8' })
  }
  return null;
}

module.exports = {
  getRC,
  getRawRC,
};
