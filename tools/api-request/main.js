const request = require('superagent');
const Signer = require('@tigojs/api-sign');

const isNotBool = (param) => {
  return param !== true && param !== false;
};

const InsertPrefix = function (prefix) {
  return function (request) {
    request.url = `${prefix}${request.url}`;
  };
};

const AutoSign = function (signer) {
  return function (request) {
    request.set(signer.getHeaders());
  }
};

const getAgent = (opts) => {
  // generate prefix
  let prefix;
  if (opts.prefix) {
    prefix = opts.prefix;
  } else {
    if (!opts.host || isNotBool(opts.https)) {
      throw new Error('Missing required parameters about host.');
    }
    const proto = opts.https ? 'https://' : 'http://';
    let port;
    if (opts.port && opts.port !== 80 && opts.port !== 443) {
      port = `:${opts.port}`;
    }
    const base = opts.base || '';
    prefix = `${proto}${opts.host}${port}${base}`;
  }
  // get sign
  const { ak, sk } = opts;
  if (!ak || !sk) {
    throw new Error('Missing required parameters about API authentication.');
  }
  const signer = new Signer({
    ak: opts.ak,
    sk: opts.sk,
  });
  // set agent
  const insertPrefix = InsertPrefix(prefix);
  const autoSign = AutoSign(signer);
  const agent = request.agent().use(insertPrefix).use(autoSign);
  return agent;
};

module.exports = {
  getAgent,
};
