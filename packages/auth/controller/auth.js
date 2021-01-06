const { getPluginConfig } = require("tigo/utils/plugins");
const BaseController = require('tigo/base/controller');

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
        cond: () => { return !!auth; },
      },
      '/auth/refresh': {
        type: 'get',
        target: this.handleRefresh,
      },
    };
  }
  handleLogin() {

  }
  handleRegister() {

  }
  handleRefresh() {

  }
}

module.exports = AuthController;
