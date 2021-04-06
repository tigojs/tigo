const ctx = new Symbol('ctx');
const scopeId = new Symbol('scopeId');

class CFS {
  constructor(context) {
    if (!context.tigo.cfs?.storage) {
      throw new Error('CFS module has not been installed ')
    }
    if (!context.state.user?.scopeId) {
      throw new Error('Cannot get user info for access CFS.');
    }
    this[ctx] = context;
    this[scopeId] = context.state.user.scopeId;
  }
  async get(name, type = null) {
    let realName;
    let realType;
    if (!type) {
      const idx = name.lastIndexOf('.');
      if (idx < 0) {
        throw new Error('The name of config file is invalid.');
      }
      realName = name.substring(realName, idx);
      realType = name.substring(idx + 1);
    } else {
      realName = name;
      realType = type;
    }
    try {
      const ret = await this[ctx].tigo.cfs.storage.get(getStorageKey(`${this[scopeId]}_${realType}_${realName}`));
      return ret.toString();
    } catch (err) {
      if (err.notFound) {
        return null;
      }
      throw new Error('Failed to get content of the specific config file due to an unknown error.');
    }
  }
}

const handler = {
  ownKeys: function (target) {
    return Reflect.ownKeys(target);
  },
};

const createNew = () => {
  const instance = new CFS();
  const proxy = new Proxy(instance, handler);
  return proxy;
};

module.exports = createNew;
