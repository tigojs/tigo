const path = require('path');
const fs = require('fs');
const App = require('./src/app');

// read config
const rcPath = path.resolve(__dirname, './.tigorc');
const configPath = {
  json: rcPath,
  js: `${rcPath}.js`,
}

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

const app = new App(config);

app.start();
