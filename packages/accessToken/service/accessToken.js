const { BaseService } = require('@tigo/core');

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

class AccessTokenService extends BaseService {
  async add(ctx) {

  }
  async delete(ctx) {
    const { id } = ctx.request.body;
    await generalCheck(ctx, id);
    await ctx.model.auth.accessToken.destroy({
      where: {
        id,
      },
    });
  }
}

module.exports = AccessTokenService;
