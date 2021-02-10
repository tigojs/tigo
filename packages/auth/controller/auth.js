const { successResponse } = require("@tigo/utils");
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
      scopeId: ctx.state.user.scopeId,
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
    ctx.set('Cache-Control', 'no-store');
    ctx.body = successResponse({
      uid: user.id,
      username: user.username,
      scopeId: user.scopeId,
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
    ctx.set('Cache-Control', 'no-store');
    ctx.body = successResponse(null, '注册成功');
  }
  async handleRefresh(ctx) {
    ctx.verifyParams({
      token: {
        type: 'string',
        required: true,
      },
    });
    const { token } = ctx.query;
    const decoded = await verifyToken(token, ctx.tigo.auth.secret);
    if (!decoded) {
      ctx.throw(400, '无法校验提交的Token');
    }
    const user = await ctx.model.auth.user.findByPk(decoded.id);
    if (!user) {
      ctx.throw(400, isDev ? 'Token包含的用户信息不正确' : 'Token类型不正确');
    }
    ctx.set('Cache-Control', 'no-store');
    ctx.body = successResponse({
      uid: user.id,
      useranme: user.username,
      scopeId: user.scopeId,
      ...createToken(user, ctx.tigo.auth.secret),
    });
  }
}

module.exports = AuthController;
