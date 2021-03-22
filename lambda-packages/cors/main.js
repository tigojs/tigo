const cors = require('@koa/cors');

const helper = async (ctx, opts) => {
  const middleware = cors(opts);
  await middleware(ctx, null);
};

module.exports = helper;
