const { BaseService } = require('@tigojs/core');
const { v4: uuidv4 } = require('uuid');
const LRU = require('lru-cache');

const generalCheck = async (ctx, id) => {
  const dbItem = await ctx.model.auth.accessToken.findByPk(id);
  if (!dbItem) {
    ctx.throw(400, '找不到对应的Access Token');
  }
  if (dbItem.uid !== ctx.state.user.id) {
    ctx.throw(401, '无权访问');
  }
  return dbItem;
}

class ApiKeysService extends BaseService {
  constructor(app) {
    super(app);
    let { config } = app.config.plugins.auth;
    if (!config) {
      app.logger.warn('Cannot find cache config for config storage plugin, use default options.');
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
  async add(ctx) {
    const { id: uid } = ctx.state.user;
    const ak = uuidv4().replace(/-/g, '');
    const sk = uuidv4().replace(/-/g, '');
    await ctx.model.auth.accessToken.add({
      uid,
      ak,
      sk,
    });
    return { ak, sk };
  }
  async delete(ctx) {
    const { id } = ctx.request.body;
    const dbItem = await generalCheck(ctx, id);
    await ctx.model.auth.accessToken.destroy({
      where: {
        id,
      },
    });
    this.cache.del(dbItem.ak);
  }
}

module.exports = ApiKeysService;
