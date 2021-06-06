const numberTester = /^\d+$/;

const queryTransformer = {
  name: 'queryTransformer',
  priority: 1000,
  install() {
    return async function (ctx, next) {
      if (!ctx.query) {
        return await next();
      }
      const keys = Object.keys(ctx.query);
      if (!keys.length) {
        return await next();
      }
      keys.forEach((key) => {
        const item = ctx.query[key];
        if (typeof item === 'string' && numberTester.test(item)) {
          ctx.query[key] = parseInt(item, 10);
        }
      });
      await next();
    };
  },
};

module.exports = queryTransformer;

