const App = require('./src/app');
const { getRuntimeConfig } = require('@tigojs/utils');

const config = getRuntimeConfig();
const app = new App(config);

app.start();
