const path = require('path');
const fs = require('fs');

const getRuntimeConfig = (dir) => {
  const rcPath = path.resolve(dir || process.cwd(), './.tigorc');
  const configPath = {
    json: `${rcPath}.json`,
    js: `${rcPath}.js`,
  };

  let config;
  // json first
  if (fs.existsSync(configPath.json)) {
    const json = fs.readFileSync(configPath.json, { encoding: 'utf-8' });
    if (json) {
      config = JSON.parse(json);
    }
  } else if (fs.existsSync(configPath.js)) {
    config = require(configPath.js);
  }
  return config;
};

module.exports = {
  getRuntimeConfig,
};
