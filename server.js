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
if (fs.existSync(configPath.json)) {
  config = JSON.parse(fs.readFileSync(configPath.json, { encoding: 'utf-8' }));
} else if (fs.existSync(configPath.js)) {
  config = require(configPath.js);
}

const app = new App(config);

app.start();
