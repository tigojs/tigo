const App = require('./src/app');
const config = require('./config');

const app = new App(config);

app.start();
