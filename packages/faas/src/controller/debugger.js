const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');
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
    const path = encodeURI(`/lambda/${scopeId}/${ctx.request.body.path}`);
    const requestPath = `http://127.0.0.1:${ctx.tigo.config.server.port}${path}`;
    const { method, headers: userHeaders, values } = ctx.request.body;
    const headers = {
      'Accept': 'application/json',
    };
    Object.assign(headers, userHeaders);
    let res;
    try {
      if (method === 'post') {
        res = await superagent
          .post(requestPath)
          .send(values)
          .query({
            __tigoDebug: 1,
          })
          .set(headers);
      } else if (method === 'get') {
        res = await superagent
          .get(requestPath)
          .query({
            ...values,
            __tigoDebug: 1,
          })
          .set(headers);
      }
      ctx.body = successResponse({
        status: res.status,
        text: res.text,
        body: res.body,
        headers: res.headers,
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'dev') {
        ctx.logger.error('Failed to send debug request.', err);
      }
      ctx.body = successResponse({
        status: err.response?.status || 200,
        text: err.response?.text || '',
        body: err.response?.body || null,
        headers: err.response?.headers || null,
      });
    }
  }
}

module.exports = DebuggerController;
