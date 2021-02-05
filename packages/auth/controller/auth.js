const { getPluginConfig, successResponse } = require("@tigo/utils");
const { BaseController } = require('@tigo/core');
const { createToken, verifyToken } = require("../utils/jwt");

const isDev = process.env.NODE_ENV === 'dev';

class AuthController extends BaseController {
  getRoutes() {
    return {
      '/auth/checkStatus': {
        type: 'get',
        auth: true,
        target: this.handleCheckStatus,
      },
      '/auth/login': {
        type: 'post',
        target: this.handleLogin,
      },
      '/auth/register': {
        type: 'post',
        target: this.handleRegister,
      },
      '/auth/refresh': {
        type: 'get',
        target: this.handleRefresh,
      },
    };
  }
  async handleCheckStatus(ctx) {
    ctx.body = successResponse({
      uid: ctx.state.user.id,
      username: ctx.state.user.username,
    });
  }
  async handleLogin(ctx) {
    ctx.verifyParams({
      username: {
        type: 'string',
        required: true,
      },
      password: {
        type: 'string',
        required: true,
      },
    });
    const { username, password } = ctx.request.body;
    const user = await ctx.service.auth.user.verify(ctx, username, password);
    ctx.body = successResponse({
      uid: user.id,
      user: user.username,
      token: createToken(user, ctx.tigo.auth.secret)
    });
  }
  async handleRegister(ctx) {
    ctx.verifyParams({
      username: {
        type: 'string',
        required: true,
      },
      password: {
        type: 'string',
        required: true,
      },
      confirmPassword: {
        type: 'string',
        required: true,
      },
    });
    const { username, password, confirmPassword } = ctx.request.body;
    if (password !== confirmPassword) {
      ctx.throw(400, '两次输入的密码不一致');
    }
    if (!ctx.service.auth.user.has(username)) {
      ctx.throw(400, '用户名已存在');
    }
    await ctx.service.auth.user.add(ctx, {
      username,
      password,
    });
    ctx.body = successResponse(null, '注册成功');
  }
  async handleRefresh(ctx) {
    ctx.verifyParams({
      token: {
        type: 'string',
        required: true,
      },
    });
    const decoded = await verifyToken(token, ctx.tigo.auth.secret);
    if (!decoded.type || decoded.type !== 'refresh') {
      ctx.throw(400, 'Token类型不正确');
    }
    const user = await ctx.model.auth.user.findByPk(decoded.id);
    if (!user) {
      ctx.throw(400, isDev ? 'Token包含的用户信息不正确' : 'Token类型不正确');
    }
    ctx.body = successResponse({
      uid: user.id,
      useranme: user.username,
      ...createToken(user, ctx.tigo.auth.secret),
    });
  }
}

module.exports = AuthController;
