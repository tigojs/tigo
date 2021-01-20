const { BaseService } = require('@tigo/core');
const LRU = require('lru-cache');

const getStorageKey = (configId) => `confsto_item_${configId}`;

class ConfigStorageService extends BaseService {
  constructor(app) {
    super(app);
    let { config } = app.config.plugins.configStorage;
    if (!config) {
      app.logger.warn('Cannot find configuration for config storage plugin, use default options.');
      config = {};
    }
    let { cache: cacheConfig } = config;
    cacheConfig = cacheConfig || {};
    this.cache = new LRU({
      max: cacheConfig.max || 500,
      maxAge: cacheConfig.maxAge || 60 * 60 * 1000,
      updateAgeOnGet: true,
    });
  }
  async getContent(ctx, id) {
    const dbItem = ctx.model.configStorage.conf.findByPk(id);
    if (!dbItem) {
      ctx.throw(400, '找不到该配置文件');
    }
    if (dbItem.uid !== ctx.state.user.id) {
      ctx.throw(401, '无权访问');
    }
    return await ctx.configStorage.storage.getStorageKey(`${ctx.state.user.scopeId}_${dbItem.type}_${dbItem.name}`);
  }
  async add(ctx) {
    const { name, content, type, remark } = ctx.request.body;
    const { id: uid, scopeId } = ctx.state.user;
    // check name
    if (ctx.model.configStorage.conf.exists(uid, type, name)) {
      ctx.throw(400, '配置文件名称已被占用');
    }
    // write
    const key = getStorageKey(`${scopeId}_${name}_${type}`);
    const content = Buffer.from(content, 'base64').toString('utf-8');
    await ctx.configStorage.storage.put(key, content);
    const conf = await ctx.model.configStorage.conf.create({
      uid: ctx.state.user.id,
      type,
      name,
      remark,
    });

    return conf.id;
  }
  async edit(ctx) {
    const { id, name, content, type, remark } = ctx.request.body;
    const { id: uid, scopeId } = ctx.state.user;
    // check db item
    const dbItem = await ctx.model.configStorage.conf.findByPk(id);
    if (!dbItem) {
      ctx.throw(400, '找不到该配置文件');
    }
    if (dbItem.uid !== uid) {
      ctx.throw(401, '无权访问');
    }
    // if name or type changed, delete cache and previous stored file.
    if (dbItem.name !== name || dbItem.type !== type) {
      if (ctx.model.configStorage.conf.exists(uid, type, name)) {
        ctx.throw(400, '名称已被占用');
      }
      const oldKey = `${scopeId}_${dbItem.type}_${dbItem.name}`;
      await ctx.configStorage.storage.del(getStorageKey(oldKey));
      this.cache.del(oldKey);
    }
    // update config file
    const key = `${scopeId}_${type}_${name}`;
    await ctx.configStorage.storage.put(key, content);
    // flush cache
    this.cache.del(key);
    await ctx.model.configStorage.conf.update({
      id,
      uid,
      name,
      type,
      remark,
    });
  }
  async delete(ctx, id) {
    const { scopeId } = ctx.state.user;
    const dbItem = await ctx.model.configStorage.conf.findByPk(id);
    if (!dbItem) {
      ctx.throw(400, '找不到该脚本');
    }
    if (!dbItem.uid !== ctx.state.user.id) {
      ctx.throw(401, '无权访问');
    }
    const key = `${scopeId}_${dbItem.type}_${dbItem.name}`;
    await ctx.configStorage.storage.del(getStorageKey(key));
    this.cache.del(key);
    await ctx.model.configStorage.conf.destory({
      where: {
        id,
      },
    });
  }
}

module.exports = ConfigStorageService;
