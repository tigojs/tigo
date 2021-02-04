const { BaseService } = require('@tigo/core');
const crypto = require('crypto');

const isDev = process.env.NODE_ENV === 'dev';

class UserService extends BaseService {
  async add(ctx, user) {
    user.password = crypto.createHmac('sha256', 'tigo').update(user.password).digest('hex');
    // generate scopeId
    user.scopeId = crypto.createHmac('md5', 'tigo').update(`${user.username}_${new Date().valueOf()}`).digest('hex');
    await ctx.model.auth.user.create(user);
  }
  async has(ctx, username) {
    const ret = await ctx.model.auth.user.count({
      where: {
        username,
      },
    });
    return ret > 0;
  }
  async verify(ctx, username, password) {
    const user = await ctx.model.auth.user.findOne({
      where: {
        username,
      },
    });
    if (!user) {
      ctx.throw(400, isDev ? '无法找到该用户' : '用户名或密码错误');
    }
    const hashed = crypto.createHmac('sha256', 'tigo').update(password).digest('hex');
    if (hashed !== user.password) {
      ctx.throw(400, isDev ? '密码不正确' : '用户名或密码错误');
    }
    return user;
  }
}

module.exports = UserService;
