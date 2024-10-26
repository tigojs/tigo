const { BaseService } = require('@tigojs/core');
const { allowedType } = require('../constants/type');
const { v4: uuidv4 } = require('uuid');
const LRU = require('lru-cache');

const getStorageKey = (configId) => `confsto_item_${configId}`;

const generalCheck = async (ctx, id) => {
  const dbItem = await ctx.model.cfs.conf.findByPk(id);
  if (!dbItem) {
    ctx.throw(400, '找不到该配置文件');
  }
  if (dbItem.scopeId !== ctx.state.user.scopeId) {
    ctx.throw(401, '无权访问');
  }
  return dbItem;
}

class ConfigStorageService extends BaseService {
  constructor(app) {
    super(app);
    let { config } = app.config.plugins.cfs;
    if (!config) {
      app.logger.warn('Cannot find cache config for config storage plugin, use default options.');
      config = {};
    }
    let { cache: cacheConfig } = config;
    cacheConfig = cacheConfig || {};
    this.cache = new LRU({
      max: cacheConfig.max || 500,
      ttl: cacheConfig.maxAge || 60 * 60 * 1000,
      updateAgeOnGet: true,
    });
  }
  async getContentViaPublic(ctx, scopeId, type, name) {
    const key = `${scopeId}_${type}_${name}`;
    const stored = this.cache.get(key);
    if (stored) {
      return stored;
    }
    const content = await ctx.tigo.cfs.storage.getString(getStorageKey(key));
    if (!content) {
      return null;
    }
    const decoded = Buffer.from(content, 'base64').toString('utf-8');
    this.cache.set(key, decoded);
    return decoded;
  }
  async getContent(ctx, id) {
    const dbItem = await generalCheck(ctx, id);
    const ret = await ctx.tigo.cfs.storage.getString(getStorageKey(`${ctx.state.user.scopeId}_${dbItem.type}_${dbItem.name}`));
    return ret.toString();
  }
  async add(ctx) {
    const { name, content, type } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    // check type
    const formattedType = type.toLowerCase();
    if (!allowedType.includes(formattedType)) {
      ctx.throw(400, '不支持该类型的配置文件');
    }
    // check name
    if (await ctx.model.cfs.conf.exists(scopeId, formattedType, name)) {
      ctx.throw(400, '名称已被占用');
    }
    // write
    const key = getStorageKey(`${scopeId}_${formattedType}_${name}`);
    await ctx.tigo.cfs.storage.put(key, content);
    const conf = await ctx.model.cfs.conf.create({
      id: uuidv4(),
      scopeId: ctx.state.user.scopeId,
      type: formattedType,
      name,
    });

    return conf.id;
  }
  async edit(ctx) {
    const { id, name, content, type } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    // check type
    const formattedType = type.toLowerCase();
    if (!allowedType.includes(formattedType)) {
      ctx.throw(400, '不支持该类型的配置文件');
    }
    // check db item
    const dbItem = await generalCheck(ctx, id);
    // if name or type changed, delete cache and previous stored file.
    if (dbItem.name !== name || dbItem.type !== formattedType) {
      if (await ctx.model.cfs.conf.exists(scopeId, formattedType, name)) {
        ctx.throw(400, '名称已被占用');
      }
      const oldKey = `${scopeId}_${dbItem.type}_${dbItem.name}`;
      await ctx.tigo.cfs.storage.del(getStorageKey(oldKey));
      await ctx.model.cfs.conf.update({
        name,
        type: formattedType,
      }, {
        where: {
          id,
        },
      });
      this.cache.del(oldKey);
    }
    // update config file
    const key = `${scopeId}_${formattedType}_${name}`;
    await ctx.tigo.cfs.storage.put(getStorageKey(key), content);
    // broadcast events
    ctx.tigo.cfs.events.emit('content-updated', key);
    // flush cache
    this.cache.del(key);
  }
  async rename(ctx) {
    const { id, newName } = ctx.request.body;
    const { scopeId } = ctx.state.user;
    const dbItem = await generalCheck(ctx, id);
    if (await ctx.model.cfs.storage.exists(scopeId, dbItem.type, newName)) {
      ctx.throw(400, '名称已被占用');
    }
    await ctx.model.faas.script.update({
      name: newName,
    }, {
      where: {
        id,
      },
    });
    const key = `${scopeId}_${dbItem.type}_${dbItem.name}`;
    const newKey = `${scopeId}_${dbItem.type}_${newName}`;
    const content = await ctx.tigo.faas.storage.getString(key);
    if (!content) {
      ctx.throw(500, '无法找到对应的配置文件内容');
    }
    await ctx.tigo.cfs.storage.del(getStorageKey(key));
    this.cache.del(key);
    // broadcast events
    ctx.tigo.cfs.events.emit('content-updated', key);
    await ctx.tigo.cfs.storage.put(getStorageKey(newKey), content);
  }
  async delete(ctx, id) {
    const { scopeId } = ctx.state.user;
    const dbItem = await generalCheck(ctx, id);
    const key = `${scopeId}_${dbItem.type}_${dbItem.name}`;
    await ctx.tigo.cfs.storage.del(getStorageKey(key));
    // broadcast events
    ctx.tigo.cfs.events.emit('content-updated', key);
    this.cache.del(key);
    await ctx.model.cfs.conf.destroy({
      where: {
        id,
      },
    });
  }
}

module.exports = ConfigStorageService;
