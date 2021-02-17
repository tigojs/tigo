const { BaseController } = require('@tigo/core');
const superagent = require('superagent');

class DebuggerController extends BaseController {
  getRoutes() {
    return {
      '/faas/debug': {
        type: 'post',
        auth: true,
        target: this.handleDebug,
      }
    };
  }
  async handleDebug(ctx) {
    ctx.verifyParams({
      method: {
        type: 'enum',
        values: ['get', 'post'],
        required: true,
      },
      path: {
        type: 'string',
        required: true,
      },
      headers: {
        type: 'object',
        required: true,
      },
      values: {
        type: 'object',
        required: true,
      },
    });
    const { scopeId } = ctx.state.user;
    const path = `/lambda/${scopeId}/${ctx.request.body.path}`;
    const requestPath = `http://127.0.0.1:${ctx.tigo.config.server.port}${path}`;
    const { method, headers, values } = ctx.request.body;
    let res;
    if (method === 'post') {
      res = await superagent.post(requestPath).send(values).set(headers);
    } else if (method === 'get') {
      res = await superagent.get(requestPath).query(values).set(headers);
    }
    console.log(res)
  }
}

module.exports = DebuggerController;
