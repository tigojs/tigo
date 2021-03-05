const CONFIG_A = {
  host: '127.0.0.1',
  port: 24232,
  https: false,
};

const CONFIG_B = {
  host: '127.0.0.1',
  port: 24232,
  base: '/api',
  https: false,
  ak: 'eb213b2373cd44679da2611429c5887e',
  sk: 'da081a0cc1584cf28926c48ad20dfcde',
};

const CONFIG_C = {
  host: '127.0.0.1',
  port: 24232,
  base: '/api',
  https: false,
  ak: 'eb213b2373cd44679da2611429c5887e',
  sk: 'da081a0c21212cf28926c48ad20dfcde',
};

const CONFIG_D = {
  prefix: 'http://127.0.0.1:24232/api',
  https: false,
  ak: 'eb213b2373cd44679da2611429c5887e',
  sk: 'da081a0cc1584cf28926c48ad20dfcde',
};

module.exports = {
  CONFIG_A,
  CONFIG_B,
  CONFIG_C,
  CONFIG_D,
};
