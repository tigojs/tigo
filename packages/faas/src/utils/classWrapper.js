const handler = {
  ownKeys: function (target) {
    return Reflect.ownKeys(target);
  },
};

const createNew = (clazz) => {
  return (ctx, config) => {
    const instance = new clazz(ctx, config);
    const proxy = new Proxy(instance, handler);
    return proxy;
  };
}

module.exports = createNew;