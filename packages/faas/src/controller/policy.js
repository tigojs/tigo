const { BaseController } = require('@tigojs/core');
const { successResponse } = require('@tigojs/utils');
const { getPolicyKey } = require('../utils/storage');
const { ownerCheck } = require('../utils/validate');

class PolicyController extends BaseController {
  getRoutes() {
    return {
      '/faas/getPolicy': {
        type: 'get',
        auth: true,
        target: this.handleGetPolicy,
      },
      '/faas/setPolicy': {
        type: 'post',
        auth: true,
        target: this.handleSetPolicy,
      },
    };
  }
  async handleGetPolicy(ctx) {
    ctx.verifyParams({
      lambdaId: {
        type: 'string',
        required: true,
      },
    });
    const { lambdaId } = ctx.query;
    await ownerCheck(ctx, lambdaId);
    // get policy
    const policy = await ctx.service.faas.policy.get(ctx, getPolicyKey(lambdaId));
    if (policy) {
      ctx.body = successResponse(policy);
    } else {
      ctx.body = successResponse({});
    }
  }
  async handleSetPolicy(ctx) {
    ctx.verifyParams({
      lambdaId: {
        type: 'string',
        required: true,
      },
      policy: {
        type: 'object',
        required: true,
      },
    });
    const { lambdaId } = ctx.request.body;
    await ownerCheck(ctx, lambdaId);
    // set policy
    await ctx.service.faas.policy.set(ctx, getPolicyKey(lambdaId), policy);
    ctx.body = successResponse();
  }
}

module.exports = PolicyController;
