const TreeRouter = require('koa-tree-router');

/**
 * Create a router for your lambda
 * @param {object} ctx the context
 */
const createRouter = () => {
  const router = TreeRouter();
  const handler = {
    apply: function (target, thisArg, args) {
      // equal to "router.routes()(ctx, null)"
      return target()(args[0], null);
    },
  };
  const proxy = new Proxy(router.routes, handler);
  router.routes = proxy;
  return router;
};

module.export = {
  createRouter,
};
