class SecurePingController {
  getRoutes() {
    return {
      '/common/securePing': {
        type: 'get',
        auth: true,
        target: this.ping,
      },
    };
  }
  async ping(ctx) {
    ctx.body = successResponse({
      user: ctx.state.user
    });
  }
}

module.exports = SecurePingController;
