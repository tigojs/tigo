const { getPluginConfig } = require("@tigo/utils");
const { BaseController } = require('@tigo/core');

class AuthController extends BaseController {
  getRoutes() {
    const { auth } = getPluginConfig(this.app);
    return {
      '/auth/login': {
        type: 'get',
        target: this.handleLogin,
      },
      '/auth/register': {
        type: 'post',
        target: this.handleRegister,
        cond: () => !!auth.allowRegister,
      },
      '/auth/refresh': {
        type: 'get',
        target: this.handleRefresh,
      },
    };
  }
  handleLogin() {

  }
  handleRegister(ctx) {
    const { username, password, confirmPassword } = ctx.body;
    if (password !== confirmPassword) {
      ctx.throw(400, '两次输入的密码不一致');
    }
  }
  handleRefresh() {

  }
}

module.exports = AuthController;
