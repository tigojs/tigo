const TreeRouter = require('koa-tree-router');

/**
 * Create a router for your lambda
 * @param {object} ctx lambda request event context
 */
const createRouter = (ctx) => {
  const router = TreeRouter();
  const handler = {
    apply: function (target, thisArg, args) {
      // equal to "router.routes()(ctx, null)"
      return target()(ctx, null);
    },
  };
  const proxy = new Proxy(router.routes, handler);
  router.routes = proxy;
  return router;
};

module.export = {
  createRouter,
};
